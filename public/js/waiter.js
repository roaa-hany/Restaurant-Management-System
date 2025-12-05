"use strict";

// Scoped constants and variables for waiter app
const WAITER_API_BASE = 'http://localhost:3000/api';

// State
let waiterOrders = [];
let waiterMenuItems = [];
let currentBill = null;

// DOM Elements
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
const ordersContainer = document.getElementById('orders-container');
const waiterNavButtons = document.querySelectorAll('.nav-btn');
const waiterViews = document.querySelectorAll('.view');

/**
 * Initialize the waiter application
 */
async function initWaiterApp() {
    console.log('Initializing waiter app...');

    // First check session
    verifyWaiterSession();

    // Try to load data
    try {
        await Promise.all([loadOrders(), loadMenuItems()]);
        setupWaiterEventListeners();
        populateOrderSelect();
        displayOrders();
        console.log('Waiter app initialized successfully');
    } catch (error) {
        console.error('Failed to initialize waiter app:', error);
        showWaiterMessage(billingMessage, 'Failed to load data. Please check connection and refresh.', 'error');
    }
}

/**
 * Load orders from API
 */
async function loadOrders() {
    try {
        console.log('Loading orders from API...');
        const response = await fetch(`${WAITER_API_BASE}/orders`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        waiterOrders = await response.json();
        console.log(`Loaded ${waiterOrders.length} orders:`, waiterOrders);

        populateOrderSelect();
        displayOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
        showWaiterMessage(billingMessage, 'Error loading orders. Check if server is running.', 'error');
    }
}

/**
 * Load menu items from API (for displaying item names in bills)
 */
async function loadMenuItems() {
    try {
        console.log('Loading menu items from API...');
        const response = await fetch(`${WAITER_API_BASE}/menu`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        waiterMenuItems = await response.json();
        console.log(`Loaded ${waiterMenuItems.length} menu items`);
    } catch (error) {
        console.error('Error loading menu items:', error);

    }
}

/**
 * Populate order select dropdown
 */
function populateOrderSelect() {
    if (!orderSelect) {
        console.error('Order select element not found');
        return;
    }

    console.log('Populating order select with', waiterOrders.length, 'orders');

    orderSelect.innerHTML = '<option value="">-- Select an order --</option>';

    if (waiterOrders.length === 0) {
        console.log('No orders to populate');
        return;
    }

    waiterOrders.forEach(order => {
        const option = document.createElement('option');
        option.value = order.id;
        option.textContent = `Order ${order.id} - Table ${order.tableNumber} - ${order.status}`;
        orderSelect.appendChild(option);
    });

    console.log('Order select populated successfully');
}

/**
 * Display all orders
 */
function displayOrders() {
    if (!ordersContainer) {
        console.error('Orders container element not found');
        return;
    }

    if (waiterOrders.length === 0) {
        ordersContainer.innerHTML = '<p class="no-orders">No orders found.</p>';
        console.log('No orders to display');
        return;
    }

    console.log('Displaying', waiterOrders.length, 'orders');

    ordersContainer.innerHTML = waiterOrders.map(order => {
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
        const statusClass = order.status === 'pending' ? 'status-pending' :
            order.status === 'served' ? 'status-served' :
                order.status === 'paid' ? 'status-paid' : '';

        return `
            <div class="order-card">
                <h3>Order ${order.id}</h3>
                <div class="order-info">
                    <div class="order-info-item">
                        <strong>Table:</strong> ${order.tableNumber}
                    </div>
                    <div class="order-info-item">
                        <strong>Status:</strong> <span class="${statusClass}">${order.status}</span>
                    </div>
                    <div class="order-info-item">
                        <strong>Created:</strong> ${new Date(order.createdAt).toLocaleString()}
                    </div>
                    <div class="order-info-item">
                        <strong>Total:</strong> ${total.toFixed(2)} EGP
                    </div>
                    ${order.customerName ? `
                        <div class="order-info-item">
                            <strong>Customer:</strong> ${order.customerName}
                        </div>
                    ` : ''}
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
 * Load order and generate bill preview
 */
async function loadOrder() {
    const orderId = orderSelect.value;
    console.log('Loading order for billing:', orderId);

    if (!orderId) {
        showWaiterMessage(billingMessage, 'Please select an order', 'error');
        return;
    }

    try {
        // For testing, create a mock bill if API fails
        const order = waiterOrders.find(o => o.id === orderId);
        if (!order) {
            throw new Error('Order not found');
        }

        // Mock bill generation (replace with actual API call when available)
        const mockBill = {
            id: `BILL_${orderId}`,
            orderId: orderId,
            tableNumber: order.tableNumber,
            items: order.items,
            subtotal: order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            tax: 0, // Will calculate below
            total: 0, // Will calculate below
            customerName: order.customerName || 'Walk-in Customer'
        };

        // Calculate tax and total
        mockBill.tax = mockBill.subtotal * 0.1;
        mockBill.total = mockBill.subtotal + mockBill.tax;

        console.log('Generated bill:', mockBill);
        currentBill = mockBill;

        // Display the bill
        displayBill(currentBill);
        billPreview.style.display = 'block';
        showWaiterMessage(billingMessage, 'Bill generated successfully', 'success');

    } catch (error) {
        console.error('Error generating bill:', error);
        showWaiterMessage(billingMessage, 'Error generating bill. Using sample data.', 'error');
    }
}

/**
 * Display bill preview
 */
function displayBill(bill) {
    if (!billItems || !billSubtotal || !billTax || !billTotal) {
        console.error('Bill display elements not found');
        return;
    }

    console.log('Displaying bill:', bill);

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

    console.log('Bill displayed successfully');
}

/**
 * Process payment and print receipt
 */
async function processPayment() {
    if (!currentBill) {
        showWaiterMessage(billingMessage, 'Please generate a bill first', 'error');
        return;
    }

    const paymentMethodValue = paymentMethod.value;
    if (!paymentMethodValue) {
        showWaiterMessage(billingMessage, 'Please select a payment method', 'error');
        return;
    }

    console.log('Processing payment for bill:', currentBill.id, 'Method:', paymentMethodValue);

    try {
        // Update bill with payment method
        currentBill.paymentMethod = paymentMethodValue;
        currentBill.paymentStatus = 'paid';

        // Show success message
        showWaiterMessage(billingMessage, `Payment processed successfully with ${paymentMethodValue}! Printing receipt...`, 'success');

        // Generate and print receipt
        setTimeout(() => {
            generateAndPrintReceipt(currentBill);
        }, 1500);

        // Reset form
        setTimeout(() => {
            orderSelect.value = '';
            billPreview.style.display = 'none';
            currentBill = null;

            // Update order status in local data
            const orderIndex = waiterOrders.findIndex(o => o.id === currentBill?.orderId);
            if (orderIndex !== -1) {
                waiterOrders[orderIndex].status = 'paid';
                populateOrderSelect();
                displayOrders();
            }
        }, 2000);

    } catch (error) {
        console.error('Error processing payment:', error);
        showWaiterMessage(billingMessage, 'Error processing payment', 'error');
    }
}

/**
 * Generate and print receipt automatically after payment
 */
function generateAndPrintReceipt(bill) {
    if (!bill || !bill.items || bill.items.length === 0) {
        console.error('Invalid bill data for receipt');
        return;
    }

    console.log('Generating receipt for bill:', bill.id);

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
                    console.log('Receipt loaded, printing...');
                    window.print();
                    
                    setTimeout(function() {
                        window.onafterprint = function() {
                            console.log('Print completed, closing window');
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
            console.log('Receipt window opened');
        } else {
            console.error('Failed to open receipt window');
            alert('Receipt generated but could not open print window. Please allow pop-ups for this site.');
        }
    } catch (error) {
        console.error('Error opening receipt window:', error);
        alert('Error generating receipt. Please try again.');
    }
}

/**
 * Setup event listeners
 */
function setupWaiterEventListeners() {
    console.log('Setting up event listeners...');

    if (loadOrderBtn) {
        loadOrderBtn.addEventListener('click', loadOrder);
        console.log('Load order button listener added');
    } else {
        console.error('Load order button not found');
    }

    if (processPaymentBtn) {
        processPaymentBtn.addEventListener('click', processPayment);
        console.log('Process payment button listener added');
    } else {
        console.error('Process payment button not found');
    }

    // Navigation buttons
    if (waiterNavButtons.length > 0) {
        waiterNavButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');
                if (view) {
                    switchWaiterView(view);
                }
            });
        });
        console.log('Navigation buttons listeners added');
    }

    console.log('Event listeners setup complete');
}

/**
 * Switch between views
 */
function switchWaiterView(viewName) {
    console.log('Switching to view:', viewName);

    // Update nav buttons
    waiterNavButtons.forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update views
    waiterViews.forEach(view => {
        if (view.id === `${viewName}-view`) {
            view.classList.add('active');
        } else {
            view.classList.remove('active');
        }
    });
}

/**
 * Show a message to the user
 */
function showWaiterMessage(element, message, type) {
    if (!element) {
        console.error('Message element not found');
        return;
    }

    element.textContent = message;
    element.className = `message ${type}`;

    console.log(`Message (${type}): ${message}`);

    setTimeout(() => {
        element.className = 'message';
        element.textContent = '';
    }, 5000);
}

/**
 * Check if user is authenticated (soft check - doesn't redirect)
 */
function verifyWaiterSession() {
    const session = localStorage.getItem('staffSession');
    if (!session) {
        console.log('No session found, allowing access for billing system');
        // Allow access to billing system even without login for now
        return;
    }

    try {
        const sessionData = JSON.parse(session);
        console.log('Session data:', sessionData);

        if (sessionData.role !== 'waiter') {
            console.log('Not a waiter session, but allowing access');
            // Not a waiter, but allow access for now
            return;
        }
    } catch (error) {
        console.error('Error parsing session:', error);
        // Invalid session, but allow access for now
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing waiter app...');
        initWaiterApp();
    });
} else {
    console.log('DOM already loaded, initializing waiter app...');
    initWaiterApp();
}

// Add some CSS for better visibility
const style = document.createElement('style');
style.textContent = `
    .no-orders {
        text-align: center;
        padding: 2rem;
        color: #666;
        font-style: italic;
    }
    
    .status-pending { 
        color: #ffc107; 
        font-weight: bold;
    }
    
    .status-served { 
        color: #28a745; 
        font-weight: bold;
    }
    
    .status-paid { 
        color: #6c757d; 
        font-weight: bold;
    }
`;
document.head.appendChild(style);