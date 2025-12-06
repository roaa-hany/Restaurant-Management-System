"use strict";

/**
 * Waiter Dashboard Application Logic
 * Handles table management, order tracking, billing, and performance metrics
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
let currentBill = null;

// DOM Elements
const logoutBtn = document.getElementById('logout-btn');
const waiterName = document.getElementById('waiter-name');
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const tablesContainer = document.getElementById('tables-container');
const ordersContainer = document.getElementById('orders-container');
const recentActivity = document.getElementById('recent-activity');
const dashboardMessage = document.getElementById('dashboard-message');

// Billing Elements
const orderSelect = document.getElementById('order-select');
const loadOrderBtn = document.getElementById('load-order-btn');
const billPreview = document.getElementById('bill-preview');
const billItems = document.getElementById('bill-items');
const billSubtotal = document.getElementById('bill-subtotal');
const billTax = document.getElementById('bill-tax');
const billTotal = document.getElementById('bill-total');
const paymentMethod = document.getElementById('payment-method');
const processPaymentBtn = document.getElementById('process-payment-btn');
const billingMessage = document.getElementById('billing-message');

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

// Stats elements
const activeTablesCount = document.getElementById('active-tables-count');
const pendingOrdersCount = document.getElementById('pending-orders-count');
const todayRevenue = document.getElementById('today-revenue');
const avgServiceTime = document.getElementById('avg-service-time');
const totalTablesServed = document.getElementById('total-tables-served');
const totalOrdersCreated = document.getElementById('total-orders-created');
const totalRevenue = document.getElementById('total-revenue');
const customerRating = document.getElementById('customer-rating');
const orderAccuracy = document.getElementById('order-accuracy');
const averageOrderValue = document.getElementById('average-order-value');
const peakHour = document.getElementById('peak-hour');
const mostPopularItem = document.getElementById('most-popular-item');

// Buttons
const newOrderBtn = document.getElementById('new-order-btn');
const viewTablesBtn = document.getElementById('view-tables-btn');
const goToBillingBtn = document.getElementById('go-to-billing-btn');
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
    populateBillingOrderSelect();
    calculatePerformanceMetrics();
    setupKitchenUpdates();
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
            populateBillingOrderSelect();
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

    // Filter orders to show only those that are not paid
    const filteredOrders = waiterOrders.filter(order =>
        (order.assignedWaiter === currentWaiter.id || !order.assignedWaiter) &&
        order.status !== 'paid'
    );

    if (filteredOrders.length === 0) {
        ordersContainer.innerHTML = '<p>No active orders assigned to you.</p>';
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
                        <button class="btn btn-danger" onclick="generateBill('${order.id}')">Generate Bill</button>
                    </div>
                </div>
                    <div class="order-info">
                      <div><strong>Status:</strong> <span class="status-badge ${statusClass}">${order.status}</span></div>
                      <div><strong>Created:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
                      <div><strong>Total:</strong> ${total.toFixed(2)} EGP</div>
                      ${order.estimatedPrepTime ? `<div><strong>Estimated prep time:</strong> ${order.estimatedPrepTime} min</div>` : ''}
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
 * Populate order select for billing
 */
function populateBillingOrderSelect() {
    const orderSelect = document.getElementById('order-select');

    if (!orderSelect) return;

    orderSelect.innerHTML = '<option value="">-- Select an order --</option>';

    // Only show orders that are served (ready for billing) and not paid
    const billableOrders = waiterOrders.filter(order =>
        order.status === 'served' &&
        order.status !== 'paid'
    );

    if (billableOrders.length === 0) {
        orderSelect.innerHTML = '<option value="">No billable orders available</option>';
        return;
    }

    billableOrders.forEach(order => {
        const option = document.createElement('option');
        option.value = order.id;
        option.textContent = `Order ${order.id} - Table ${order.tableNumber} - ${order.status}`;
        orderSelect.appendChild(option);
    });
}

/**
 * Load order for billing
 */
async function loadOrderForBilling() {
    const orderId = orderSelect.value;
    if (!orderId) {
        showBillingMessage('Please select an order', 'error');
        return;
    }

    try {
        // Find the order
        const order = waiterOrders.find(o => o.id === orderId);
        if (!order) {
            showBillingMessage('Order not found', 'error');
            return;
        }

        // Create bill from order
        const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        currentBill = {
            id: `BILL_${orderId}`,
            orderId: orderId,
            tableNumber: order.tableNumber,
            items: order.items,
            subtotal: subtotal,
            tax: tax,
            total: total,
            customerName: order.customerName || 'Walk-in Customer',
            createdAt: new Date().toISOString()
        };

        displayBill(currentBill);
        billPreview.style.display = 'block';
        showBillingMessage('Bill generated successfully', 'success');

    } catch (error) {
        console.error('Error generating bill:', error);
        showBillingMessage('Error generating bill. Please try again.', 'error');
    }
}

// Update billing dropdown
function updateBillingDropdown() {
    const orderSelect = document.getElementById('order-select');
    if (!orderSelect) return;

    // Remove paid orders from billing dropdown
    const options = Array.from(orderSelect.options);
    options.forEach((option, index) => {
        if (index > 0 && option.textContent.includes('paid')) {
            orderSelect.removeChild(option);
        }
    });

    // If no billable orders left
    if (orderSelect.options.length <= 1) {
        orderSelect.innerHTML = '<option value="">No billable orders available</option>';
    }
}

/**
 * Display bill preview
 */
function displayBill(bill) {
    if (!billItems || !billSubtotal || !billTax || !billTotal) return;

    // Display bill items
    billItems.innerHTML = bill.items.map(item => {
        const menuItem = waiterMenuItems.find(m => m.id === item.menuItemId);
        const itemName = menuItem ? menuItem.name : 'Unknown Item';
        return `
            <div class="bill-item">
                <span>${itemName} x${item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)} EGP</span>
            </div>
        `;
    }).join('');

    // Display totals
    billSubtotal.textContent = `${bill.subtotal.toFixed(2)} EGP`;
    billTax.textContent = `${bill.tax.toFixed(2)} EGP`;
    billTotal.textContent = `${bill.total.toFixed(2)} EGP`;
}

/**
 * Process payment and print receipt
 */
async function processPayment() {
    if (!currentBill) {
        showBillingMessage('Please generate a bill first', 'error');
        return;
    }

    const paymentMethodValue = paymentMethod.value;
    if (!paymentMethodValue) {
        showBillingMessage('Please select a payment method', 'error');
        return;
    }

    try {
        // Update bill with payment method
        currentBill.paymentMethod = paymentMethodValue;
        currentBill.paymentStatus = 'paid';

        // Update order status to paid
        await updateOrderStatus(currentBill.orderId, 'paid');

        // Show success message
        showBillingMessage(`Payment processed successfully with ${paymentMethodValue}! Printing receipt...`, 'success');

        // Generate and print receipt
        setTimeout(() => {
            generateAndPrintReceipt(currentBill);
        }, 1500);

        // Reset billing form
        setTimeout(() => {
            orderSelect.value = '';
            billPreview.style.display = 'none';
            currentBill = null;

            // Refresh data
            loadOrders().then(() => {
                populateBillingOrderSelect();
                calculatePerformanceMetrics();
            });
        }, 2000);

    } catch (error) {
        console.error('Error processing payment:', error);
        showBillingMessage('Error processing payment', 'error');
    }
}

/**
 * Generate and print receipt
 */
function generateAndPrintReceipt(bill) {
    if (!bill || !bill.items || bill.items.length === 0) {
        console.error('Invalid bill data for receipt');
        return;
    }

    // Get current date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    // Calculate totals
    const subtotal = bill.subtotal || bill.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = bill.tax || subtotal * 0.1;
    const total = bill.total || subtotal + tax;

    // Format items for receipt
    const itemsHTML = bill.items.map(item => {
        const menuItem = waiterMenuItems.find(m => m.id === item.menuItemId);
        const itemName = menuItem ? menuItem.name : 'Unknown Item';
        const itemTotal = (item.price * item.quantity).toFixed(2);
        return `
            <tr>
                <td>${itemName}</td>
                <td align="center">${item.quantity}</td>
                <td align="right">${item.price.toFixed(2)}</td>
                <td align="right">${itemTotal}</td>
            </tr>
        `;
    }).join('');

    // Create receipt HTML
    const receiptHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Receipt - Order ${bill.orderId}</title>
            <style>
                body {
                    font-family: 'Courier New', monospace;
                    max-width: 300px;
                    margin: 0 auto;
                    padding: 20px;
                    line-height: 1.4;
                }
                
                .receipt-header {
                    text-align: center;
                    border-bottom: 2px dashed #000;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                }
                
                .restaurant-name {
                    font-size: 22px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                }
                
                .receipt-info {
                    margin: 10px 0;
                    font-size: 14px;
                }
                
                .receipt-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                    font-size: 14px;
                }
                
                .receipt-table th {
                    border-bottom: 1px solid #000;
                    padding: 5px;
                    text-align: left;
                    font-weight: bold;
                }
                
                .receipt-table td {
                    padding: 5px;
                    border-bottom: 1px dashed #ddd;
                }
                
                .totals-section {
                    border-top: 2px dashed #000;
                    margin-top: 15px;
                    padding-top: 10px;
                    font-size: 15px;
                }
                
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 5px 0;
                }
                
                .grand-total {
                    font-size: 18px;
                    font-weight: bold;
                    margin-top: 10px;
                    border-top: 2px solid #000;
                    padding-top: 10px;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px dashed #666;
                    padding-top: 10px;
                }
                
                .thank-you {
                    text-align: center;
                    margin: 20px 0;
                    font-size: 16px;
                    font-weight: bold;
                }
                
                .payment-method {
                    margin: 10px 0;
                    font-weight: bold;
                }
                
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .receipt-container, .receipt-container * {
                        visibility: visible;
                    }
                    .receipt-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    @page {
                        size: auto;
                        margin: 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="receipt-header">
                    <div class="restaurant-name">Egyptian Restaurant</div>
                    <div>123 Nile Street, Cairo</div>
                    <div>Phone: (123) 456-7890</div>
                    <div>VAT: 123456789</div>
                </div>
                
                <div class="receipt-info">
                    <div><strong>Receipt #:</strong> ${bill.id || 'N/A'}</div>
                    <div><strong>Order #:</strong> ${bill.orderId || 'N/A'}</div>
                    <div><strong>Table #:</strong> ${bill.tableNumber || 'N/A'}</div>
                    <div><strong>Date:</strong> ${dateStr}</div>
                    <div><strong>Time:</strong> ${timeStr}</div>
                    <div><strong>Customer:</strong> ${bill.customerName || 'Walk-in Customer'}</div>
                </div>
                
                <table class="receipt-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th align="center">Qty</th>
                            <th align="right">Price</th>
                            <th align="right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                
                <div class="totals-section">
                    <div class="total-row">
                        <span>Subtotal:</span>
                        <span>${subtotal.toFixed(2)} EGP</span>
                    </div>
                    <div class="total-row">
                        <span>Tax (10%):</span>
                        <span>${tax.toFixed(2)} EGP</span>
                    </div>
                    <div class="total-row grand-total">
                        <span>TOTAL:</span>
                        <span>${total.toFixed(2)} EGP</span>
                    </div>
                </div>
                
                <div class="payment-method">
                    Payment Method: ${bill.paymentMethod ? bill.paymentMethod.toUpperCase() : 'N/A'}
                </div>
                
                <div class="thank-you">
                    Thank you for dining with us!
                </div>
                
                <div class="footer">
                    <div>*** RECEIPT ***</div>
                    <div>Keep this receipt for your records</div>
                    <div>For inquiries: info@egyptianrestaurant.com</div>
                    <div>${now.toLocaleString()}</div>
                </div>
            </div>
            
            <script>
                // Auto-print receipt
                window.onload = function() {
                    window.print();
                    
                    setTimeout(function() {
                        window.onafterprint = function() {
                            window.close();
                        };
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `;

    // Open receipt in new window and print
    try {
        const receiptWindow = window.open('', '_blank', 'width=400,height=600');
        if (receiptWindow) {
            receiptWindow.document.write(receiptHTML);
            receiptWindow.document.close();
        } else {
            alert('Receipt generated but could not open print window. Please allow pop-ups.');
        }
    } catch (error) {
        console.error('Error opening receipt window:', error);
        alert('Error generating receipt. Please try again.');
    }
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
    // Update from server stats if available
    if (waiterStats) {
        if (customerRating) {
            customerRating.textContent = waiterStats.customerRating || '0.0';
        }
        if (orderAccuracy) {
            orderAccuracy.textContent = `${waiterStats.orderAccuracy || 100}%`;
        }
        if (avgServiceTime) {
            avgServiceTime.textContent = `${waiterStats.avgServiceTime || 0} min`;
        }
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
 * Calculate performance metrics
 */
function calculatePerformanceMetrics() {
    if (!waiterOrders.length) return;

    const today = new Date().toDateString();
    const todaysOrders = waiterOrders.filter(order =>
        new Date(order.createdAt).toDateString() === today
    );

    // Tables served today (tables with paid orders)
    const tablesServedToday = new Set(
        todaysOrders
            .filter(order => order.status === 'paid')
            .map(order => order.tableNumber)
    ).size;

    // Total orders created today
    const totalOrdersToday = todaysOrders.length;

    // Today's revenue from paid orders
    const todaysRevenue = todaysOrders
        .filter(order => order.status === 'paid')
        .reduce((sum, order) => {
            const orderTotal = order.items.reduce((itemSum, item) =>
                itemSum + (item.price * item.quantity), 0
            );
            return (sum + 0.3*orderTotal);
        }, 0);


    // Find peak hour
    const hourCounts = {};
    todaysOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    let peakHourText = 'N/A';
    if (Object.keys(hourCounts).length > 0) {
        const peakHour = Object.entries(hourCounts).reduce((a, b) =>
            a[1] > b[1] ? a : b
        )[0];
        peakHourText = `${peakHour}:00 - ${parseInt(peakHour) + 1}:00`;
    }


    // Update performance metrics
    if (totalTablesServed) {
        totalTablesServed.textContent = tablesServedToday;
    }
    if (totalOrdersCreated) {
        totalOrdersCreated.textContent = totalOrdersToday;
    }
    if (totalRevenue) {
        totalRevenue.textContent = `${todaysRevenue.toFixed(2)} EGP`;
    }
    if (peakHour) {
        peakHour.textContent = peakHourText;
    }

    // Update overview stats
    if (activeTablesCount) {
        activeTablesCount.textContent = waiterTables.filter(table =>
            table.status === 'occupied' || table.status === 'need-assistance'
        ).length;
    }
    if (pendingOrdersCount) {
        pendingOrdersCount.textContent = waiterOrders.filter(order =>
            order.status === 'pending' || order.status === 'preparing'
        ).length;
    }
    if (todayRevenue) {
        todayRevenue.textContent = `${todaysRevenue.toFixed(2)} EGP`;
    }
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, newStatus) {
    try {
        // Update local state first
        const orderIndex = waiterOrders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            waiterOrders[orderIndex].status = newStatus;
        }

        // Update on server if available
        const response = await fetch(`${DASHBOARD_API_BASE}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus,
                waiterId: currentWaiter.id
            })
        });

        if (!response.ok) {
            console.warn('Failed to update order status on server, using local state');
        }

        // Update UI
        displayOrders();
        populateBillingOrderSelect();
        updateRecentActivity();
        calculatePerformanceMetrics();

        showMessage(`Order status updated to ${newStatus}`, 'success');

        // If marking as served, also update table status
        if (newStatus === 'served') {
            const order = waiterOrders[orderIndex];
            if (order) {
                await updateTableStatus(order.tableNumber, 'need-cleaning');
            }
        }

    } catch (error) {
        console.error('Error updating order status:', error);
        showMessage('Error updating order status', 'error');
    }
}

/**
 * Generate bill for order (redirects to billing view)
 */
function generateBill(orderId) {
    // Switch to billing view
    switchView('billing');

    // Find and select the order
    setTimeout(() => {
        const order = waiterOrders.find(o => o.id === orderId);
        if (order && orderSelect) {
            orderSelect.value = orderId;
            loadOrderForBilling();
        }
    }, 100);
}

/**
 * Show message in billing section
 */
function showBillingMessage(message, type) {
    if (!billingMessage) return;

    billingMessage.textContent = message;
    billingMessage.className = `message ${type}`;

    setTimeout(() => {
        billingMessage.className = 'message';
    }, 5000);
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
        const statusClass = getOrderStatusClass(order.status);
        return `
            <div class="order-card">
                <h4>Order #${order.id} - Table ${order.tableNumber}</h4>
                <div><strong>Status:</strong> <span class="status-badge ${statusClass}">${order.status}</span></div>
                <div><strong>Total:</strong> ${total.toFixed(2)} EGP</div>
                <div><strong>Time:</strong> ${new Date(order.createdAt).toLocaleTimeString()}</div>
            </div>
        `;
    }).join('');
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

    if (goToBillingBtn) {
        goToBillingBtn.addEventListener('click', () => {
            switchView('billing');
        });
    }

    const loadOrderBtn = document.getElementById('load-order-btn');
    if (loadOrderBtn) {
        loadOrderBtn.addEventListener('click', () => {
            loadOrderForBilling();
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

    // Process payment button
    const processPaymentBtn = document.getElementById('process-payment-btn');
    if (processPaymentBtn) {
        processPaymentBtn.addEventListener('click', processPayment);
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

/**
 * Listen for kitchen order updates
 */
function setupKitchenUpdates() {
    // Simple polling every 10 seconds to get kitchen status changes
    setInterval(() => {
        loadOrders();
    }, 10000);
}

/**
 * Fallback polling for order updates
 */
function setupOrderPolling() {
    // Poll for order updates every 30 seconds
    setInterval(async () => {
        await checkOrderStatusUpdates();
    }, 30000);
}

/**
 * Check for order status updates from kitchen
 */
async function checkOrderStatusUpdates() {
    try {
        const response = await fetch(`${DASHBOARD_API_BASE}/orders/updates`);
        if (response.ok) {
            const updates = await response.json();
            updates.forEach(update => {
                updateOrderStatusInUI(update.id, update.status, update.estimatedPrepTime);
            });
        }
    } catch (error) {
        console.error('Error checking order updates:', error);
    }
}

/**
 * Update order status in UI
 */
function updateOrderStatusInUI(orderId, status, estimatedTime = null) {
    const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
    if (!orderElement) return;

    // Update status badge
    const statusBadge = orderElement.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.className = `status-badge ${getOrderStatusClass(status)}`;
        statusBadge.textContent = status;
    }

    // Update actions based on new status
    updateOrderActions(orderElement, status);

    // Show estimated time if provided
    if (estimatedTime && status === 'preparing') {
        showEstimatedTime(orderElement, estimatedTime);
    }
}

/**
 * Show order ready notification
 */
function showOrderReadyNotification(orderId, tableNumber) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Order #${orderId} Ready`, {
            body: `Table ${tableNumber} - Order is ready for serving`,
            icon: '/notification-icon.png'
        });
    } else {
        // Fallback to browser alert
        alert(`⚠️ Order #${orderId} is ready for Table ${tableNumber}!`);
    }
}