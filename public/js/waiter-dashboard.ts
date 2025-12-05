/**
 * Waiter dashboard functionality
 * Handles authentication check and logout
 */

/**
 * Check authentication and redirect if not logged in
 */
function checkWaiterAuth() {
  const session = localStorage.getItem('staffSession');
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const sessionData = JSON.parse(session);
    if (sessionData.role !== 'waiter') {
      window.location.href = 'login.html';
      return;
    }
  } catch (error) {
    window.location.href = 'login.html';
  }
}

/**
 * Handle logout
 */
function handleWaiterLogout() {
  localStorage.removeItem('staffSession');
  window.location.href = 'login.html';
}

/**
 * Initialize waiter dashboard
 */
function initWaiterDashboard() {
  checkWaiterAuth();

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleWaiterLogout);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWaiterDashboard);
} else {
  initWaiterDashboard();
}