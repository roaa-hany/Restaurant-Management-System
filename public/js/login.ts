/**
 * Staff login functionality
 * Handles authentication for waiters and managers
 */

const LOGIN_API_BASE = 'http://localhost:3000/api';

// State
let selectedRole: 'waiter' | 'manager' = 'waiter';

// DOM Elements
const roleButtons = document.querySelectorAll('.role-btn');
const loginForm = document.getElementById('login-form') as HTMLFormElement;
const loginMessage = document.getElementById('login-message') as HTMLElement;

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
      const role = btn.getAttribute('data-role') as 'waiter' | 'manager';
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
 * Select role (waiter or manager)
 */
function selectRole(role: 'waiter' | 'manager') {
  selectedRole = role;
  roleButtons.forEach(btn => {
    if (btn.getAttribute('data-role') === role) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Handle login form submission
 */
async function handleLogin(e: Event) {
  e.preventDefault();
  
  if (!loginForm) return;

  const formData = new FormData(loginForm);
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  try {
    const response = await fetch(`${LOGIN_API_BASE}/auth/login`, {
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
      const result = await response.json();
      
      // Store session in localStorage
      localStorage.setItem('staffSession', JSON.stringify({
        username: result.username,
        role: result.role,
        token: result.token,
        timestamp: Date.now()
      }));

      // Redirect based on role
      if (result.role === 'waiter') {
        window.location.href = 'waiter-dashboard.html';
      } else if (result.role === 'manager') {
        window.location.href = 'manager-dashboard.html';
      }
    } else {
      const error = await response.json();
      showLoginMessage(error.error || 'Invalid credentials. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Error during login:', error);
    showLoginMessage('Error connecting to server. Please try again.', 'error');
  }
}

/**
 * Check if user is already logged in
 */
function checkExistingSession() {
  const session = localStorage.getItem('staffSession');
  if (session) {
    try {
      const sessionData = JSON.parse(session);
      // Check if session is still valid (24 hours)
      const sessionAge = Date.now() - sessionData.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (sessionAge < maxAge) {
        // Redirect to appropriate dashboard
        if (sessionData.role === 'waiter') {
          window.location.href = 'waiter-dashboard.html';
        } else if (sessionData.role === 'manager') {
          window.location.href = 'manager-dashboard.html';
        }
      } else {
        // Session expired
        localStorage.removeItem('staffSession');
      }
    } catch (error) {
      localStorage.removeItem('staffSession');
    }
  }
}

/**
 * Show login message
 */
function showLoginMessage(message: string, type: 'success' | 'error') {
  if (loginMessage) {
    loginMessage.textContent = message;
    loginMessage.className = `message ${type}`;
    setTimeout(() => {
      loginMessage.className = 'message';
    }, 5000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogin);
} else {
  initLogin();
}

