/**
 * Customer-facing application logic
 * Handles menu display, filtering, item details, and reservations
 */

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  ingredients: string[];
  allergens: string[];
}

// Scoped constants and variables for customer app
const CUSTOMER_API_BASE = 'http://localhost:3000/api';

// State
let customerMenuItems: MenuItem[] = [];
let currentCategory: string = 'all';

// DOM Elements
const menuContainer = document.getElementById('menu-container') as HTMLElement;
const categoryFilters = document.querySelectorAll('.filter-btn');
const customerNavButtons = document.querySelectorAll('.nav-btn');
const customerViews = document.querySelectorAll('.view');
const modal = document.getElementById('item-modal') as HTMLElement;
const modalBody = document.getElementById('modal-body') as HTMLElement;
const closeModal = document.querySelector('.close') as HTMLElement;
const reservationForm = document.getElementById('reservation-form') as HTMLFormElement;
const reservationMessage = document.getElementById('reservation-message') as HTMLElement;
const tableNumberSelect = document.getElementById('tableNumber') as HTMLSelectElement;
const feedbackForm = document.getElementById('feedback-form') as HTMLFormElement;
const feedbackMessage = document.getElementById('feedback-message') as HTMLElement;

/**
 * Initialize the customer application
 */
async function initCustomerApp() {
  await loadMenu();
  await loadTables();
  setupCustomerEventListeners();
}

/**
 * Load menu items from API
 */
async function loadMenu() {
  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/menu`);
    customerMenuItems = await response.json();
    displayMenu(customerMenuItems);
  } catch (error) {
    console.error('Error loading menu:', error);
    showCustomerMessage(menuContainer, 'Error loading menu. Please try again later.', 'error');
  }
}

/**
 * Display menu items in the container
 */
function displayMenu(items: MenuItem[]) {
  if (!menuContainer) return;

  if (items.length === 0) {
    menuContainer.innerHTML = '<p>No items found in this category.</p>';
    return;
  }

  menuContainer.innerHTML = items.map(item => `
    <div class="menu-item" data-item-id="${item.id}">
      <img src="${item.imageUrl}" alt="${item.name}" class="menu-item-image" onerror="this.style.backgroundColor='#e0e0e0'; this.style.display='flex'; this.style.alignItems='center'; this.style.justifyContent='center'; this.innerHTML='<span style=\\'color:#999;\\'>${item.name}</span>'">
      <div class="menu-item-content">
        <h3 class="menu-item-name">${item.name}</h3>
        <p class="menu-item-description">${item.description}</p>
        <div class="menu-item-price">${item.price.toFixed(2)} EGP</div>
        <div class="menu-item-details">
          <span class="view-ingredients" data-item-id="${item.id}">View Ingredients</span>
          <span class="view-allergens" data-item-id="${item.id}">View Allergens</span>
        </div>
      </div>
    </div>
  `).join('');

  // Add click handlers for menu items
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('view-ingredients') || target.classList.contains('view-allergens')) {
        return; // Let the specific handlers deal with this
      }
      const itemId = item.getAttribute('data-item-id');
      if (itemId) {
        showItemDetails(itemId);
      }
    });
  });

  // Add click handlers for ingredients/allergens
  document.querySelectorAll('.view-ingredients').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = btn.getAttribute('data-item-id');
      if (itemId) {
        showItemDetails(itemId, 'ingredients');
      }
    });
  });

  document.querySelectorAll('.view-allergens').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = btn.getAttribute('data-item-id');
      if (itemId) {
        showItemDetails(itemId, 'allergens');
      }
    });
  });
}

/**
 * Filter menu by category
 */
function filterByCategory(category: string) {
  currentCategory = category;
  
  // Update active filter button
  categoryFilters.forEach(btn => {
    const btnCategory = btn.getAttribute('data-category');
    if (btnCategory === category) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Filter and display items
  const filtered = category === 'all' 
    ? customerMenuItems 
    : customerMenuItems.filter(item => item.category === category);
  
  displayMenu(filtered);
}

/**
 * Show item details in modal
 */
function showItemDetails(itemId: string, focus?: 'ingredients' | 'allergens') {
  const item = customerMenuItems.find(m => m.id === itemId);
  if (!item) return;

  const ingredientsHTML = `
    <div class="ingredients-list">
      <h3>Ingredients</h3>
      <ul>
        ${item.ingredients.map(ing => `<li>${ing}</li>`).join('')}
      </ul>
    </div>
  `;

  const allergensHTML = item.allergens.length > 0 ? `
    <div class="allergens-list">
      <h3>⚠️ Allergens</h3>
      <ul>
        ${item.allergens.map(all => `<li>${all}</li>`).join('')}
      </ul>
    </div>
  ` : `
    <div class="allergens-list">
      <h3>Allergens</h3>
      <p>No allergens listed for this item.</p>
    </div>
  `;

  modalBody.innerHTML = `
    <h2>${item.name}</h2>
    <img src="${item.imageUrl}" alt="${item.name}" onerror="this.style.backgroundColor='#e0e0e0'; this.style.display='flex'; this.style.alignItems='center'; this.style.justifyContent='center'; this.innerHTML='<span style=\\'color:#999;\\'>${item.name}</span>'">
    <p><strong>Description:</strong> ${item.description}</p>
    <p><strong>Price:</strong> ${item.price.toFixed(2)} EGP</p>
    ${focus === 'ingredients' ? ingredientsHTML : ''}
    ${focus === 'allergens' ? allergensHTML : ''}
    ${!focus ? ingredientsHTML + allergensHTML : ''}
  `;

  modal.style.display = 'block';
}

/**
 * Setup event listeners
 */
function setupCustomerEventListeners() {
  // Category filter buttons
  categoryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      if (category) {
        filterByCategory(category);
      }
    });
  });

  // Navigation buttons
  customerNavButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      if (view) {
        switchCustomerView(view);
      }
    });
  });

  // Modal close
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Reservation form
  if (reservationForm) {
    reservationForm.addEventListener('submit', handleReservationSubmit);
  }

  // Feedback form
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);
  }
}

/**
 * Load available tables from API
 */
async function loadTables() {
  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/tables/available`);
    if (!response.ok) {
      throw new Error('Failed to load tables');
    }
    const availableTables = await response.json();
    
    if (tableNumberSelect) {
      tableNumberSelect.innerHTML = '<option value="">Select a table</option>';
      availableTables.forEach((table: any) => {
        const option = document.createElement('option');
        option.value = table.number.toString();
        option.textContent = `Table ${table.number} (Capacity: ${table.capacity})`;
        tableNumberSelect.appendChild(option);
      });
      
      if (availableTables.length === 0) {
        tableNumberSelect.innerHTML = '<option value="">No tables available</option>';
      }
    }
  } catch (error) {
    console.error('Error loading tables:', error);
    if (tableNumberSelect) {
      tableNumberSelect.innerHTML = '<option value="">Error loading tables</option>';
    }
  }
}

/**
 * Switch between views
 */
function switchCustomerView(viewName: string) {
  // Update nav buttons
  customerNavButtons.forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update views
  customerViews.forEach(view => {
    if (view.id === `${viewName}-view`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });
  
  // Reload tables when switching to reservation view
  if (viewName === 'reservation') {
    loadTables();
  }
}

/**
 * Handle reservation form submission
 */
async function handleReservationSubmit(e: Event) {
  e.preventDefault();
  
  if (!reservationForm) return;

  const formData = new FormData(reservationForm);
  const startTime = formData.get('reservationTime') as string;
  const endTime = formData.get('endTime') as string;
  const reservationDate = formData.get('reservationDate') as string;
  const numberOfGuests = parseInt(formData.get('numberOfGuests') as string);
  const tableNumber = parseInt(formData.get('tableNumber') as string);
  
  // Validate reservation date is not in the past
  if (reservationDate) {
    const reservationDateTime = new Date(`${reservationDate}T${startTime}`);
    const now = new Date();
    if (reservationDateTime < now) {
      showCustomerMessage(reservationMessage, 'Reservation date and time cannot be in the past', 'error');
      return;
    }
  }
  
  // Validate that end time is after start time
  if (startTime && endTime && endTime <= startTime) {
    showCustomerMessage(reservationMessage, 'End time must be after start time', 'error');
    return;
  }

  // Validate number of guests (client-side validation will be completed with table capacity check on server)
  if (numberOfGuests < 1) {
    showCustomerMessage(reservationMessage, 'Number of guests must be at least 1', 'error');
    return;
  }
  
  const reservation = {
    customerName: formData.get('customerName'),
    customerEmail: formData.get('customerEmail'),
    customerPhone: formData.get('customerPhone'),
    tableNumber: tableNumber,
    reservationDate: reservationDate,
    reservationTime: startTime,
    endTime: endTime,
    numberOfGuests: numberOfGuests
  };

  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reservation)
    });

    if (response.ok) {
      const result = await response.json();
      showCustomerMessage(reservationMessage, `Reservation confirmed! Your reservation ID is: ${result.id}`, 'success');
      reservationForm.reset();
    } else {
      const error = await response.json();
      showCustomerMessage(reservationMessage, error.error || 'Failed to create reservation', 'error');
    }
  } catch (error) {
    console.error('Error creating reservation:', error);
    showCustomerMessage(reservationMessage, 'Error creating reservation. Please try again.', 'error');
  }
}

/**
 * Handle feedback form submission
 */
async function handleFeedbackSubmit(e: Event) {
  e.preventDefault();
  
  if (!feedbackForm) return;

  const formData = new FormData(feedbackForm);
  const feedback = {
    customerName: formData.get('customerName'),
    customerEmail: formData.get('customerEmail'),
    rating: parseInt(formData.get('rating') as string),
    comment: formData.get('comment')
  };

  // Validate rating
  if (feedback.rating < 1 || feedback.rating > 5) {
    showCustomerMessage(feedbackMessage, 'Please select a valid rating (1-5)', 'error');
    return;
  }

  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedback)
    });

    if (response.ok) {
      showCustomerMessage(feedbackMessage, 'Thank you for your feedback! We appreciate your input.', 'success');
      feedbackForm.reset();
    } else {
      const error = await response.json();
      showCustomerMessage(feedbackMessage, error.error || 'Failed to submit feedback', 'error');
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    showCustomerMessage(feedbackMessage, 'Error submitting feedback. Please try again.', 'error');
  }
}

/**
 * Show a message to the user
 */
function showCustomerMessage(element: HTMLElement, message: string, type: 'success' | 'error') {
  element.textContent = message;
  element.className = `message ${type}`;
  setTimeout(() => {
    element.className = 'message';
  }, 5000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCustomerApp);
} else {
  initCustomerApp();
}

