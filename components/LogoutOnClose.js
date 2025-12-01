"use client";
import { useEffect } from 'react';

/**
 * LogoutOnClose Component
 * Automatically logs out the user when they close the tab or window
 * Does NOT logout on refresh or navigation
 */
export default function LogoutOnClose() {
  useEffect(() => {
    // Check if we're coming back from a tab close
    const wasTabClosed = !sessionStorage.getItem('tabOpen');
    
    if (wasTabClosed) {
      // Tab was closed and reopened - logout
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
      localStorage.removeItem('sessionExpiresAt');
      localStorage.removeItem('lastActivityTime');
      localStorage.removeItem('studentProfile');
      localStorage.removeItem('studentProfilePhoto');
      localStorage.removeItem('pendingVerificationEmail');
      localStorage.removeItem('postVerifyRedirect');
      
      console.log('🔒 Session cleared - tab was closed');
    }
    
    // Mark tab as open
    sessionStorage.setItem('tabOpen', 'true');
    
    // Handle page visibility changes
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
          
          console.log('🔒 Session cleared - tab was reopened');
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
