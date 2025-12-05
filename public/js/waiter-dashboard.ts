/**
 * Staff login functionality
 * Handles authentication for waiters, managers, and kitchen staff
 */

const LOGIN_API_BASE = 'http://localhost:3000/api';

// State
let selectedRole: 'waiter' | 'manager' | 'kitchen' = 'waiter';

// DOM Elements
const roleButtons = document.querySelectorAll('.role-btn') as NodeListOf<HTMLElement>;
const loginForm = document.getElementById('login-form') as HTMLFormElement;
const loginMessage = document.getElementById('login-message') as HTMLElement;

/**
 * Initialize login page
 */
function initLogin(): void {
  setupEventListeners();
  checkExistingSession();
}

/**
 * Setup event listeners
 */
function setupEventListeners(): void {
  // Role selector buttons
  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role') as 'waiter' | 'manager' | 'kitchen';
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
function selectRole(role: 'waiter' | 'manager' | 'kitchen'): void {
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
async function handleLogin(e: Event): Promise<void> {
  e.preventDefault();

  if (!loginForm) return;

  const formData = new FormData(loginForm);
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    showLoginMessage('Please enter both username and password', 'error');
    return;
  }

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
      } else {
        localStorage.setItem('staffSession', JSON.stringify(sessionData));
      }

      // Redirect based on role
      redirectToDashboard(result.role);

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
 * Redirect user to appropriate dashboard based on role
 */
function redirectToDashboard(role: string): void {
  switch (role) {
    case 'waiter':
      window.location.href = 'waiter-dashboard.html';
      break;
    case 'manager':
      window.location.href = 'manager-dashboard.html';
      break;
    case 'kitchen':
      window.location.href = 'kitchen-dashboard.html';
      break;
    default:
      showLoginMessage('Unknown user role. Please contact administrator.', 'error');
  }
}

/**
 * Check if user is already logged in
 */
function checkExistingSession(): void {
  // Check for staff session first (waiter/manager)
  const staffSession = localStorage.getItem('staffSession');
  const kitchenSession = localStorage.getItem('kitchenSession');

  if (staffSession) {
    try {
      const sessionData = JSON.parse(staffSession);
      const sessionAge = Date.now() - sessionData.timestamp;
      const maxAge = 8 * 60 * 60 * 1000; // 8 hours

      if (sessionAge < maxAge) {
        redirectToDashboard(sessionData.role);
      } else {
        localStorage.removeItem('staffSession');
      }
    } catch (error) {
      localStorage.removeItem('staffSession');
    }
  } else if (kitchenSession) {
    try {
      const sessionData = JSON.parse(kitchenSession);
      const sessionAge = Date.now() - sessionData.timestamp;
      const maxAge = 8 * 60 * 60 * 1000; // 8 hours for kitchen staff

      if (sessionAge < maxAge) {
        redirectToDashboard(sessionData.role);
      } else {
        localStorage.removeItem('kitchenSession');
      }
    } catch (error) {
      localStorage.removeItem('kitchenSession');
    }
  }
}

/**
 * Show login message
 */
function showLoginMessage(message: string, type: 'success' | 'error'): void {
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
export function validateSession(expectedRole: 'waiter' | 'manager' | 'kitchen'): boolean {
  const sessionKey = expectedRole === 'kitchen' ? 'kitchenSession' : 'staffSession';
  const session = localStorage.getItem(sessionKey);

  if (!session) return false;

  try {
    const sessionData = JSON.parse(session);
    const sessionAge = Date.now() - sessionData.timestamp;
    const maxAge = expectedRole === 'kitchen'
        ? 8 * 60 * 60 * 1000  // 8 hours for kitchen
        : 24 * 60 * 60 * 1000; // 24 hours for others

    if (sessionAge < maxAge && sessionData.role === expectedRole) {
      return true;
    }

    // Session expired or wrong role
    localStorage.removeItem(sessionKey);
    return false;

  } catch (error) {
    localStorage.removeItem(sessionKey);
    return false;
  }
}

/**
 * Get current user info
 */
export function getCurrentUser(): { id: string; username: string; name: string; role: string } | null {
  // Try staff session first
  const staffSession = localStorage.getItem('staffSession');
  const kitchenSession = localStorage.getItem('kitchenSession');

  let session: string | null = null;

  if (staffSession) {
    session = staffSession;
  } else if (kitchenSession) {
    session = kitchenSession;
  }

  if (!session) return null;

  try {
    return JSON.parse(session);
  } catch (error) {
    return null;
  }
}

/**
 * Logout user
 */
export function logout(): void {
  // Remove both session types to be safe
  localStorage.removeItem('staffSession');
  localStorage.removeItem('kitchenSession');
  window.location.href = 'login.html';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogin);
} else {
  initLogin();
}