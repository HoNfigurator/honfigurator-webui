// security/userInactivityLogout.js

import { useEffect, useState, useRef } from 'react';

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
    setStateMessage(reason === "inactivity" ? "You have been logged out due to inactivity." : "You have been logged out.");
    logoutFunction(reason);
  };

  const resetTimer = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    const id = setTimeout(() => logout("inactivity"), milliseconds);
    timeoutIdRef.current = id;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    resetTimer();

    const setEventListeners = () => {
      events.forEach((event) =>
        window.addEventListener(
          event,
          resetTimer,
          { passive: true }
        )
      );
    };

    const removeEventListeners = () => {
      events.forEach((event) =>
        window.removeEventListener(
          event,
          resetTimer,
          { passive: true }
        )
      );
    };

    setEventListeners();

    return () => {
      removeEventListeners();
      clearTimeout(timeoutIdRef.current);
    };
  }, [isAuthenticated, milliseconds]);
};

  
export default useInactivityLogout;
