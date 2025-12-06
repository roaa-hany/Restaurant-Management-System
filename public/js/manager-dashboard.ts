(function() {
  /**
   * Manager dashboard functionality
   * Handles menu management, table management, and reservations
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
    available: boolean;
  }

  interface Table {
    id: string;
    tableNumber: number;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved' | 'maintenance';
    location: string;
    currentOrderId?: string;
  }

  interface Reservation {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    tableNumber: number;
    reservationDate: string;
    reservationTime: string;
    numberOfGuests: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  }

  const MANAGER_API_BASE = 'http://localhost:3000/api';

  // State - using unique names to avoid conflicts
  let managerMenuItems: MenuItem[] = [];
  let managerTables: Table[] = [];
  let managerReservations: Reservation[] = [];
  let managerCurrentCategory: string = 'all'; // Changed from currentCategory

  // DOM Elements
  const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
  const managerNavButtons = document.querySelectorAll('.nav-btn');
  const managerViews = document.querySelectorAll('.view');
  const managerMessage = document.getElementById('manager-message') as HTMLElement;

  // Menu Management Elements
  const menuItemsGrid = document.getElementById('menu-items-grid') as HTMLElement;
  const addMenuItemBtn = document.getElementById('add-menu-item-btn') as HTMLButtonElement;
  const menuFilters = document.querySelectorAll('.menu-filters .filter-btn');
  const menuItemModal = document.getElementById('menu-item-modal') as HTMLElement;
  const menuItemForm = document.getElementById('menu-item-form') as HTMLFormElement;
  const menuModalTitle = document.getElementById('menu-modal-title') as HTMLElement;
  const closeMenuModal = document.getElementById('close-menu-modal') as HTMLElement;
  const cancelMenuItem = document.getElementById('cancel-menu-item') as HTMLButtonElement;

  // Table Management Elements
  const tablesGrid = document.getElementById('tables-grid') as HTMLElement;
  const addTableBtn = document.getElementById('add-table-btn') as HTMLButtonElement;
  const tableModal = document.getElementById('table-modal') as HTMLElement;
  const tableForm = document.getElementById('table-form') as HTMLFormElement;
  const tableModalTitle = document.getElementById('table-modal-title') as HTMLElement;
  const closeTableModal = document.getElementById('close-table-modal') as HTMLElement;
  const cancelTable = document.getElementById('cancel-table') as HTMLButtonElement;

  // Reservations Elements
  const reservationsList = document.getElementById('reservations-list') as HTMLElement;
  const reservationFilter = document.getElementById('reservation-filter') as HTMLSelectElement;
  const reservationDateFilter = document.getElementById('reservation-date-filter') as HTMLInputElement;
  const reservationModal = document.getElementById('reservation-modal') as HTMLElement;
  const reservationDetails = document.getElementById('reservation-details') as HTMLElement;
  const cancelReservationBtn = document.getElementById('cancel-reservation-btn') as HTMLButtonElement;
  const confirmReservationBtn = document.getElementById('confirm-reservation-btn') as HTMLButtonElement;
  const closeReservationDetails = document.getElementById('close-reservation-details') as HTMLButtonElement;
  const closeReservationModal = document.getElementById('close-reservation-modal') as HTMLElement;

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
    } catch (error) {
      window.location.href = 'login.html';
    }
  }

  /**
   * Initialize manager dashboard
   */
  async function initManagerDashboard() {
    checkManagerAuth();

    // Load initial data
    await Promise.all([
      loadManagerMenuItems(), // Changed from loadMenuItems
      loadManagerTables(),
      loadManagerReservations()
    ]);

    setupManagerEventListeners(); // Changed from setupEventListeners
  }

  /**
   * Load menu items from API
   */
  async function loadManagerMenuItems() { // Changed from loadMenuItems
    try {
      const response = await fetch(`${MANAGER_API_BASE}/menu`);
      if (response.ok) {
        managerMenuItems = await response.json();
        displayManagerMenuItems(); // Changed from displayMenuItems
      }
    } catch (error) {
      console.error('Error loading menu items:', error);
      showManagerMessage('Error loading menu items', 'error'); // Changed from showMessage
    }
  }

  /**
   * Display menu items in grid
   */
  function displayManagerMenuItems() { // Changed from displayMenuItems
    if (!menuItemsGrid) return;

    const filteredItems = managerCurrentCategory === 'all' // Changed from currentCategory
        ? managerMenuItems
        : managerMenuItems.filter(item => item.category === managerCurrentCategory); // Changed from currentCategory

    if (filteredItems.length === 0) {
      menuItemsGrid.innerHTML = '<p class="no-data">No menu items found.</p>';
      return;
    }

    menuItemsGrid.innerHTML = filteredItems.map(item => `
      <div class="menu-item-card" data-item-id="${item.id}">
        <div class="menu-item-card-header">
          <h3>${item.name}</h3>
          <span class="status-badge ${item.available ? 'available' : 'unavailable'}">
            ${item.available ? 'Available' : 'Unavailable'}
          </span>
        </div>
        <div class="menu-item-card-content">
          <p class="menu-item-description">${item.description}</p>
          <div class="menu-item-info">
            <span class="category">${item.category}</span>
            <span class="price">${item.price.toFixed(2)} EGP</span>
          </div>
        </div>
        <div class="menu-item-card-actions">
          <button class="btn btn-sm btn-primary edit-menu-item" data-id="${item.id}">Edit</button>
          <button class="btn btn-sm ${item.available ? 'btn-warning' : 'btn-success'} toggle-availability" data-id="${item.id}">
            ${item.available ? 'Disable' : 'Enable'}
          </button>
          <button class="btn btn-sm btn-danger delete-menu-item" data-id="${item.id}">Delete</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Load tables from API
   */
  async function loadManagerTables() { // Changed from loadTables
    try {
      const response = await fetch(`${MANAGER_API_BASE}/tables`);
      if (response.ok) {
        managerTables = await response.json();
        displayManagerTables(); // Changed from displayTables
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      showManagerMessage('Error loading tables', 'error'); // Changed from showMessage
    }
  }

  /**
   * Display tables in grid
   */
  function displayManagerTables() { // Changed from displayTables
    if (!tablesGrid) return;

    if (managerTables.length === 0) {
      tablesGrid.innerHTML = '<p class="no-data">No tables found. Add your first table.</p>';
      return;
    }

    tablesGrid.innerHTML = managerTables.map(table => `
      <div class="table-card" data-table-id="${table.id}">
        <div class="table-card-header">
          <h3>Table ${table.tableNumber}</h3>
          <span class="status-badge ${table.status}">${table.status}</span>
        </div>
        <div class="table-card-content">
          <div class="table-info">
            <p><strong>Capacity:</strong> ${table.capacity} seats</p>
            <p><strong>Location:</strong> ${table.location || 'Not specified'}</p>
          </div>
        </div>
        <div class="table-card-actions">
          <button class="btn btn-sm btn-primary edit-table" data-id="${table.id}">Edit</button>
          <button class="btn btn-sm btn-danger delete-table" data-id="${table.id}">Delete</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Load reservations from API
   */
  async function loadManagerReservations(filter: string = 'all', date?: string) { // Changed from loadReservations
    try {
      const response = await fetch(`${MANAGER_API_BASE}/reservations`);
      if (response.ok) {
        let reservations = await response.json();

        // Apply filters
        const today = new Date().toISOString().split('T')[0];

        switch (filter) {
          case 'today':
            reservations = reservations.filter((r: Reservation) =>
                r.reservationDate === today
            );
            break;
          case 'upcoming':
            reservations = reservations.filter((r: Reservation) =>
                r.reservationDate >= today && r.status !== 'cancelled'
            );
            break;
          case 'past':
            reservations = reservations.filter((r: Reservation) =>
                r.reservationDate < today
            );
            break;
        }

        if (date) {
          reservations = reservations.filter((r: Reservation) =>
              r.reservationDate === date
          );
        }

        managerReservations = reservations;
        displayManagerReservations(); // Changed from displayReservations
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
      showManagerMessage('Error loading reservations', 'error'); // Changed from showMessage
    }
  }

  /**
   * Display reservations in list
   */
  function displayManagerReservations() { // Changed from displayReservations
    if (!reservationsList) return;

    if (managerReservations.length === 0) {
      reservationsList.innerHTML = '<p class="no-data">No reservations found.</p>';
      return;
    }

    reservationsList.innerHTML = managerReservations.map(reservation => `
      <div class="reservation-card" data-reservation-id="${reservation.id}">
        <div class="reservation-card-header">
          <h3>${reservation.customerName}</h3>
          <span class="status-badge ${reservation.status}">${reservation.status}</span>
        </div>
        <div class="reservation-card-content">
          <div class="reservation-info">
            <p><strong>Date:</strong> ${reservation.reservationDate} at ${reservation.reservationTime}</p>
            <p><strong>Table:</strong> ${reservation.tableNumber}</p>
            <p><strong>Guests:</strong> ${reservation.numberOfGuests}</p>
            <p><strong>Contact:</strong> ${reservation.customerPhone} | ${reservation.customerEmail}</p>
          </div>
        </div>
        <div class="reservation-card-actions">
          <button class="btn btn-sm btn-primary view-reservation" data-id="${reservation.id}">View Details</button>
          ${reservation.status === 'pending' ? `
            <button class="btn btn-sm btn-success confirm-reservation" data-id="${reservation.id}">Confirm</button>
            <button class="btn btn-sm btn-danger cancel-reservation" data-id="${reservation.id}">Cancel</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * Setup event listeners
   */
  function setupManagerEventListeners() { // Changed from setupEventListeners
    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleManagerLogout);
    }

    // Navigation
    managerNavButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        if (view) {
          switchManagerDashboardView(view); // Changed from switchManagerView
        }
      });
    });

    // Menu Management
    if (addMenuItemBtn) {
      addMenuItemBtn.addEventListener('click', () => openManagerMenuItemModal()); // Changed from openMenuItemModal
    }

    if (menuFilters) {
      menuFilters.forEach(btn => {
        btn.addEventListener('click', () => {
          const category = btn.getAttribute('data-category');
          if (category) {
            menuFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            managerCurrentCategory = category; // Changed from currentCategory
            displayManagerMenuItems(); // Changed from displayMenuItems
          }
        });
      });
    }

    // Table Management
    if (addTableBtn) {
      addTableBtn.addEventListener('click', () => openManagerTableModal()); // Changed from openTableModal
    }

    // Reservations
    if (reservationFilter) {
      reservationFilter.addEventListener('change', (e) => {
        const filter = (e.target as HTMLSelectElement).value;
        const date = reservationDateFilter.value || undefined;
        loadManagerReservations(filter, date); // Changed from loadReservations
      });
    }

    if (reservationDateFilter) {
      reservationDateFilter.addEventListener('change', (e) => {
        const date = (e.target as HTMLInputElement).value;
        const filter = reservationFilter.value;
        loadManagerReservations(filter, date); // Changed from loadReservations
      });
    }

    // Menu Item Modal
    if (menuItemForm) {
      menuItemForm.addEventListener('submit', handleManagerMenuItemSubmit); // Changed from handleMenuItemSubmit
    }

    if (closeMenuModal) {
      closeMenuModal.addEventListener('click', () => {
        menuItemModal.style.display = 'none';
      });
    }

    if (cancelMenuItem) {
      cancelMenuItem.addEventListener('click', () => {
        menuItemModal.style.display = 'none';
      });
    }

    // Table Modal
    if (tableForm) {
      tableForm.addEventListener('submit', handleManagerTableSubmit); // Changed from handleTableSubmit
    }

    if (closeTableModal) {
      closeTableModal.addEventListener('click', () => {
        tableModal.style.display = 'none';
      });
    }

    if (cancelTable) {
      cancelTable.addEventListener('click', () => {
        tableModal.style.display = 'none';
      });
    }

    // Reservation Modal
    if (closeReservationModal) {
      closeReservationModal.addEventListener('click', () => {
        reservationModal.style.display = 'none';
      });
    }

    if (closeReservationDetails) {
      closeReservationDetails.addEventListener('click', () => {
        reservationModal.style.display = 'none';
      });
    }

    if (cancelReservationBtn) {
      cancelReservationBtn.addEventListener('click', handleManagerCancelReservation); // Changed from handleCancelReservation
    }

    if (confirmReservationBtn) {
      confirmReservationBtn.addEventListener('click', handleManagerConfirmReservation); // Changed from handleConfirmReservation
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === menuItemModal) {
        menuItemModal.style.display = 'none';
      }
      if (e.target === tableModal) {
        tableModal.style.display = 'none';
      }
      if (e.target === reservationModal) {
        reservationModal.style.display = 'none';
      }
    });

    // Set today's date as default for date filter
    if (reservationDateFilter) {
      const today = new Date().toISOString().split('T')[0];
      reservationDateFilter.value = today;
      reservationDateFilter.min = today;
    }
  }

  /**
   * Switch between manager views
   */
  function switchManagerDashboardView(viewName: string) { // Changed from switchManagerView
    // Update nav buttons
    managerNavButtons.forEach(btn => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update views
    managerViews.forEach(view => {
      if (view.id === `${viewName}-view`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Load data for the active view
    switch (viewName) {
      case 'menu-management':
        loadManagerMenuItems(); // Changed from loadMenuItems
        break;
      case 'table-management':
        loadManagerTables(); // Changed from loadTables
        break;
      case 'reservations':
        loadManagerReservations(); // Changed from loadReservations
        break;
    }
  }

  /**
   * Open menu item modal for adding/editing
   */
  function openManagerMenuItemModal(itemId?: string) { // Changed from openMenuItemModal
    const modal = document.getElementById('menu-item-modal');
    const form = document.getElementById('menu-item-form') as HTMLFormElement;

    if (!modal || !form) return;

    if (itemId) {
      // Edit mode
      const item = managerMenuItems.find(m => m.id === itemId);
      if (item) {
        menuModalTitle.textContent = 'Edit Menu Item';
        (form.querySelector('#item-id') as HTMLInputElement).value = item.id;
        (form.querySelector('#item-name') as HTMLInputElement).value = item.name;
        (form.querySelector('#item-category') as HTMLSelectElement).value = item.category;
        (form.querySelector('#item-description') as HTMLTextAreaElement).value = item.description;
        (form.querySelector('#item-price') as HTMLInputElement).value = item.price.toString();
        (form.querySelector('#item-ingredients') as HTMLInputElement).value = item.ingredients.join(', ');
        (form.querySelector('#item-allergens') as HTMLInputElement).value = item.allergens.join(', ');
        (form.querySelector('#item-image') as HTMLInputElement).value = item.imageUrl || '';
        (form.querySelector('#item-available') as HTMLInputElement).checked = item.available;
      }
    } else {
      // Add mode
      menuModalTitle.textContent = 'Add New Menu Item';
      form.reset();
      (form.querySelector('#item-id') as HTMLInputElement).value = '';
    }

    modal.style.display = 'block';
  }

  /**
   * Handle menu item form submission
   */
  async function handleManagerMenuItemSubmit(e: Event) { // Changed from handleMenuItemSubmit
    e.preventDefault();

    if (!menuItemForm) return;

    const formData = new FormData(menuItemForm);
    const itemId = formData.get('itemId') as string;
    const menuItem = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as string,
      ingredients: (formData.get('ingredients') as string).split(',').map(i => i.trim()).filter(i => i),
      allergens: (formData.get('allergens') as string).split(',').map(a => a.trim()).filter(a => a),
      imageUrl: formData.get('imageUrl') as string,
      available: (formData.get('available') as string) === 'on'
    };

    try {
      const url = itemId
          ? `${MANAGER_API_BASE}/menu/${itemId}`
          : `${MANAGER_API_BASE}/menu`;

      const method = itemId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(menuItem)
      });

      if (response.ok) {
        showManagerMessage(itemId ? 'Menu item updated successfully' : 'Menu item added successfully', 'success'); // Changed from showMessage
        menuItemModal.style.display = 'none';
        await loadManagerMenuItems(); // Changed from loadMenuItems
      } else {
        const error = await response.json();
        showManagerMessage(error.error || 'Failed to save menu item', 'error'); // Changed from showMessage
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
      showManagerMessage('Error saving menu item. Please try again.', 'error'); // Changed from showMessage
    }
  }

  /**
   * Open table modal for adding/editing
   */
  function openManagerTableModal(tableId?: string) { // Changed from openTableModal
    const modal = document.getElementById('table-modal');
    const form = document.getElementById('table-form') as HTMLFormElement;

    if (!modal || !form) return;

    if (tableId) {
      // Edit mode
      const table = managerTables.find(t => t.id === tableId);
      if (table) {
        tableModalTitle.textContent = 'Edit Table';
        (form.querySelector('#table-id') as HTMLInputElement).value = table.id;
        (form.querySelector('#table-number') as HTMLInputElement).value = table.tableNumber.toString();
        (form.querySelector('#table-capacity') as HTMLInputElement).value = table.capacity.toString();
        (form.querySelector('#table-status') as HTMLSelectElement).value = table.status;
        (form.querySelector('#table-location') as HTMLInputElement).value = table.location || '';
      }
    } else {
      // Add mode
      tableModalTitle.textContent = 'Add New Table';
      form.reset();
      (form.querySelector('#table-id') as HTMLInputElement).value = '';
    }

    modal.style.display = 'block';
  }

  /**
   * Handle table form submission
   */
  async function handleManagerTableSubmit(e: Event) { // Changed from handleTableSubmit
    e.preventDefault();

    if (!tableForm) return;

    const formData = new FormData(tableForm);
    const tableId = formData.get('tableId') as string;
    const table = {
      tableNumber: parseInt(formData.get('tableNumber') as string),
      capacity: parseInt(formData.get('capacity') as string),
      status: formData.get('status') as string,
      location: formData.get('location') as string
    };

    try {
      const url = tableId
          ? `${MANAGER_API_BASE}/tables/${tableId}`
          : `${MANAGER_API_BASE}/tables`;

      const method = tableId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(table)
      });

      if (response.ok) {
        showManagerMessage(tableId ? 'Table updated successfully' : 'Table added successfully', 'success'); // Changed from showMessage
        tableModal.style.display = 'none';
        await loadManagerTables(); // Changed from loadTables
      } else {
        const error = await response.json();
        showManagerMessage(error.error || 'Failed to save table', 'error'); // Changed from showMessage
      }
    } catch (error) {
      console.error('Error saving table:', error);
      showManagerMessage('Error saving table. Please try again.', 'error'); // Changed from showMessage
    }
  }

  /**
   * Handle cancel reservation
   */
  async function handleManagerCancelReservation() { // Changed from handleCancelReservation
    const reservationId = reservationDetails.getAttribute('data-reservation-id');
    if (!reservationId) return;

    try {
      const response = await fetch(`${MANAGER_API_BASE}/reservations/${reservationId}/cancel`, {
        method: 'POST'
      });

      if (response.ok) {
        showManagerMessage('Reservation cancelled successfully', 'success'); // Changed from showMessage
        reservationModal.style.display = 'none';
        await loadManagerReservations(reservationFilter.value, reservationDateFilter.value || undefined); // Changed from loadReservations
      } else {
        const error = await response.json();
        showManagerMessage(error.error || 'Failed to cancel reservation', 'error'); // Changed from showMessage
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      showManagerMessage('Error cancelling reservation. Please try again.', 'error'); // Changed from showMessage
    }
  }

  /**
   * Handle confirm reservation
   */
  async function handleManagerConfirmReservation() { // Changed from handleConfirmReservation
    const reservationId = reservationDetails.getAttribute('data-reservation-id');
    if (!reservationId) return;

    try {
      const response = await fetch(`${MANAGER_API_BASE}/reservations/${reservationId}/confirm`, {
        method: 'POST'
      });

      if (response.ok) {
        showManagerMessage('Reservation confirmed successfully', 'success'); // Changed from showMessage
        reservationModal.style.display = 'none';
        await loadManagerReservations(reservationFilter.value, reservationDateFilter.value || undefined); // Changed from loadReservations
      } else {
        const error = await response.json();
        showManagerMessage(error.error || 'Failed to confirm reservation', 'error'); // Changed from showMessage
      }
    } catch (error) {
      console.error('Error confirming reservation:', error);
      showManagerMessage('Error confirming reservation. Please try again.', 'error'); // Changed from showMessage
    }
  }

  /**
   * Show a message to the user
   */
  function showManagerMessage(message: string, type: 'success' | 'error') { // Changed from showMessage
    if (managerMessage) {
      managerMessage.textContent = message;
      managerMessage.className = `message ${type}`;
      setTimeout(() => {
        managerMessage.className = 'message';
      }, 5000);
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
   * Delegate event handling for dynamic elements
   */
  function setupManagerDelegatedEventHandlers() { // Changed from setupDelegatedEventHandlers
    // Handle menu item actions
    document.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;

      // Edit menu item
      if (target.classList.contains('edit-menu-item')) {
        const itemId = target.getAttribute('data-id');
        if (itemId) {
          openManagerMenuItemModal(itemId); // Changed from openMenuItemModal
        }
      }

      // Toggle menu item availability
      if (target.classList.contains('toggle-availability')) {
        const itemId = target.getAttribute('data-id');
        if (itemId) {
          const item = managerMenuItems.find(m => m.id === itemId);
          if (item) {
            try {
              const response = await fetch(`${MANAGER_API_BASE}/menu/${itemId}/toggle-availability`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ available: !item.available })
              });

              if (response.ok) {
                showManagerMessage(`Menu item ${!item.available ? 'enabled' : 'disabled'} successfully`, 'success'); // Changed from showMessage
                await loadManagerMenuItems(); // Changed from loadMenuItems
              } else {
                const error = await response.json();
                showManagerMessage(error.error || 'Failed to update availability', 'error'); // Changed from showMessage
              }
            } catch (error) {
              console.error('Error toggling availability:', error);
              showManagerMessage('Error updating availability. Please try again.', 'error'); // Changed from showMessage
            }
          }
        }
      }

      // Delete menu item
      if (target.classList.contains('delete-menu-item')) {
        const itemId = target.getAttribute('data-id');
        if (itemId && confirm('Are you sure you want to delete this menu item?')) {
          try {
            const response = await fetch(`${MANAGER_API_BASE}/menu/${itemId}`, {
              method: 'DELETE'
            });

            if (response.ok) {
              showManagerMessage('Menu item deleted successfully', 'success'); // Changed from showMessage
              await loadManagerMenuItems(); // Changed from loadMenuItems
            } else {
              const error = await response.json();
              showManagerMessage(error.error || 'Failed to delete menu item', 'error'); // Changed from showMessage
            }
          } catch (error) {
            console.error('Error deleting menu item:', error);
            showManagerMessage('Error deleting menu item. Please try again.', 'error'); // Changed from showMessage
          }
        }
      }

      // Edit table
      if (target.classList.contains('edit-table')) {
        const tableId = target.getAttribute('data-id');
        if (tableId) {
          openManagerTableModal(tableId); // Changed from openTableModal
        }
      }

      // Delete table
      if (target.classList.contains('delete-table')) {
        const tableId = target.getAttribute('data-id');
        if (tableId && confirm('Are you sure you want to delete this table?')) {
          try {
            const response = await fetch(`${MANAGER_API_BASE}/tables/${tableId}`, {
              method: 'DELETE'
            });

            if (response.ok) {
              showManagerMessage('Table deleted successfully', 'success'); // Changed from showMessage
              await loadManagerTables(); // Changed from loadTables
            } else {
              const error = await response.json();
              showManagerMessage(error.error || 'Failed to delete table', 'error'); // Changed from showMessage
            }
          } catch (error) {
            console.error('Error deleting table:', error);
            showManagerMessage('Error deleting table. Please try again.', 'error'); // Changed from showMessage
          }
        }
      }

      // View reservation details
      if (target.classList.contains('view-reservation')) {
        const reservationId = target.getAttribute('data-id');
        if (reservationId) {
          const reservation = managerReservations.find(r => r.id === reservationId);
          if (reservation) {
            reservationDetails.setAttribute('data-reservation-id', reservation.id);
            reservationDetails.innerHTML = `
              <div class="reservation-detail">
                <p><strong>Customer Name:</strong> ${reservation.customerName}</p>
                <p><strong>Email:</strong> ${reservation.customerEmail}</p>
                <p><strong>Phone:</strong> ${reservation.customerPhone}</p>
                <p><strong>Date:</strong> ${reservation.reservationDate}</p>
                <p><strong>Time:</strong> ${reservation.reservationTime}</p>
                <p><strong>Table:</strong> ${reservation.tableNumber}</p>
                <p><strong>Number of Guests:</strong> ${reservation.numberOfGuests}</p>
                <p><strong>Status:</strong> <span class="status-badge ${reservation.status}">${reservation.status}</span></p>
              </div>
            `;

            // Update button visibility based on status
            cancelReservationBtn.style.display = reservation.status === 'pending' || reservation.status === 'confirmed' ? 'block' : 'none';
            confirmReservationBtn.style.display = reservation.status === 'pending' ? 'block' : 'none';

            reservationModal.style.display = 'block';
          }
        }
      }

      // Confirm reservation from list
      if (target.classList.contains('confirm-reservation')) {
        const reservationId = target.getAttribute('data-id');
        if (reservationId) {
          try {
            const response = await fetch(`${MANAGER_API_BASE}/reservations/${reservationId}/confirm`, {
              method: 'POST'
            });

            if (response.ok) {
              showManagerMessage('Reservation confirmed successfully', 'success'); // Changed from showMessage
              await loadManagerReservations(reservationFilter.value, reservationDateFilter.value || undefined); // Changed from loadReservations
            } else {
              const error = await response.json();
              showManagerMessage(error.error || 'Failed to confirm reservation', 'error'); // Changed from showMessage
            }
          } catch (error) {
            console.error('Error confirming reservation:', error);
            showManagerMessage('Error confirming reservation. Please try again.', 'error'); // Changed from showMessage
          }
        }
      }

      // Cancel reservation from list
      if (target.classList.contains('cancel-reservation')) {
        const reservationId = target.getAttribute('data-id');
        if (reservationId && confirm('Are you sure you want to cancel this reservation?')) {
          try {
            const response = await fetch(`${MANAGER_API_BASE}/reservations/${reservationId}/cancel`, {
              method: 'POST'
            });

            if (response.ok) {
              showManagerMessage('Reservation cancelled successfully', 'success'); // Changed from showMessage
              await loadManagerReservations(reservationFilter.value, reservationDateFilter.value || undefined); // Changed from loadReservations
            } else {
              const error = await response.json();
              showManagerMessage(error.error || 'Failed to cancel reservation', 'error'); // Changed from showMessage
            }
          } catch (error) {
            console.error('Error cancelling reservation:', error);
            showManagerMessage('Error cancelling reservation. Please try again.', 'error'); // Changed from showMessage
          }
        }
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initManagerDashboard();
      setupManagerDelegatedEventHandlers(); // Changed from setupDelegatedEventHandlers
    });
  } else {
    initManagerDashboard();
    setupManagerDelegatedEventHandlers(); // Changed from setupDelegatedEventHandlers
  }
})();