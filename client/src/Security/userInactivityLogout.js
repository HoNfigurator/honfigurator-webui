import { useEffect, useRef } from 'react';

const events = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
];

const useInactivityLogout = (logoutFunction, inactivityTime = 60, isAuthenticated, setStateMessage) => {
  const timeoutIdRef = useRef(null);
  const milliseconds = inactivityTime * 1000;

  const logout = (reason) => {
    const message = reason === "inactivity" ? "You have been logged out due to inactivity." : "You have been logged out.";
    setStateMessage(message);
    logoutFunction(reason);
    // console.log(`[DEBUG] Logout triggered: ${message}`);
  };

  const resetTimer = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      console.log('[DEBUG] Timeout cleared');
    }

    const id = setTimeout(() => logout("inactivity"), milliseconds);
    timeoutIdRef.current = id;
    // console.log(`[DEBUG] Timeout set for ${milliseconds} milliseconds`);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // console.log('[DEBUG] User is authenticated, setting up inactivity logout');

    resetTimer();

    const setEventListeners = () => {
      events.forEach((event) =>
        window.addEventListener(event, resetTimer, { passive: true })
      );
      // console.log('[DEBUG] Event listeners set');
    };

    const removeEventListeners = () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetTimer, { passive: true })
      );
      // console.log('[DEBUG] Event listeners removed');
    };

    setEventListeners();

    return () => {
      removeEventListeners();
      clearTimeout(timeoutIdRef.current);
      // console.log('[DEBUG] Cleanup: Timeout and event listeners removed');
    };
  }, [isAuthenticated, milliseconds]);
};

export default useInactivityLogout;
