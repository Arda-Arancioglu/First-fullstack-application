// // src/utils/useSingleTabEnforcer.js
// import { useEffect, useRef, useCallback } from 'react';

// const TAB_ID_KEY = 'active_tab_id';
// const TAB_HEARTBEAT_KEY = 'tab_heartbeat';
// const HEARTBEAT_INTERVAL = 3000; // Check every 3 seconds
// const INACTIVE_THRESHOLD = 5000; // Consider a tab inactive if no heartbeat for 5 seconds

// /**
//  * A React Hook to enforce a single active browser tab per user.
//  * Displays an alert if another tab is detected as active.
//  *
//  * @param {Function} onMultipleTabsDetected Callback function when multiple tabs are detected.
//  * @param {Function} onMainTabLost Callback when this tab loses its 'main' status unexpectedly.
//  */
// export const useSingleTabEnforcer = (onMultipleTabsDetected, onMainTabLost) => {
//     const tabId = useRef(Date.now() + Math.random()); // Unique ID for this tab instance
//     const isMainTab = useRef(false);
//     const heartbeatIntervalRef = useRef(null);
//     const activityTimeoutRef = useRef(null);

//     // Function to set this tab as the main active tab
//     const setAsMainTab = useCallback(() => {
//         try {
//             localStorage.setItem(TAB_ID_KEY, tabId.current);
//             isMainTab.current = true;
//             console.log(`Tab ${tabId.current} is now the main tab.`);
//             if (activityTimeoutRef.current) {
//                 clearTimeout(activityTimeoutRef.current);
//             }
//             // Start heartbeat only if this is the main tab
//             if (!heartbeatIntervalRef.current) {
//                 heartbeatIntervalRef.current = setInterval(() => {
//                     localStorage.setItem(TAB_HEARTBEAT_KEY, Date.now());
//                 }, HEARTBEAT_INTERVAL);
//             }
//         } catch (error) {
//             console.error("Failed to access localStorage:", error);
//             // Fallback for private Browse or restricted environments
//             // You might want to alert the user about limited functionality
//             alert("Your browser settings might prevent multi-tab detection. Please ensure cookies and local storage are enabled.");
//         }
//     }, []);

//     // Function to check for other active tabs
//     const checkForOtherTabs = useCallback(() => {
//         try {
//             const activeTabId = localStorage.getItem(TAB_ID_KEY);
//             const lastHeartbeat = localStorage.getItem(TAB_HEARTBEAT_KEY);

//             // If there's an activeTabId set by another tab
//             if (activeTabId && parseFloat(activeTabId) !== tabId.current) {
//                 // Check if the other tab is still actively sending heartbeats
//                 if (lastHeartbeat && (Date.now() - parseFloat(lastHeartbeat) < INACTIVE_THRESHOLD)) {
//                     // Another tab is active and sending heartbeats
//                     isMainTab.current = false;
//                     clearInterval(heartbeatIntervalRef.current);
//                     heartbeatIntervalRef.current = null;
//                     console.warn(`Tab ${tabId.current}: Another tab (${activeTabId}) is active.`);
//                     if (onMultipleTabsDetected) {
//                         onMultipleTabsDetected();
//                     }
//                 } else {
//                     // The other tab is no longer active, claim main tab status
//                     console.log(`Tab ${activeTabId} is inactive. Claiming main tab status for ${tabId.current}.`);
//                     setAsMainTab();
//                 }
//             } else if (!activeTabId) {
//                 // No active tab set, so this tab can claim it
//                 setAsMainTab();
//             } else if (parseFloat(activeTabId) === tabId.current) {
//                 // This tab is already the main tab, just update heartbeat
//                 localStorage.setItem(TAB_HEARTBEAT_KEY, Date.now());
//                 isMainTab.current = true;
//             }
//         } catch (error) {
//             console.error("Failed to access localStorage:", error);
//         }
//     }, [onMultipleTabsDetected, setAsMainTab]);

//     useEffect(() => {
//         // Initial check and attempt to claim main tab status
//         checkForOtherTabs();

//         // Listen for storage events (when other tabs modify localStorage)
//         const handleStorageChange = (event) => {
//             if (event.key === TAB_ID_KEY || event.key === TAB_HEARTBEAT_KEY) {
//                 if (!isMainTab.current) { // Only check if this tab isn't already declared main
//                     checkForOtherTabs();
//                 } else { // If this is main, and we detect a change, re-verify
//                     const activeTabId = localStorage.getItem(TAB_ID_KEY);
//                     if (activeTabId && parseFloat(activeTabId) !== tabId.current) {
//                         isMainTab.current = false;
//                         clearInterval(heartbeatIntervalRef.current);
//                         heartbeatIntervalRef.current = null;
//                         if (onMainTabLost) {
//                             onMainTabLost();
//                         }
//                         if (onMultipleTabsDetected) { // Also alert if another tab took over
//                             onMultipleTabsDetected();
//                         }
//                     }
//                 }
//             }
//         };

//         // Listen for window focus/blur to re-check when tab becomes active
//         const handleFocus = () => {
//             checkForOtherTabs();
//         };

//         // Before the tab closes, try to release its claim
//         const handleBeforeUnload = () => {
//             if (isMainTab.current) {
//                 const activeTabId = parseFloat(localStorage.getItem(TAB_ID_KEY));
//                 if (activeTabId === tabId.current) {
//                     // Only remove if this tab is indeed the one currently marked as main
//                     localStorage.removeItem(TAB_ID_KEY);
//                     localStorage.removeItem(TAB_HEARTBEAT_KEY);
//                     console.log(`Tab ${tabId.current} released main tab status on unload.`);
//                 }
//             }
//         };

//         window.addEventListener('storage', handleStorageChange);
//         window.addEventListener('focus', handleFocus);
//         window.addEventListener('beforeunload', handleBeforeUnload);

//         // Cleanup on component unmount
//         return () => {
//             clearInterval(heartbeatIntervalRef.current);
//             clearTimeout(activityTimeoutRef.current); // Clear any pending timeouts
//             window.removeEventListener('storage', handleStorageChange);
//             window.removeEventListener('focus', handleFocus);
//             window.removeEventListener('beforeunload', handleBeforeUnload);

//             // Clean up if this was the main tab when unmounted (e.g., user navigates away)
//             if (isMainTab.current) {
//                 const activeTabId = parseFloat(localStorage.getItem(TAB_ID_KEY));
//                 if (activeTabId === tabId.current) {
//                     localStorage.removeItem(TAB_ID_KEY);
//                     localStorage.removeItem(TAB_HEARTBEAT_KEY);
//                     console.log(`Tab ${tabId.current} released main tab status on unmount.`);
//                 }
//             }
//         };
//     }, [checkForOtherTabs, onMultipleTabsDetected, onMainTabLost, setAsMainTab]);

//     return isMainTab.current; // Return the current status if needed by the component
// };
