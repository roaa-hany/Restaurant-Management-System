"use strict";

/**
 * Waiter Dashboard Application Logic
 * Handles table management, order tracking, and performance metrics
 */

const DASHBOARD_API_BASE = 'http://localhost:3000/api';

// State
let waiterTables = [];
let waiterOrders = [];
let waiterMenuItems = [];
let waiterStats = {};
let currentWaiter = null;
let currentSelectedTable = null;
let selectedOrderItems = [];

// DOM Elements
const logoutBtn = document.getElementById('logout-btn');
const waiterName = document.getElementById('waiter-name');
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const tablesContainer = document.getElementById('tables-container');
const ordersContainer = document.getElementById('orders-container');
const recentActivity = document.getElementById('recent-activity');
const dashboardMessage = document.getElementById('dashboard-message');

// Modal Elements
const orderModal = document.getElementById('order-modal');
const tableModal = document.getElementById('table-modal');
const orderForm = document.getElementById('order-form');
const orderTableSelect = document.getElementById('order-table');
const menuItemsContainer = document.getElementById('menu-items-container');
const selectedItemsContainer = document.getElementById('selected-items');
const orderTotalElement = document.getElementById('order-total');
const modalTableNumber = document.getElementById('modal-table-number');
const tableDetails = document.getElementById('table-details');

// Stats elements (keep existing ones)
const activeTablesCount = document.getElementById('active-tables-count');
const pendingOrdersCount = document.getElementById('pending-orders-count');
const todayRevenue = document.getElementById('today-revenue');
const avgServiceTime = document.getElementById('avg-service-time');
const totalTablesServed = document.getElementById('total-tables-served');
const totalRevenue = document.getElementById('total-revenue');
const customerRating = document.getElementById('customer-rating');
const orderAccuracy = document.getElementById('order-accuracy');

// Buttons
const newOrderBtn = document.getElementById('new-order-btn');
const viewTablesBtn = document.getElementById('view-tables-btn');
const createOrderBtn = document.getElementById('create-order-btn');
const requestAssistanceBtn = document.getElementById('request-assistance-btn');
const markAvailableBtn = document.getElementById('mark-available-btn');
const cancelOrderBtn = document.getElementById('cancel-order');

/**
 * Initialize the waiter dashboard
 */
async function initWaiterDashboard() {
    await verifyWaiterSession();
    await Promise.all([
        loadTables(),
        loadOrders(),
        loadMenuItems(),
        loadWaiterStats()
    ]);
    setupEventListeners();
    updateDashboard();
    populateOrderTableSelect();
}

/**
 * Verify waiter session and load profile
 */
async function verifyWaiterSession() {
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
        
        currentWaiter = sessionData;
        waiterName.textContent = sessionData.name || 'Waiter';
        
    } catch (error) {
        console.error('Error verifying session:', error);
        window.location.href = 'login.html';
    }
}

/**
 * Load tables from API
 */
async function loadTables() {
    try {
        const response = await fetch(`${DASHBOARD_API_BASE}/tables`);
        if (response.ok) {
            waiterTables = await response.json();
            displayTables();
            populateOrderTableSelect();
        }
    } catch (error) {
        console.error('Error loading tables:', error);
        showMessage('Error loading tables', 'error');
    }
}

/**
 * Load orders from API
 */
async function loadOrders() {
    try {
        const response = await fetch(`${DASHBOARD_API_BASE}/orders`);
        if (response.ok) {
            waiterOrders = await response.json();
            displayOrders();
            updateRecentActivity();
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showMessage('Error loading orders', 'error');
    }
}

/**
 * Load menu items from API
 */
async function loadMenuItems() {
    try {
        const response = await fetch(`${DASHBOARD_API_BASE}/menu`);
        if (response.ok) {
            waiterMenuItems = await response.json();
            displayMenuItems();
        }
    } catch (error) {
        console.error('Error loading menu items:', error);
        showMessage('Error loading menu items', 'error');
    }
}

/**
 * Load waiter statistics
 */
async function loadWaiterStats() {
    try {
        const waiterId = currentWaiter?.id;
        if (!waiterId) return;

        const response = await fetch(`${DASHBOARD_API_BASE}/waiters/${waiterId}/stats`);
        if (response.ok) {
            waiterStats = await response.json();
            updateStats();
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Display tables in table management view
 */
function displayTables() {
    if (!tablesContainer) return;

    tablesContainer.innerHTML = waiterTables.map(table => {
        const statusClass = getTableStatusClass(table.status);
        const statusText = getTableStatusText(table.status);
        const tableOrders = waiterOrders.filter(order => 
            order.tableNumber === table.number && 
            (order.status === 'pending' || order.status === 'preparing')
        );
        
        return `
            <div class="table-card ${statusClass}" data-table-id="${table.id}" data-table-number="${table.number}">
                <div class="table-number">Table ${table.number}</div>
                <div class="table-status">${statusText}</div>
                <div class="table-capacity">Capacity: ${table.capacity}</div>
                ${tableOrders.length > 0 ? 
                    `<div class="table-orders">${tableOrders.length} active order(s)</div>` : 
                    ''
                }
                ${table.assignedWaiter === currentWaiter.id ? 
                    '<div class="table-assigned">✓ Assigned to you</div>' : 
                    '<div class="table-assigned">Available</div>'
                }
            </div>
        `;
    }).join('');

    // Add click event listeners to table cards
    tablesContainer.querySelectorAll('.table-card').forEach(card => {
        card.addEventListener('click', handleTableClick);
    });
}

/**
 * Display orders in order management view
 */
function displayOrders() {
    if (!ordersContainer) return;

    const filteredOrders = waiterOrders.filter(order => 
        order.assignedWaiter === currentWaiter.id || 
        !order.assignedWaiter
    );

    if (filteredOrders.length === 0) {
        ordersContainer.innerHTML = '<p>No orders assigned to you.</p>';
        return;
    }

    ordersContainer.innerHTML = filteredOrders.map(order => {
        const itemsHTML = order.items.map(item => {
            const menuItem = waiterMenuItems.find(m => m.id === item.menuItemId);
            const itemName = menuItem ? menuItem.name : 'Unknown Item';
            return `
                <div class="order-item">
                    <span>${itemName} x${item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)} EGP</span>
                </div>
            `;
        }).join('');

        const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const statusClass = getOrderStatusClass(order.status);

        return `
            <div class="order-card">
                <div class="order-header">
                    <h3>Order #${order.id} - Table ${order.tableNumber}</h3>
                    <div class="order-actions">
                        <button class="btn btn-primary" onclick="updateOrderStatus('${order.id}', 'preparing')">Preparing</button>
                        <button class="btn btn-success" onclick="updateOrderStatus('${order.id}', 'ready')">Ready</button>
                        <button class="btn btn-warning" onclick="updateOrderStatus('${order.id}', 'served')">Served</button>
                        <button class="btn btn-danger" onclick="generateBill('${order.id}')">Bill</button>
                    </div>
                </div>
                <div class="order-info">
                    <div><strong>Status:</strong> <span class="${statusClass}">${order.status}</span></div>
                    <div><strong>Created:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
                    <div><strong>Total:</strong> ${total.toFixed(2)} EGP</div>
                    ${order.customerName ? `<div><strong>Customer:</strong> ${order.customerName}</div>` : ''}
                </div>
                <div class="order-items">
                    <strong>Items:</strong>
                    ${itemsHTML}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Display menu items in order creation modal
 */
function displayMenuItems() {
    if (!menuItemsContainer) return;

    const groupedItems = waiterMenuItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});

    menuItemsContainer.innerHTML = Object.entries(groupedItems).map(([category, items]) => `
        <div class="menu-category">
            <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
            <div class="menu-items-grid">
                ${items.map(item => `
                    <div class="menu-item-card" data-item-id="${item.id}">
                        <div class="menu-item-info">
                            <h5>${item.name}</h5>
                            <p class="menu-item-description">${item.description}</p>
                            <p class="menu-item-price">${item.price.toFixed(2)} EGP</p>
                        </div>
                        <div class="menu-item-actions">
                            <button type="button" class="btn btn-sm btn-outline decrease-btn" data-item-id="${item.id}">-</button>
                            <span class="item-quantity" id="quantity-${item.id}">0</span>
                            <button type="button" class="btn btn-sm btn-outline increase-btn" data-item-id="${item.id}">+</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

/**
 * Populate table select in order creation modal
 */
function populateOrderTableSelect() {
    if (!orderTableSelect) return;

    orderTableSelect.innerHTML = '<option value="">Select a table</option>';
    waiterTables
        .filter(table => table.status === 'available' || table.assignedWaiter === currentWaiter.id)
        .forEach(table => {
            const option = document.createElement('option');
            option.value = table.number;
            option.textContent = `Table ${table.number} (Capacity: ${table.capacity})`;
            orderTableSelect.appendChild(option);
        });
}

/**
 * Handle table click events
 */
function handleTableClick(event) {
    const tableCard = event.currentTarget;
    const tableId = tableCard.getAttribute('data-table-id');
    const tableNumber = tableCard.getAttribute('data-table-number');
    const table = waiterTables.find(t => t.id === tableId);
    
    if (!table) return;

    currentSelectedTable = table;
    showTableModal(table);
}

/**
 * Show table details modal
 */
function showTableModal(table) {
    if (!tableModal || !modalTableNumber || !tableDetails) return;

    modalTableNumber.textContent = table.number;
    
    const tableOrders = waiterOrders.filter(order => 
        order.tableNumber === table.number && 
        order.status !== 'paid'
    );

    tableDetails.innerHTML = `
        <div class="table-info">
            <p><strong>Status:</strong> ${getTableStatusText(table.status)}</p>
            <p><strong>Capacity:</strong> ${table.capacity} people</p>
            <p><strong>Assigned Waiter:</strong> ${table.assignedWaiter === currentWaiter.id ? 'You' : 'Not assigned'}</p>
        </div>
        ${tableOrders.length > 0 ? `
            <div class="table-orders-list">
                <h4>Active Orders</h4>
                ${tableOrders.map(order => `
                    <div class="table-order-item">
                        <span>Order #${order.id}</span>
                        <span class="status-${order.status}">${order.status}</span>
                    </div>
                `).join('')}
            </div>
        ` : '<p>No active orders for this table.</p>'}
    `;

    // Update modal buttons based on table status
    if (createOrderBtn) {
        createOrderBtn.style.display = table.status !== 'occupied' ? 'inline-block' : 'none';
        createOrderBtn.onclick = () => {
            tableModal.style.display = 'none';
            showOrderModal(table.number);
        };
    }

    if (requestAssistanceBtn) {
        requestAssistanceBtn.style.display = table.assignedWaiter === currentWaiter.id ? 'inline-block' : 'none';
        requestAssistanceBtn.onclick = () => assistTable(table.id);
    }

    if (markAvailableBtn) {
        markAvailableBtn.style.display = table.assignedWaiter === currentWaiter.id && table.status === 'occupied' ? 'inline-block' : 'none';
        markAvailableBtn.onclick = () => markTableAvailable(table.id);
    }

    tableModal.style.display = 'block';
}

/**
 * Increase item quantity in order
 */
function increaseItemQuantity(itemId) {
    const item = waiterMenuItems.find(m => m.id === itemId);
    if (!item) return;

    const existingItemIndex = selectedOrderItems.findIndex(i => i.menuItemId === itemId);
    
    if (existingItemIndex > -1) {
        // Item already exists, increase quantity
        selectedOrderItems[existingItemIndex].quantity++;
    } else {
        // Add new item
        selectedOrderItems.push({
            menuItemId: itemId,
            quantity: 1,
            price: item.price,
            name: item.name
        });
    }

    updateSelectedItems();
    updateOrderTotal();
    updateItemQuantityDisplay(itemId);
    console.log('Selected items after increase:', selectedOrderItems); // Debug log
}

/**
 * Decrease item quantity in order
 */
function decreaseItemQuantity(itemId) {
    const existingItemIndex = selectedOrderItems.findIndex(i => i.menuItemId === itemId);
    if (existingItemIndex === -1) return;

    const existingItem = selectedOrderItems[existingItemIndex];
    
    if (existingItem.quantity > 1) {
        existingItem.quantity--;
    } else {
        selectedOrderItems.splice(existingItemIndex, 1);
    }

    updateSelectedItems();
    updateOrderTotal();
    updateItemQuantityDisplay(itemId);
    console.log('Selected items after decrease:', selectedOrderItems); // Debug log
}

/**
 * Update item quantity display
 */
function updateItemQuantityDisplay(itemId) {
    const quantityElement = document.getElementById(`quantity-${itemId}`);
    if (quantityElement) {
        const item = selectedOrderItems.find(i => i.menuItemId === itemId);
        quantityElement.textContent = item ? item.quantity.toString() : '0';
    }
}

/**
 * Update selected items display
 */
function updateSelectedItems() {
    if (!selectedItemsContainer) return;

    if (selectedOrderItems.length === 0) {
        selectedItemsContainer.innerHTML = '<p class="no-items">No items selected</p>';
        return;
    }

    selectedItemsContainer.innerHTML = selectedOrderItems.map(item => {
        const menuItem = waiterMenuItems.find(m => m.id === item.menuItemId);
        const itemName = menuItem ? menuItem.name : item.name;
        
        return `
            <div class="selected-item">
                <span class="item-name">${itemName}</span>
                <span class="item-quantity-controls">
                    <button type="button" class="btn btn-sm btn-outline decrease-btn" data-item-id="${item.menuItemId}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button type="button" class="btn btn-sm btn-outline increase-btn" data-item-id="${item.menuItemId}">+</button>
                </span>
                <span class="item-total">${(item.price * item.quantity).toFixed(2)} EGP</span>
                <button type="button" class="btn btn-sm btn-danger remove-btn" data-item-id="${item.menuItemId}">×</button>
            </div>
        `;
    }).join('');
}

/**
 * Remove item from selected items
 */
function removeItem(itemId) {
    selectedOrderItems = selectedOrderItems.filter(i => i.menuItemId !== itemId);
    updateSelectedItems();
    updateOrderTotal();
    updateItemQuantityDisplay(itemId);
    console.log('Selected items after remove:', selectedOrderItems); // Debug log
}

/**
 * Update order total display
 */
function updateOrderTotal() {
    if (!orderTotalElement) return;

    const total = selectedOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalSpan = orderTotalElement.querySelector('span');
    if (totalSpan) {
        totalSpan.textContent = total.toFixed(2);
    }
}

/**
 * Show order creation modal
 */
function showOrderModal(prefilledTable = '') {
    if (!orderModal) return;

    // Reset form and selections
    selectedOrderItems = [];
    updateSelectedItems();
    updateOrderTotal();
    
    // Reset all quantity displays to 0
    waiterMenuItems.forEach(item => {
        updateItemQuantityDisplay(item.id);
    });

    // Prefill table if provided
    if (prefilledTable && orderTableSelect) {
        orderTableSelect.value = prefilledTable;
    }

    orderModal.style.display = 'block';
}

/**
 * Handle order form submission
 */
async function handleOrderSubmit(e) {
    e.preventDefault();
    
    if (!orderForm) return;

    const formData = new FormData(orderForm);
    const tableNumber = parseInt(formData.get('tableNumber'));
    const customerName = formData.get('customerName');

    if (!tableNumber) {
        showMessage('Please select a table', 'error');
        return;
    }

    console.log('Selected items before submission:', selectedOrderItems); // Debug log

    if (selectedOrderItems.length === 0) {
        showMessage('Please add at least one item to the order', 'error');
        return;
    }

    // Validate that all items have at least quantity 1
    const invalidItems = selectedOrderItems.filter(item => item.quantity < 1);
    if (invalidItems.length > 0) {
        showMessage('All items must have at least quantity 1', 'error');
        return;
    }

    const orderData = {
        tableNumber: tableNumber,
        customerName: customerName || undefined,
        items: selectedOrderItems.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price
        })),
        assignedWaiter: currentWaiter.id,
        status: 'pending'
    };

    console.log('Submitting order data:', orderData); // Debug log

    try {
        const response = await fetch(`${DASHBOARD_API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const newOrder = await response.json();
            
            // Update table status
            await updateTableStatus(tableNumber, 'occupied');
            
            showMessage(`Order #${newOrder.id} created successfully!`, 'success');
            closeOrderModal();
            
            // Reload data
            await Promise.all([
                loadTables(),
                loadOrders()
            ]);
        } else {
            const error = await response.json();
            showMessage(error.error || 'Failed to create order', 'error');
        }
    } catch (error) {
        console.error('Error creating order:', error);
        showMessage('Error creating order. Please try again.', 'error');
    }
}

/**
 * Update table status
 */
async function updateTableStatus(tableNumber, status) {
    try {
        const table = waiterTables.find(t => t.number === tableNumber);
        if (!table) return;

        const response = await fetch(`${DASHBOARD_API_BASE}/tables/${table.id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: status,
                assignedWaiter: currentWaiter.id
            })
        });

        if (!response.ok) {
            console.error('Failed to update table status');
        }
    } catch (error) {
        console.error('Error updating table status:', error);
    }
}

/**
 * Mark table as available
 */
async function markTableAvailable(tableId) {
    try {
        const response = await fetch(`${DASHBOARD_API_BASE}/tables/${tableId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'available',
                assignedWaiter: null
            })
        });

        if (response.ok) {
            showMessage('Table marked as available', 'success');
            closeTableModal();
            await loadTables();
        } else {
            showMessage('Failed to update table status', 'error');
        }
    } catch (error) {
        console.error('Error updating table status:', error);
        showMessage('Error updating table status', 'error');
    }
}

/**
 * Close order modal
 */
function closeOrderModal() {
    if (orderModal) {
        orderModal.style.display = 'none';
        selectedOrderItems = [];
        if (orderForm) orderForm.reset();
    }
}

/**
 * Close table modal
 */
function closeTableModal() {
    if (tableModal) {
        tableModal.style.display = 'none';
        currentSelectedTable = null;
    }
}

/**
 * Update recent activity section
 */
function updateRecentActivity() {
    if (!recentActivity) return;

    const recentOrders = waiterOrders
        .filter(order => order.assignedWaiter === currentWaiter.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    if (recentOrders.length === 0) {
        recentActivity.innerHTML = '<p>No recent activity.</p>';
        return;
    }

    recentActivity.innerHTML = recentOrders.map(order => {
        const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return `
            <div class="order-card">
                <h4>Order #${order.id} - Table ${order.tableNumber}</h4>
                <div><strong>Status:</strong> ${order.status}</div>
                <div><strong>Total:</strong> ${total.toFixed(2)} EGP</div>
                <div><strong>Time:</strong> ${new Date(order.createdAt).toLocaleTimeString()}</div>
            </div>
        `;
    }).join('');
}

/**
 * Update statistics display
 */
function updateStats() {
    // Update overview stats
    if (activeTablesCount) {
        activeTablesCount.textContent = waiterStats.activeTables || 0;
    }
    if (pendingOrdersCount) {
        pendingOrdersCount.textContent = waiterStats.pendingOrders || 0;
    }
    if (todayRevenue) {
        todayRevenue.textContent = `${waiterStats.todayRevenue || 0} EGP`;
    }
    if (avgServiceTime) {
        avgServiceTime.textContent = `${waiterStats.avgServiceTime || 0} min`;
    }

    // Update performance stats
    if (totalTablesServed) {
        totalTablesServed.textContent = waiterStats.totalTablesServed || 0;
    }
    if (totalRevenue) {
        totalRevenue.textContent = `${waiterStats.totalRevenue || 0} EGP`;
    }
    if (customerRating) {
        customerRating.textContent = waiterStats.customerRating || '0.0';
    }
    if (orderAccuracy) {
        orderAccuracy.textContent = `${waiterStats.orderAccuracy || 100}%`;
    }
}

/**
 * Assign table to current waiter
 */
async function assignTableToWaiter(tableId) {
    try {
        const response = await fetch(`${DASHBOARD_API_BASE}/tables/${tableId}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                waiterId: currentWaiter.id
            })
        });

        if (response.ok) {
            showMessage('Table assigned successfully', 'success');
            await loadTables();
        } else {
            showMessage('Failed to assign table', 'error');
        }
    } catch (error) {
        console.error('Error assigning table:', error);
        showMessage('Error assigning table', 'error');
    }
}

/**
 * Create new order for table
 */
function createNewOrder(tableId) {
    // Redirect to ordering system or open modal
    window.location.href = `waiter.html?table=${tableId}`;
}

/**
 * Mark table as needing assistance
 */
async function assistTable(tableId) {
    try {
        const response = await fetch(`${DASHBOARD_API_BASE}/tables/${tableId}/assist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                waiterId: currentWaiter.id
            })
        });

        if (response.ok) {
            showMessage('Assistance provided to table', 'success');
            await loadTables();
        } else {
            showMessage('Failed to update table status', 'error');
        }
    } catch (error) {
        console.error('Error assisting table:', error);
        showMessage('Error assisting table', 'error');
    }
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`${DASHBOARD_API_BASE}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus
            })
        });

        if (response.ok) {
            showMessage(`Order status updated to ${newStatus}`, 'success');
            await loadOrders();
            await loadTables();
        } else {
            showMessage('Failed to update order status', 'error');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        showMessage('Error updating order status', 'error');
    }
}

/**
 * Generate bill for order
 */
function generateBill(orderId) {
    window.location.href = `waiter.html?order=${orderId}`;
}

/**
 * Switch between dashboard views
 */
function switchView(viewName) {
    // Update nav buttons
    navButtons.forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update views
    views.forEach(view => {
        if (view.id === `${viewName}-view`) {
            view.classList.add('active');
        } else {
            view.classList.remove('active');
        }
    });
}

/**
 * Update dashboard data periodically
 */
function updateDashboard() {
    // Refresh data every 30 seconds
    setInterval(async () => {
        await Promise.all([
            loadTables(),
            loadOrders(),
            loadWaiterStats()
        ]);
    }, 30000);
}

/**
 * Utility function to get table status class
 */
function getTableStatusClass(status) {
    const statusMap = {
        'available': 'available',
        'occupied': 'occupied',
        'need-assistance': 'need-assistance',
        'reserved': 'occupied'
    };
    return statusMap[status] || 'available';
}

/**
 * Utility function to get table status text
 */
function getTableStatusText(status) {
    const statusMap = {
        'available': 'Available',
        'occupied': 'Occupied',
        'need-assistance': 'Need Assistance',
        'reserved': 'Reserved'
    };
    return statusMap[status] || 'Available';
}

/**
 * Utility function to get order status class
 */
function getOrderStatusClass(status) {
    const statusMap = {
        'pending': 'text-warning',
        'preparing': 'text-info',
        'ready': 'text-success',
        'served': 'text-primary',
        'paid': 'text-secondary'
    };
    return statusMap[status] || '';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWaiterDashboard);
} else {
    initWaiterDashboard();
}

// Keep all existing update functions (updateRecentActivity, updateStats, updateDashboard, etc.)

/**
 * Setup event listeners
 */
/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Navigation
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            if (view) {
                switchView(view);
            }
        });
    });

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('staffSession');
            window.location.href = 'login.html';
        });
    }

    // Quick action buttons
    if (newOrderBtn) {
        newOrderBtn.addEventListener('click', () => {
            showOrderModal();
        });
    }

    if (viewTablesBtn) {
        viewTablesBtn.addEventListener('click', () => {
            switchView('tables');
        });
    }

    // Modal close buttons
    const closeOrderModalBtn = document.getElementById('close-order-modal');
    const closeTableModalBtn = document.getElementById('close-table-modal');
    
    if (closeOrderModalBtn) {
        closeOrderModalBtn.addEventListener('click', closeOrderModal);
    }
    
    if (closeTableModalBtn) {
        closeTableModalBtn.addEventListener('click', closeTableModal);
    }

    // Order form
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }

    // Cancel order button
    if (cancelOrderBtn) {
        cancelOrderBtn.addEventListener('click', closeOrderModal);
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === orderModal) {
            closeOrderModal();
        }
        if (e.target === tableModal) {
            closeTableModal();
        }
    });

    // Event delegation for quantity buttons
    document.addEventListener('click', (e) => {
        // Increase quantity
        if (e.target.classList.contains('increase-btn')) {
            const itemId = e.target.getAttribute('data-item-id');
            if (itemId) {
                increaseItemQuantity(itemId);
            }
        }
        
        // Decrease quantity
        if (e.target.classList.contains('decrease-btn')) {
            const itemId = e.target.getAttribute('data-item-id');
            if (itemId) {
                decreaseItemQuantity(itemId);
            }
        }
        
        // Remove item
        if (e.target.classList.contains('remove-btn')) {
            const itemId = e.target.getAttribute('data-item-id');
            if (itemId) {
                removeItem(itemId);
            }
        }
    });
}

/**
 * Show message to user
 */
function showMessage(message, type) {
    if (!dashboardMessage) return;

    dashboardMessage.textContent = message;
    dashboardMessage.className = `message ${type}`;
    
    setTimeout(() => {
        dashboardMessage.className = 'message';
    }, 5000);
}