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
 * A React Hook to enforce a single active browser tab per user.
 * Displays an alert if another tab is detected as active.
 *
 * @param {Function} onMultipleTabsDetected Callback function when multiple tabs are detected.
 * @param {Function} onMainTabLost Callback when this tab loses its 'main' status unexpectedly.
 */
export const useSingleTabEnforcer = (onMultipleTabsDetected, onMainTabLost) => {
    const tabId = useRef(Date.now() + Math.random()); // Unique ID for this tab instance
    const [isMainTab, setIsMainTab] = useState(false); // Use state for reactivity
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
            alert("Your browser settings might prevent multi-tab detection. Please ensure cookies and local storage are enabled.");
        }
    }, []);

    // Function to check for other active tabs
    const checkForOtherTabs = useCallback(() => {
        try {
            const activeTabId = localStorage.getItem(TAB_ID_KEY);
            const lastHeartbeat = localStorage.getItem(TAB_HEARTBEAT_KEY);
            const currentTime = Date.now();

            // Scenario 1: Another tab is marked as active
            if (activeTabId && parseFloat(activeTabId) !== tabId.current) {
                // Check if the other tab is still actively sending heartbeats
                if (lastHeartbeat && (currentTime - parseFloat(lastHeartbeat) < INACTIVE_THRESHOLD)) {
                    // Another tab is indeed active and fresh
                    if (isMainTab) { // If this tab *was* main, but now another is, trigger onMainTabLost
                        console.warn(`Tab ${tabId.current}: Lost main tab status to ${activeTabId}.`);
                        if (onMainTabLost) {
                            onMainTabLost();
                        }
                    }
                    setIsMainTab(false);
                    setAxiosMainTabStatus(false); // Update global status for axios
                    clearInterval(heartbeatIntervalRef.current);
                    heartbeatIntervalRef.current = null;
                    console.warn(`Tab ${tabId.current}: Another tab (${activeTabId}) is active.`);
                    if (onMultipleTabsDetected) {
                        onMultipleTabsDetected();
                    }
                } else {
                    // The other tab is no longer active (heartbeat too old or missing), claim main tab status
                    console.log(`Tab ${activeTabId} is inactive. Claiming main tab status for ${tabId.current}.`);
                    setAsMainTab();
                }
            }
            // Scenario 2: No active tab set, or this tab is already the active one
            else if (!activeTabId || parseFloat(activeTabId) === tabId.current) {
                // If no active tab or this tab is already marked as main, ensure it stays main
                setAsMainTab();
            }
        } catch (error) {
            console.error("Failed to access localStorage:", error);
        }
    }, [isMainTab, onMultipleTabsDetected, onMainTabLost, setAsMainTab]);

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
            if (isMainTab) {
                const activeTabIdInStorage = parseFloat(localStorage.getItem(TAB_ID_KEY));
                if (activeTabIdInStorage === tabId.current) {
                    // Only remove if this tab is indeed the one currently marked as main
                    localStorage.removeItem(TAB_ID_KEY);
                    localStorage.removeItem(TAB_HEARTBEAT_KEY);
                    console.log(`Tab ${tabId.current} released main tab status on unload.`);
                }
            }
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
            if (isMainTab) {
                const activeTabIdInStorage = parseFloat(localStorage.getItem(TAB_ID_KEY));
                if (activeTabIdInStorage === tabId.current) {
                    localStorage.removeItem(TAB_ID_KEY);
                    localStorage.removeItem(TAB_HEARTBEAT_KEY);
                    console.log(`Tab ${tabId.current} released main tab status on unmount.`);
                }
            }
            setAxiosMainTabStatus(false); // Ensure axios status is reset on unmount
            setAxiosMultipleTabsDetectedCallback(null); // Clear callback
        };
    }, [checkForOtherTabs, onMultipleTabsDetected, onMainTabLost, setAsMainTab, isMainTab]); // Add isMainTab to dependencies

    return isMainTab; // Return the current status for component to use
};
