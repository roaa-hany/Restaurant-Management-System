"use strict";
/**
 * Waiter interface application logic
 * Handles bill generation and payment processing
 */
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
    await Promise.all([loadOrders(), loadMenuItems()]);
    setupWaiterEventListeners();
    populateOrderSelect();
    displayOrders();
}
/**
 * Load orders from API
 */
async function loadOrders() {
    try {
        const response = await fetch(`${WAITER_API_BASE}/orders`);
        waiterOrders = await response.json();
        populateOrderSelect();
        displayOrders();
    }
    catch (error) {
        console.error('Error loading orders:', error);
    }
}
/**
 * Load menu items from API (for displaying item names in bills)
 */
async function loadMenuItems() {
    try {
        const response = await fetch(`${WAITER_API_BASE}/menu`);
        waiterMenuItems = await response.json();
    }
    catch (error) {
        console.error('Error loading menu items:', error);
    }
}
/**
 * Populate order select dropdown
 */
function populateOrderSelect() {
    if (!orderSelect)
        return;
    orderSelect.innerHTML = '<option value="">-- Select an order --</option>';
    waiterOrders.forEach(order => {
        const option = document.createElement('option');
        option.value = order.id;
        option.textContent = `Order ${order.id} - Table ${order.tableNumber} - ${order.status}`;
        orderSelect.appendChild(option);
    });
}
/**
 * Display all orders
 */
function displayOrders() {
    if (!ordersContainer)
        return;
    if (waiterOrders.length === 0) {
        ordersContainer.innerHTML = '<p>No orders found.</p>';
        return;
    }
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
        return `
      <div class="order-card">
        <h3>Order ${order.id}</h3>
        <div class="order-info">
          <div class="order-info-item">
            <strong>Table:</strong> ${order.tableNumber}
          </div>
          <div class="order-info-item">
            <strong>Status:</strong> ${order.status}
          </div>
          <div class="order-info-item">
            <strong>Created:</strong> ${new Date(order.createdAt).toLocaleString()}
          </div>
          <div class="order-info-item">
            <strong>Total:</strong> ${total.toFixed(2)} EGP
          </div>
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
    if (!orderId) {
        showWaiterMessage(billingMessage, 'Please select an order', 'error');
        return;
    }
    try {
        const response = await fetch(`${WAITER_API_BASE}/bills/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orderId })
        });
        if (response.ok) {
            currentBill = await response.json();
            if (currentBill) {
                displayBill(currentBill);
                billPreview.style.display = 'block';
                showWaiterMessage(billingMessage, 'Bill generated successfully', 'success');
            }
        }
        else {
            const error = await response.json();
            showWaiterMessage(billingMessage, error.error || 'Failed to generate bill', 'error');
        }
    }
    catch (error) {
        console.error('Error generating bill:', error);
        showWaiterMessage(billingMessage, 'Error generating bill. Please try again.', 'error');
    }
}
/**
 * Display bill preview
 */
function displayBill(bill) {
    if (!billItems || !billSubtotal || !billTax || !billTotal)
        return;
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
 * Process payment
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
    try {
        // First update the bill with payment method
        const billData = {
            ...currentBill,
            paymentMethod: paymentMethodValue
        };
        const response = await fetch(`${WAITER_API_BASE}/bills/${currentBill.id}/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(billData)
        });
        if (response.ok) {
            showWaiterMessage(billingMessage, `Payment processed successfully! Payment method: ${paymentMethodValue}`, 'success');
            // Reset form
            orderSelect.value = '';
            billPreview.style.display = 'none';
            currentBill = null;
            // Reload orders
            await loadOrders();
        }
        else {
            const error = await response.json();
            showWaiterMessage(billingMessage, error.error || 'Failed to process payment', 'error');
        }
    }
    catch (error) {
        console.error('Error processing payment:', error);
        showWaiterMessage(billingMessage, 'Error processing payment. Please try again.', 'error');
    }
}
/**
 * Setup event listeners
 */
function setupWaiterEventListeners() {
    if (loadOrderBtn) {
        loadOrderBtn.addEventListener('click', loadOrder);
    }
    if (processPaymentBtn) {
        processPaymentBtn.addEventListener('click', processPayment);
    }
    // Navigation buttons
    waiterNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            if (view) {
                switchWaiterView(view);
            }
        });
    });
}
/**
 * Switch between views
 */
function switchWaiterView(viewName) {
    // Update nav buttons
    waiterNavButtons.forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.add('active');
        }
        else {
            btn.classList.remove('active');
        }
    });
    // Update views
    waiterViews.forEach(view => {
        if (view.id === `${viewName}-view`) {
            view.classList.add('active');
        }
        else {
            view.classList.remove('active');
        }
    });
}
/**
 * Show a message to the user
 */
function showWaiterMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    setTimeout(() => {
        element.className = 'message';
    }, 5000);
}
/**
 * Check if user is authenticated (soft check - doesn't redirect)
 * This is for the billing interface which allows access without strict auth for now
 */
function verifyWaiterSession() {
    const session = localStorage.getItem('staffSession');
    if (!session) {
        // Allow access to billing system even without login for now
        // In future sprints, this can be enforced
        return;
    }
    try {
        const sessionData = JSON.parse(session);
        if (sessionData.role !== 'waiter') {
            // Not a waiter, but allow access for now
            return;
        }
    }
    catch (error) {
        // Invalid session, but allow access for now
    }
}
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        verifyWaiterSession();
        initWaiterApp();
    });
}
else {
    verifyWaiterSession();
    initWaiterApp();
}
