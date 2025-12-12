"use client";
import { useEffect } from 'react';

/**
 * Session termination handler for browser tab/window closure
 * Clears authentication state on tab close while preserving session during navigation
 */
export default function LogoutOnClose() {
  useEffect(() => {
    // Detect session restoration after tab closure
    const wasTabClosed = !sessionStorage.getItem('tabOpen');
    
    if (wasTabClosed) {
      // Clear authentication state on tab restoration
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionExpiresAt');
      localStorage.removeItem('lastActivityTime');
      localStorage.removeItem('studentProfile');
      localStorage.removeItem('studentProfilePhoto');
      localStorage.removeItem('pendingVerificationEmail');
      localStorage.removeItem('postVerifyRedirect');
    }
    
    // Set session tracking flag
    sessionStorage.setItem('tabOpen', 'true');
    
    // Register visibility state change handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if still logged in
        const token = localStorage.getItem('sessionToken');
        if (token && !sessionStorage.getItem('tabOpen')) {
          // Tab was reopened after being closed
          localStorage.removeItem('sessionToken');
          localStorage.removeItem('user');
          localStorage.removeItem('sessionExpiresAt');
          localStorage.removeItem('lastActivityTime');
          localStorage.removeItem('studentProfile');
          localStorage.removeItem('studentProfilePhoto');
          localStorage.removeItem('pendingVerificationEmail');
          localStorage.removeItem('postVerifyRedirect');
          
          window.location.reload();
        }
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
