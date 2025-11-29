/**
 * Activity Monitor - Auto logout after inactivity
 * Tracks user interactions and logs out after period of no activity
 * Persists across tab closures using localStorage
 */

const INACTIVITY_TIMEOUT = 30 * 1000; // 30 seconds for testing
const WARNING_TIME = 20 * 1000; // Show warning 20 seconds before logout (at 10 seconds)
const LAST_ACTIVITY_KEY = 'lastActivityTime';

let activityTimer = null;
let warningTimer = null;

/**
 * Get last activity time from localStorage or current time
 */
function getLastActivity() {
  if (typeof window === 'undefined') return Date.now();
  const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
  return stored ? parseInt(stored, 10) : Date.now();
}

/**
 * Set last activity time in localStorage
 */
function setLastActivity(time) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_ACTIVITY_KEY, time.toString());
  }
}

/**
 * Events that count as user activity
 */
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click'
];

/**
 * Reset the inactivity timer
 */
function resetTimer(router) {
  const now = Date.now();
  setLastActivity(now);
  
  // Clear existing timers
  if (activityTimer) clearTimeout(activityTimer);
  if (warningTimer) clearTimeout(warningTimer);
  
  // Set warning timer (5 minutes before logout)
  warningTimer = setTimeout(() => {
    showWarning(router);
  }, INACTIVITY_TIMEOUT - WARNING_TIME);
  
  // Set logout timer (1 hour)
  activityTimer = setTimeout(() => {
    performLogout(router);
  }, INACTIVITY_TIMEOUT);
}

/**
 * Show warning before auto logout
 */
function showWarning(router) {
  const minutesRemaining = Math.floor(WARNING_TIME / 60000);
  
  if (window.confirm(
    `⚠️ Inactivity Warning\n\n` +
    `You will be logged out in ${minutesRemaining} minutes due to inactivity.\n\n` +
    `Click OK to stay logged in, or Cancel to logout now.`
  )) {
    // User wants to stay - reset timer
    resetTimer(router);
  } else {
    // User chose to logout
    performLogout(router);
  }
}

/**
 * Perform the logout
 */
function performLogout(router) {
  // Clear all timers
  if (activityTimer) clearTimeout(activityTimer);
  if (warningTimer) clearTimeout(warningTimer);
  
  // Clear user session
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    localStorage.removeItem('sessionToken');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    
    // Show logout message
    alert('🔒 Session Expired\n\nYou have been logged out due to inactivity.');
    
    // Redirect to login
    if (router) {
      router.push('/login');
    } else {
      window.location.href = '/login';
    }
  }
}

/**
 * Start monitoring user activity
 */
export function startActivityMonitor(router) {
  if (typeof window === 'undefined') return;
  
  // Check if user is logged in
  const user = localStorage.getItem('user');
  if (!user) return;
  
  // Check if session has already expired
  const lastActivity = getLastActivity();
  const elapsed = Date.now() - lastActivity;
  
  if (elapsed >= INACTIVITY_TIMEOUT) {
    // Session expired while tab was closed
    performLogout(router);
    return;
  }
  
  // Calculate remaining time
  const remainingTime = INACTIVITY_TIMEOUT - elapsed;
  const warningRemainingTime = (INACTIVITY_TIMEOUT - WARNING_TIME) - elapsed;
  
  // Set warning timer based on remaining time
  if (warningRemainingTime > 0) {
    warningTimer = setTimeout(() => {
      showWarning(router);
    }, warningRemainingTime);
  } else if (remainingTime > 0 && remainingTime <= WARNING_TIME) {
    // Already in warning period
    showWarning(router);
  }
  
  // Set logout timer based on remaining time
  if (remainingTime > 0) {
    activityTimer = setTimeout(() => {
      performLogout(router);
    }, remainingTime);
  }
  
  // Add event listeners for activity
  ACTIVITY_EVENTS.forEach(event => {
    window.addEventListener(event, () => resetTimer(router), { passive: true });
  });
  
  console.log(`✅ Activity monitor started - ${Math.floor(remainingTime / 60000)} minutes remaining`);
}

/**
 * Stop monitoring user activity
 */
export function stopActivityMonitor() {
  if (typeof window === 'undefined') return;
  
  // Clear timers but keep lastActivityTime in localStorage
  // so session persists across tab closures
  if (activityTimer) clearTimeout(activityTimer);
  if (warningTimer) clearTimeout(warningTimer);
  
  // Remove event listeners
  ACTIVITY_EVENTS.forEach(event => {
    window.removeEventListener(event, resetTimer);
  });
  
  console.log('🛑 Activity monitor stopped');
}

/**
 * Get time until auto logout (in milliseconds)
 */
export function getTimeUntilLogout() {
  const lastActivity = getLastActivity();
  if (!lastActivity) return 0;
  const elapsed = Date.now() - lastActivity;
  return Math.max(0, INACTIVITY_TIMEOUT - elapsed);
}

/**
 * Check if session is still valid
 */
export function isSessionValid() {
  const lastActivity = getLastActivity();
  if (!lastActivity) return false;
  const elapsed = Date.now() - lastActivity;
  return elapsed < INACTIVITY_TIMEOUT;
}
