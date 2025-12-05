"use strict";
/**
 * Staff login functionality
 * Handles authentication for waiters, managers, and kitchen staff
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const LOGIN_API_BASE = 'http://localhost:3000/api';
// State
let selectedRole = 'waiter';
// DOM Elements
const roleButtons = document.querySelectorAll('.role-btn');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
/**
 * Initialize login page
 */
function initLogin() {
    setupEventListeners();
    checkExistingSession();
}
/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Role selector buttons
    roleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const role = btn.getAttribute('data-role');
            if (role) {
                selectRole(role);
            }
        });
    });
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}
/**
 * Select role (waiter, manager, or kitchen)
 */
function selectRole(role) {
    selectedRole = role;
    roleButtons.forEach(btn => {
        if (btn.getAttribute('data-role') === role) {
            btn.classList.add('active');
        }
        else {
            btn.classList.remove('active');
        }
    });
}
/**
 * Handle login form submission
 */
function handleLogin(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        if (!loginForm)
            return;
        const formData = new FormData(loginForm);
        const username = formData.get('username');
        const password = formData.get('password');
        if (!username || !password) {
            showLoginMessage('Please enter both username and password', 'error');
            return;
        }
        try {
            const response = yield fetch(`${LOGIN_API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    role: selectedRole
                })
            });
            if (response.ok) {
                const result = yield response.json();
                // Store session in localStorage with role-specific storage
                const sessionData = {
                    id: result.id,
                    username: result.username,
                    name: result.name || username,
                    role: result.role,
                    token: result.token,
                    timestamp: Date.now()
                };
                // Store in localStorage with role-specific key
                if (result.role === 'kitchen') {
                    localStorage.setItem('kitchenSession', JSON.stringify(sessionData));
                }
                else {
                    localStorage.setItem('staffSession', JSON.stringify(sessionData));
                }
                // Redirect based on role
                redirectToDashboard(result.role);
            }
            else {
                const error = yield response.json();
                showLoginMessage(error.error || 'Invalid credentials. Please try again.', 'error');
            }
        }
        catch (error) {
            console.error('Error during login:', error);
            showLoginMessage('Error connecting to server. Please try again.', 'error');
        }
    });
}
/**
 * Redirect user to appropriate dashboard based on role
 */
function redirectToDashboard(role) {
    switch (role) {
        case 'waiter':
            window.location.href = 'waiter-dashboard.html';
            break;
        case 'manager':
            window.location.href = 'manager-dashboard.html';
            break;
        case 'kitchen':
            window.location.href = 'Kitchen.html';
            break;
        default:
            showLoginMessage('Unknown user role. Please contact administrator.', 'error');
    }
}
/**
 * Check if user is already logged in
 * Modified: Only redirect if there's a "autoRedirect" flag or parameter
 */
function checkExistingSession() {
    console.log("Checking existing session...");

    // Check URL parameters for auto-redirect flag
    const urlParams = new URLSearchParams(window.location.search);
    const autoRedirect = urlParams.get('autoRedirect') !== 'false';

    if (!autoRedirect) {
        console.log("Auto-redirect disabled, staying on login page");
        return;
    }

    // Check for staff session first (waiter/manager)
    const staffSession = localStorage.getItem('staffSession');
    const kitchenSession = localStorage.getItem('kitchenSession');

    if (staffSession) {
        try {
            const sessionData = JSON.parse(staffSession);
            const sessionAge = Date.now() - sessionData.timestamp;
            const maxAge = 8 * 60 * 60 * 1000; // 8 hours

            if (sessionAge < maxAge) {
                console.log("Valid staff session found, redirecting...");
                redirectToDashboard(sessionData.role);
            } else {
                console.log("Staff session expired");
                localStorage.removeItem('staffSession');
            }
        } catch (error) {
            console.error("Error parsing staff session:", error);
            localStorage.removeItem('staffSession');
        }
    } else if (kitchenSession) {
        try {
            const sessionData = JSON.parse(kitchenSession);
            const sessionAge = Date.now() - sessionData.timestamp;
            const maxAge = 8 * 60 * 60 * 1000; // 8 hours for kitchen staff

            if (sessionAge < maxAge) {
                console.log("Valid kitchen session found, redirecting...");
                redirectToDashboard(sessionData.role);
            } else {
                console.log("Kitchen session expired");
                localStorage.removeItem('kitchenSession');
            }
        } catch (error) {
            console.error("Error parsing kitchen session:", error);
            localStorage.removeItem('kitchenSession');
        }
    } else {
        console.log("No valid session found");
    }
}
/**
 * Show login message
 */
function showLoginMessage(message, type) {
    if (loginMessage) {
        loginMessage.textContent = message;
        loginMessage.className = `message ${type}`;
        setTimeout(() => {
            loginMessage.className = 'message';
        }, 5000);
    }
}
/**
 * Validate session for specific role
 */
function validateSession(expectedRole) {
    const sessionKey = expectedRole === 'kitchen' ? 'kitchenSession' : 'staffSession';
    const session = localStorage.getItem(sessionKey);
    if (!session)
        return false;
    try {
        const sessionData = JSON.parse(session);
        const sessionAge = Date.now() - sessionData.timestamp;
        const maxAge = expectedRole === 'kitchen'
            ? 8 * 60 * 60 * 1000 // 8 hours for kitchen
            : 24 * 60 * 60 * 1000; // 24 hours for others
        if (sessionAge < maxAge && sessionData.role === expectedRole) {
            return true;
        }
        // Session expired or wrong role
        localStorage.removeItem(sessionKey);
        return false;
    }
    catch (error) {
        localStorage.removeItem(sessionKey);
        return false;
    }
}
exports.validateSession = validateSession;
/**
 * Get current user info
 */
function getCurrentUser() {
    // Try staff session first
    const staffSession = localStorage.getItem('staffSession');
    const kitchenSession = localStorage.getItem('kitchenSession');
    let session = null;
    if (staffSession) {
        session = staffSession;
    }
    else if (kitchenSession) {
        session = kitchenSession;
    }
    if (!session)
        return null;
    try {
        return JSON.parse(session);
    }
    catch (error) {
        return null;
    }
}
exports.getCurrentUser = getCurrentUser;
/**
 * Logout user
 */
function logout() {
    // Remove both session types to be safe
    localStorage.removeItem('staffSession');
    localStorage.removeItem('kitchenSession');
    window.location.href = 'login.html';
}
exports.logout = logout;
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogin);
}
else {
    initLogin();
}