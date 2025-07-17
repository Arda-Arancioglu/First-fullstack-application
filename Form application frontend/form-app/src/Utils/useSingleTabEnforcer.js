// src/utils/useSingleTabEnforcer.js
import { useEffect, useRef, useCallback, useState } from 'react';

const TAB_ID_KEY = 'active_tab_id';
const TAB_HEARTBEAT_KEY = 'tab_heartbeat';
const HEARTBEAT_INTERVAL = 3000; // Check every 3 seconds
const INACTIVE_THRESHOLD = 5000; // Consider a tab inactive if no heartbeat for 5 seconds

// Global variable to hold the main tab status for axios interceptor
let _isMainTabActive = false;
let _onMultipleTabsDetectedCallback = null; // Callback for axios to trigger

// Setter function for axios to update the main tab status
export const setAxiosMainTabStatus = (status) => {
    _isMainTabActive = status;
};

// Getter for axios to check the main tab status
export const getAxiosMainTabStatus = () => {
    return _isMainTabActive;
};

// Setter for axios to register the multiple tabs detected callback
export const setAxiosMultipleTabsDetectedCallback = (callback) => {
    _onMultipleTabsDetectedCallback = callback;
};

/**
 * Function to explicitly release the main tab claim from localStorage.
 * This should be called on logout or when a tab is definitively closing.
 */
const releaseMainTabClaim = (currentTabId) => {
    try {
        const activeTabIdInStorage = parseFloat(localStorage.getItem(TAB_ID_KEY));
        if (activeTabIdInStorage === currentTabId) {
            localStorage.removeItem(TAB_ID_KEY);
            localStorage.removeItem(TAB_HEARTBEAT_KEY);
            console.log(`Tab ${currentTabId} explicitly released main tab status.`);
        }
    } catch (error) {
        console.error("Failed to access localStorage during release:", error);
    }
    setAxiosMainTabStatus(false); // Ensure global axios status is reset
};

/**
 * A React Hook to enforce a single active browser tab per user.
 * Displays an alert if another tab is detected as active.
 *
 * @param {Function} onMultipleTabsDetected Callback function when multiple tabs are detected.
 * @param {Function} onMainTabLost Callback when this tab loses its 'main' status unexpectedly.
 * @returns {Object} An object containing `isMainTab` boolean and `releaseMainTab` function.
 */
export const useSingleTabEnforcer = (onMultipleTabsDetected, onMainTabLost) => {
    const tabId = useRef(Date.now() + Math.random()); // Unique ID for this tab instance
    const [isMainTab, setIsMainTab] = useState(false); // Use state for reactivity
    const [isLogoutInProgress, setIsLogoutInProgress] = useState(false); // New state to signal logout
    const heartbeatIntervalRef = useRef(null);

    // Function to set this tab as the main active tab
    const setAsMainTab = useCallback(() => {
        try {
            localStorage.setItem(TAB_ID_KEY, tabId.current);
            localStorage.setItem(TAB_HEARTBEAT_KEY, Date.now()); // Set initial heartbeat
            setIsMainTab(true);
            setAxiosMainTabStatus(true); // Update global status for axios
            console.log(`Tab ${tabId.current} is now the main tab.`);

            // Clear any existing heartbeat interval before setting a new one
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            // Start heartbeat for this main tab
            heartbeatIntervalRef.current = setInterval(() => {
                localStorage.setItem(TAB_HEARTBEAT_KEY, Date.now());
            }, HEARTBEAT_INTERVAL);

        } catch (error) {
            console.error("Failed to access localStorage:", error);
            // TODO: Replace with custom modal UI for alert
            alert("Your browser settings might prevent multi-tab detection. Please ensure cookies and local storage are enabled.");
        }
    }, []);

    // Function to check for other active tabs
    const checkForOtherTabs = useCallback(() => {
        // If a logout is in progress, do not trigger multi-tab alerts
        if (isLogoutInProgress) {
            console.log("SingleTabEnforcer: Logout in progress, suppressing multi-tab check.");
            return;
        }

        try {
            const activeTabIdInStorage = localStorage.getItem(TAB_ID_KEY);
            const lastHeartbeatInStorage = localStorage.getItem(TAB_HEARTBEAT_KEY);
            const currentTime = Date.now();

            const isOtherTabCurrentlyActive = activeTabIdInStorage &&
                                             parseFloat(activeTabIdInStorage) !== tabId.current &&
                                             lastHeartbeatInStorage &&
                                             (currentTime - parseFloat(lastHeartbeatInStorage) < INACTIVE_THRESHOLD);

            if (isOtherTabCurrentlyActive) {
                // Another tab is currently active and sending heartbeats
                if (isMainTab) { // If this tab was previously main, but now isn't
                    console.warn(`Tab ${tabId.current}: Lost main tab status to ${activeTabIdInStorage}.`);
                    if (onMainTabLost) {
                        onMainTabLost();
                    }
                }
                setIsMainTab(false); // This tab is no longer the main tab
                setAxiosMainTabStatus(false);
                clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = null;
                console.warn(`Tab ${tabId.current}: Another tab (${activeTabIdInStorage}) is active.`);
                if (onMultipleTabsDetected) {
                    onMultipleTabsDetected();
                }
            } else {
                // No other active tab, or the existing active tab is stale, so this tab can claim/re-claim main status
                setAsMainTab(); // This will set isMainTab(true) and start/restart heartbeat
            }
        } catch (error) {
            console.error("Failed to access localStorage:", error);
            // Optionally, handle this error more gracefully in the UI
        }
    }, [isMainTab, onMultipleTabsDetected, onMainTabLost, setAsMainTab, isLogoutInProgress]); // Added isLogoutInProgress

    // Expose the release function
    const releaseThisTab = useCallback(() => {
        releaseMainTabClaim(tabId.current);
        setIsMainTab(false); // Update local state
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
    }, []);

    useEffect(() => {
        // Set the callback for axios instance
        setAxiosMultipleTabsDetectedCallback(onMultipleTabsDetected);

        // Initial check and attempt to claim main tab status
        checkForOtherTabs();

        // Listen for storage events (when other tabs modify localStorage)
        const handleStorageChange = (event) => {
            if (event.key === TAB_ID_KEY || event.key === TAB_HEARTBEAT_KEY) {
                checkForOtherTabs(); // Re-evaluate status whenever relevant localStorage changes
            }
        };

        // Listen for window focus/blur to re-check when tab becomes active
        const handleFocus = () => {
            console.log(`Tab ${tabId.current}: Gained focus. Re-checking main tab status.`);
            checkForOtherTabs();
        };

        // Before the tab closes, try to release its claim
        const handleBeforeUnload = () => {
            // Only release if this tab is the one currently marked as main
            releaseMainTabClaim(tabId.current);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup on component unmount
        return () => {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null; // Ensure interval is cleared

            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('beforeunload', handleBeforeUnload);

            // Clean up if this was the main tab when unmounted (e.g., user navigates away)
            releaseMainTabClaim(tabId.current); // Ensure cleanup on unmount
            setAxiosMultipleTabsDetectedCallback(null); // Clear callback
        };
    }, [checkForOtherTabs, onMultipleTabsDetected, onMainTabLost, setAsMainTab]);

    return { isMainTab, releaseMainTab: releaseThisTab, setIsLogoutInProgress }; // Return the status, release function, and new setter
};
