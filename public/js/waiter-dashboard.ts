/**
 * Waiter Dashboard Application Logic
 * Handles table management, order tracking, billing, and performance metrics
 * NOTE: Waiters cannot change order status - only view orders and generate bills
 */

const DASHBOARD_API_BASE = 'http://localhost:3000/api';

// State
let waiterTables: any[] = [];
let waiterOrders: any[] = [];
let waiterMenuItems: any[] = [];
let waiterStats: any = {};
let currentWaiter: any = null;
let currentSelectedTable: any = null;
let selectedOrderItems: any[] = [];
let currentBill: any = null;

// DOM Elements
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
const waiterName = document.getElementById('waiter-name') as HTMLElement;
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const tablesContainer = document.getElementById('tables-container') as HTMLElement;
const ordersContainer = document.getElementById('orders-container') as HTMLElement;
const recentActivity = document.getElementById('recent-activity') as HTMLElement;
const dashboardMessage = document.getElementById('dashboard-message') as HTMLElement;

// Billing Elements
const orderSelect = document.getElementById('order-select') as HTMLSelectElement;
const loadOrderBtn = document.getElementById('load-order-btn') as HTMLButtonElement;
const billPreview = document.getElementById('bill-preview') as HTMLElement;
const billItems = document.getElementById('bill-items') as HTMLElement;
const billSubtotal = document.getElementById('bill-subtotal') as HTMLElement;
const billTax = document.getElementById('bill-tax') as HTMLElement;
const billTotal = document.getElementById('bill-total') as HTMLElement;
const paymentMethod = document.getElementById('payment-method') as HTMLSelectElement;
const processPaymentBtn = document.getElementById('process-payment-btn') as HTMLButtonElement;
const billingMessage = document.getElementById('billing-message') as HTMLElement;

// Modal Elements
const orderModal = document.getElementById('order-modal') as HTMLElement;
const tableModal = document.getElementById('table-modal') as HTMLElement;
const orderForm = document.getElementById('order-form') as HTMLFormElement;
const orderTableSelect = document.getElementById('order-table') as HTMLSelectElement;
const menuItemsContainer = document.getElementById('menu-items-container') as HTMLElement;
const selectedItemsContainer = document.getElementById('selected-items') as HTMLElement;
const orderTotalElement = document.getElementById('order-total') as HTMLElement;
const modalTableNumber = document.getElementById('modal-table-number') as HTMLElement;
const tableDetails = document.getElementById('table-details') as HTMLElement;

// Stats elements
const activeTablesCount = document.getElementById('active-tables-count') as HTMLElement;
const pendingOrdersCount = document.getElementById('pending-orders-count') as HTMLElement;
const todayRevenue = document.getElementById('today-revenue') as HTMLElement;
const avgServiceTime = document.getElementById('avg-service-time') as HTMLElement;
const totalTablesServed = document.getElementById('total-tables-served') as HTMLElement;
const totalOrdersCreated = document.getElementById('total-orders-created') as HTMLElement;
const totalRevenue = document.getElementById('total-revenue') as HTMLElement;
const customerRating = document.getElementById('customer-rating') as HTMLElement;
const orderAccuracy = document.getElementById('order-accuracy') as HTMLElement;
const peakHour = document.getElementById('peak-hour') as HTMLElement;

// Buttons
const newOrderBtn = document.getElementById('new-order-btn') as HTMLButtonElement;
const viewTablesBtn = document.getElementById('view-tables-btn') as HTMLButtonElement;
const goToBillingBtn = document.getElementById('go-to-billing-btn') as HTMLButtonElement;
const createOrderBtn = document.getElementById('create-order-btn') as HTMLButtonElement;
const requestAssistanceBtn = document.getElementById('request-assistance-btn') as HTMLButtonElement;
const markAvailableBtn = document.getElementById('mark-available-btn') as HTMLButtonElement;
const cancelOrderBtn = document.getElementById('cancel-order') as HTMLButtonElement;

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
        if (waiterName) {
            waiterName.textContent = sessionData.name || 'Waiter';
        }
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
            (order.status === 'pending' || order.status === 'preparing' || order.status === 'ready')
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
 * NOTE: Waiters can only VIEW orders, not change their status
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
        const itemsHTML = order.items.map((item: any) => {
            const menuItem = waiterMenuItems.find(m => m.id === item.menuItemId);
            const itemName = menuItem ? menuItem.name : 'Unknown Item';
            return `
                <div class="order-item">
                    <span>${itemName} x${item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)} EGP</span>
                </div>
            `;
        }).join('');

        const total = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const statusClass = getOrderStatusClass(order.status);

        return `
            <div class="order-card">
                <div class="order-header">
                    <h3>Order #${order.id} - Table ${order.tableNumber}</h3>
                    <div class="order-actions">
                        ${order.status === 'served' ? `<button class="btn btn-danger" onclick="generateBill('${order.id}')">Generate Bill</button>` : ''}
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
        const subtotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
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
        if (billPreview) {
            billPreview.style.display = 'block';
        }
        showBillingMessage('Bill generated successfully', 'success');

    } catch (error) {
        console.error('Error generating bill:', error);
        showBillingMessage('Error generating bill. Please try again.', 'error');
    }
}

/**
 * Display bill preview
 */
function displayBill(bill: any) {
    if (!billItems || !billSubtotal || !billTax || !billTotal) return;

    // Display bill items
    billItems.innerHTML = bill.items.map((item: any) => {
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
        // Update order status to paid via API
        const response = await fetch(`${DASHBOARD_API_BASE}/bills/${currentBill.id}/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                paymentMethod: paymentMethodValue
            })
        });

        if (response.ok) {
            showBillingMessage(`Payment processed successfully with ${paymentMethodValue}! Printing receipt...`, 'success');

            // Generate and print receipt
            setTimeout(() => {
                generateAndPrintReceipt(currentBill);
            }, 1500);

            // Reset billing form
            setTimeout(() => {
                if (orderSelect) orderSelect.value = '';
                if (billPreview) billPreview.style.display = 'none';
                currentBill = null;

                // Refresh data
                loadOrders().then(() => {
                    populateBillingOrderSelect();
                    calculatePerformanceMetrics();
                });
            }, 2000);
        } else {
            const error = await response.json();
            showBillingMessage(error.error || 'Failed to process payment', 'error');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        showBillingMessage('Error processing payment', 'error');
    }
}

/**
 * Generate and print receipt
 */
function generateAndPrintReceipt(bill: any) {
    if (!bill || !bill.items || bill.items.length === 0) {
        console.error('Invalid bill data for receipt');
        return;
    }

    // Get current date and time
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    // Calculate totals
    const subtotal = bill.subtotal || bill.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const tax = bill.tax || subtotal * 0.1;
    const total = bill.total || subtotal + tax;

    // Format items for receipt
    const itemsHTML = bill.items.map((item: any) => {
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

    const groupedItems = waiterMenuItems.reduce((acc: any, item: any) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {});

    menuItemsContainer.innerHTML = Object.entries(groupedItems).map(([category, items]) => {
        const itemsArray = items as any[];
        return `
        <div class="menu-category">
            <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
            <div class="menu-items-grid">
                ${itemsArray.map(item => `
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
    `;
    }).join('');
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
function handleTableClick(event: Event) {
    const tableCard = event.currentTarget as HTMLElement;
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
function showTableModal(table: any) {
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
function increaseItemQuantity(itemId: string) {
    const item = waiterMenuItems.find(m => m.id === itemId);
    if (!item) return;

    const existingItemIndex = selectedOrderItems.findIndex(i => i.menuItemId === itemId);

    if (existingItemIndex > -1) {
        selectedOrderItems[existingItemIndex].quantity++;
    } else {
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
}

/**
 * Decrease item quantity in order
 */
function decreaseItemQuantity(itemId: string) {
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
}

/**
 * Update item quantity display
 */
function updateItemQuantityDisplay(itemId: string) {
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
function removeItem(itemId: string) {
    selectedOrderItems = selectedOrderItems.filter(i => i.menuItemId !== itemId);
    updateSelectedItems();
    updateOrderTotal();
    updateItemQuantityDisplay(itemId);
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
function showOrderModal(prefilledTable: string | number = '') {
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
        orderTableSelect.value = String(prefilledTable);
    }

    orderModal.style.display = 'block';
}

/**
 * Handle order form submission
 */
async function handleOrderSubmit(e: Event) {
    e.preventDefault();

    if (!orderForm) return;

    const formData = new FormData(orderForm);
    const tableNumber = parseInt(formData.get('tableNumber') as string);
    const customerName = formData.get('customerName') as string;

    if (!tableNumber) {
        showMessage('Please select a table', 'error');
        return;
    }

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
async function updateTableStatus(tableNumber: number, status: string) {
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
async function markTableAvailable(tableId: string) {
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
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    if (recentOrders.length === 0) {
        recentActivity.innerHTML = '<p>No recent activity.</p>';
        return;
    }

    recentActivity.innerHTML = recentOrders.map(order => {
        const total = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
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
    if (waiterStats) {
        if (customerRating) {
            customerRating.textContent = String(waiterStats.customerRating || '0.0');
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
async function assignTableToWaiter(tableId: string) {
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
 * Mark table as needing assistance
 */
async function assistTable(tableId: string) {
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
            return sum + order.items.reduce((itemSum: number, item: any) =>
                itemSum + (item.price * item.quantity), 0
            );
        }, 0);

    // Find peak hour
    const hourCounts: { [key: number]: number } = {};
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
        totalTablesServed.textContent = String(tablesServedToday);
    }
    if (totalOrdersCreated) {
        totalOrdersCreated.textContent = String(totalOrdersToday);
    }
    if (totalRevenue) {
        totalRevenue.textContent = `${todaysRevenue.toFixed(2)} EGP`;
    }
    if (peakHour) {
        peakHour.textContent = peakHourText;
    }

    // Update overview stats
    if (activeTablesCount) {
        activeTablesCount.textContent = String(waiterTables.filter(table =>
            table.status === 'occupied' || table.status === 'need-assistance'
        ).length);
    }
    if (pendingOrdersCount) {
        pendingOrdersCount.textContent = String(waiterOrders.filter(order =>
            order.status === 'pending' || order.status === 'preparing'
        ).length);
    }
    if (todayRevenue) {
        todayRevenue.textContent = `${todaysRevenue.toFixed(2)} EGP`;
    }
}

/**
 * Generate bill for order (redirects to billing view)
 */
function generateBill(orderId: string) {
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
 * Make generateBill available globally for onclick handlers
 */
(window as any).generateBill = generateBill;

/**
 * Show message in billing section
 */
function showBillingMessage(message: string, type: string) {
    if (!billingMessage) return;

    billingMessage.textContent = message;
    billingMessage.className = `message ${type}`;

    setTimeout(() => {
        billingMessage.className = 'message';
    }, 5000);
}

/**
 * Switch between dashboard views
 */
function switchView(viewName: string) {
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
function getTableStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
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
function getTableStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
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
function getOrderStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
        'pending': 'status-pending',
        'preparing': 'status-preparing',
        'ready': 'status-preparing',
        'served': 'status-served',
        'paid': 'status-paid'
    };
    return statusMap[status] || '';
}

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
        const target = e.target as HTMLElement;
        // Increase quantity
        if (target.classList.contains('increase-btn')) {
            const itemId = target.getAttribute('data-item-id');
            if (itemId) {
                increaseItemQuantity(itemId);
            }
        }

        // Decrease quantity
        if (target.classList.contains('decrease-btn')) {
            const itemId = target.getAttribute('data-item-id');
            if (itemId) {
                decreaseItemQuantity(itemId);
            }
        }

        // Remove item
        if (target.classList.contains('remove-btn')) {
            const itemId = target.getAttribute('data-item-id');
            if (itemId) {
                removeItem(itemId);
            }
        }
    });
}

/**
 * Show message to user
 */
function showMessage(message: string, type: string) {
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWaiterDashboard);
} else {
    initWaiterDashboard();
}
