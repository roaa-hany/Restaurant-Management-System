"use strict";
/**
 * Manager dashboard functionality
 * Handles authentication check and logout
 */
/**
 * Check authentication and redirect if not logged in
 */
function checkManagerAuth() {
    const session = localStorage.getItem('staffSession');
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    try {
        const sessionData = JSON.parse(session);
        if (sessionData.role !== 'manager') {
            window.location.href = 'login.html';
            return;
        }
    }
    catch (error) {
        window.location.href = 'login.html';
    }
}
/**
 * Handle logout
 */
function handleManagerLogout() {
    localStorage.removeItem('staffSession');
    window.location.href = 'login.html';
}
/**
 * Initialize manager dashboard
 */
function initManagerDashboard() {
    checkManagerAuth();
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleManagerLogout);
    }
}
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initManagerDashboard);
}
else {
    initManagerDashboard();
}
