"use strict";
/**
 * Kitchen Dashboard JavaScript
 * Compiled from TypeScript
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
class KitchenDashboard {
    constructor() {
        this.orders = [];
        this.stats = {
            pendingOrders: 0,
            preparingOrders: 0,
            readyOrders: 0,
            todayCompleted: 0,
            avgPrepTime: 0
        };
        this.currentChef = null;
        this.currentFilter = 'all';
        this.timers = new Map();
        this.currentOrderId = null;
        this.initializeElements();
        this.setupEventListeners();
        this.init();
    }
    initializeElements() {
        this.chefNameEl = document.getElementById('chef-name');
        this.logoutBtn = document.getElementById('logout-btn');
        this.ordersContainer = document.getElementById('orders-container');
        this.kitchenMessage = document.getElementById('kitchen-message');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.pendingOrdersEl = document.getElementById('pending-orders');
        this.preparingOrdersEl = document.getElementById('preparing-orders');
        this.readyOrdersEl = document.getElementById('ready-orders');
        this.todayCompletedEl = document.getElementById('today-completed');
        this.avgPrepTimeEl = document.getElementById('avg-prep-time');
        this.orderDetailsModal = document.getElementById('order-details-modal');
        this.prepTimeModal = document.getElementById('prep-time-modal');
    }
    setupEventListeners() {
        // Logout
        this.logoutBtn === null || this.logoutBtn === void 0 ? void 0 : this.logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                if (filter) {
                    this.setFilter(filter);
                }
            });
        });
        // Modal close buttons
        var _a, _b, _c;
        (_a = document.getElementById('close-order-details')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            this.closeModal('order-details-modal');
        });
        (_b = document.getElementById('close-prep-time')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
            this.closeModal('prep-time-modal');
        });
        (_c = document.getElementById('confirm-prep-time')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', this.confirmPrepTime.bind(this));
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.orderDetailsModal) {
                this.closeModal('order-details-modal');
            }
            if (e.target === this.prepTimeModal) {
                this.closeModal('prep-time-modal');
            }
        });
        // Event delegation for order actions
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('accept-order-btn')) {
                const orderId = target.getAttribute('data-order-id');
                if (orderId) {
                    this.showPrepTimeModal(orderId);
                }
            }
            if (target.classList.contains('complete-order-btn')) {
                const orderId = target.getAttribute('data-order-id');
                if (orderId) {
                    this.completeOrder(orderId);
                }
            }
            if (target.classList.contains('ready-order-btn')) {
                const orderId = target.getAttribute('data-order-id');
                if (orderId) {
                    this.markOrderReady(orderId);
                }
            }
            if (target.classList.contains('view-details-btn')) {
                const orderId = target.getAttribute('data-order-id');
                if (orderId) {
                    this.showOrderDetails(orderId);
                }
            }
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkAuth();
            yield this.loadOrders();
            this.setupPolling();
        });
    }
    checkAuth() {
        return __awaiter(this, void 0, void 0, function* () {
            const session = localStorage.getItem('kitchenSession');
            if (!session) {
                window.location.href = 'login.html';
                return;
            }
            try {
                const sessionData = JSON.parse(session);
                this.currentChef = {
                    id: sessionData.id,
                    name: sessionData.name
                };
                if (this.chefNameEl) {
                    this.chefNameEl.textContent = sessionData.name;
                }
            }
            catch (error) {
                localStorage.removeItem('kitchenSession');
                window.location.href = 'login.html';
            }
        });
    }
    handleLogout() {
        localStorage.removeItem('kitchenSession');
        window.location.href = 'login.html';
    }
    loadOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${KITCHEN_API_BASE}/orders`);
                if (response.ok) {
                    this.orders = yield response.json();
                    this.calculateStats();
                    this.renderOrders();
                    this.updateTimers();
                }
                else {
                    this.showMessage('Error loading orders', 'error');
                }
            }
            catch (error) {
                console.error('Error loading orders:', error);
                this.showMessage('Error loading orders', 'error');
            }
        });
    }
    calculateStats() {
        const today = new Date().toDateString();
        this.stats.pendingOrders = this.orders.filter(o => o.status === 'pending').length;
        this.stats.preparingOrders = this.orders.filter(o => o.status === 'preparing').length;
        this.stats.readyOrders = this.orders.filter(o => o.status === 'ready').length;
        this.stats.todayCompleted = this.orders.filter(o => o.status === 'completed' &&
            new Date(o.updatedAt || o.createdAt).toDateString() === today).length;
        // Calculate average prep time for completed orders today
        const completedToday = this.orders.filter(o => o.status === 'completed' &&
            o.estimatedPrepTime &&
            new Date(o.updatedAt || o.createdAt).toDateString() === today);
        if (completedToday.length > 0) {
            const totalTime = completedToday.reduce((sum, order) => sum + (order.estimatedPrepTime || 0), 0);
            this.stats.avgPrepTime = Math.round(totalTime / completedToday.length);
        }
        else {
            this.stats.avgPrepTime = 0;
        }
        this.updateStatsDisplay();
    }
    updateStatsDisplay() {
        var _a, _b, _c, _d, _e;
        if (this.pendingOrdersEl)
            (_a = this.pendingOrdersEl).textContent = (_a = this.stats.pendingOrders) === null || _a === void 0 ? void 0 : _a.toString();
        if (this.preparingOrdersEl)
            (_b = this.preparingOrdersEl).textContent = (_b = this.stats.preparingOrders) === null || _b === void 0 ? void 0 : _b.toString();
        if (this.readyOrdersEl)
            (_c = this.readyOrdersEl).textContent = (_c = this.stats.readyOrders) === null || _c === void 0 ? void 0 : _c.toString();
        if (this.todayCompletedEl)
            (_d = this.todayCompletedEl).textContent = (_d = this.stats.todayCompleted) === null || _d === void 0 ? void 0 : _d.toString();
        if (this.avgPrepTimeEl)
            (_e = this.avgPrepTimeEl).textContent = `${this.stats.avgPrepTime}m`;
    }
    renderOrders() {
        if (!this.ordersContainer)
            return;
        const filteredOrders = this.filterOrders();
        if (filteredOrders.length === 0) {
            this.ordersContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;">
                    <h3>No orders found</h3>
                    <p>${this.currentFilter === 'my' ? 'You have no assigned orders' : 'No orders match the current filter'}</p>
                </div>
            `;
            return;
        }
        this.ordersContainer.innerHTML = filteredOrders.map(order => this.createOrderCard(order)).join('');
    }
    filterOrders() {
        switch (this.currentFilter) {
            case 'pending':
                return this.orders.filter(o => o.status === 'pending');
            case 'preparing':
                return this.orders.filter(o => o.status === 'preparing');
            case 'ready':
                return this.orders.filter(o => o.status === 'ready');
            case 'my':
                return this.orders.filter(o => o.assignedChef === (this.currentChef === null || this.currentChef === void 0 ? void 0 : this.currentChef.id) &&
                    (o.status === 'preparing' || o.status === 'ready'));
            default:
                return this.orders;
        }
    }
    setFilter(filter) {
        this.currentFilter = filter;
        this.filterButtons.forEach(btn => {
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            }
            else {
                btn.classList.remove('active');
            }
        });
        this.renderOrders();
    }
    createOrderCard(order) {
        const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const statusClass = `status-${order.status}`;
        const priorityClass = order.priority ? `priority-${order.priority}` : '';
        const priorityText = order.priority ? order.priority.toUpperCase() : '';
        let timerDisplay = '';
        if (order.status === 'preparing' && order.startTime && order.estimatedPrepTime) {
            timerDisplay = this.createTimerDisplay(order);
        }
        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div>
                        <h3>Order #${order.id}</h3>
                        <div>Table ${order.tableNumber} | ${totalItems} items</div>
                    </div>
                    <div>
                        <span class="status-badge ${statusClass}">${order.status}</span>
                        ${order.priority ? `<span class="order-priority ${priorityClass}">${priorityText}</span>` : ''}
                    </div>
                </div>
                
                <div class="order-body">
                    ${order.customerName ? `<p><strong>Customer:</strong> ${order.customerName}</p>` : ''}
                    
                    <div class="order-items">
                        ${order.items.slice(0, 3).map(item => `
                            <div class="order-item">
                                <span class="item-name">${item.name}</span>
                                <span class="item-quantity">x${item.quantity}</span>
                                ${item.notes ? `<div class="item-note">Note: ${item.notes}</div>` : ''}
                            </div>
                        `).join('')}
                        
                        ${order.items.length > 3 ? `
                            <div class="order-item">
                                <span>... and ${order.items.length - 3} more items</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${order.specialInstructions ? `
                        <div class="special-instructions">
                            <strong>Special Instructions:</strong> ${order.specialInstructions}
                        </div>
                    ` : ''}
                    
                    ${timerDisplay}
                    
                    ${order.assignedChef ? `
                        <div class="chef-name">
                            👨‍🍳 Assigned to: ${order.chefName || 'Chef'}
                        </div>
                    ` : ''}
                    
                    <div class="order-actions">
                        ${order.status === 'pending' ? `
                            <button class="btn-kitchen btn-accept accept-order-btn" data-order-id="${order.id}">
                                Accept Order
                            </button>
                        ` : ''}
                        
                        ${order.status === 'preparing' && order.assignedChef === (this.currentChef === null || this.currentChef === void 0 ? void 0 : this.currentChef.id) ? `
                            <button class="btn-kitchen btn-complete complete-order-btn" data-order-id="${order.id}">
                                Mark Ready
                            </button>
                        ` : ''}
                        
                        ${order.status === 'ready' ? `
                            <button class="btn-kitchen btn-ready ready-order-btn" data-order-id="${order.id}">
                                ✅ Order Ready
                            </button>
                        ` : ''}
                        
                        <button class="btn-kitchen btn-secondary view-details-btn" data-order-id="${order.id}">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    createTimerDisplay(order) {
        if (!order.startTime || !order.estimatedPrepTime)
            return '';
        const startTime = new Date(order.startTime).getTime();
        const estimatedTime = order.estimatedPrepTime * 60 * 1000; // Convert to milliseconds
        const remainingTime = Math.max(0, estimatedTime - (Date.now() - startTime));
        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        let timerClass = '';
        if (remainingTime < 5 * 60 * 1000) { // Less than 5 minutes
            timerClass = 'timer-warning';
        }
        if (remainingTime < 2 * 60 * 1000) { // Less than 2 minutes
            timerClass = 'timer-danger';
        }
        return `
            <div class="order-timer">
                <span>⏰ Estimated completion:</span>
                <span class="timer-display ${timerClass}">
                    ${minutes}:${seconds.toString().padStart(2, '0')}
                </span>
            </div>
        `;
    }
    updateTimers() {
        // Clear existing timers
        this.timers.forEach(timer => clearInterval(timer));
        this.timers.clear();
        // Set up new timers for preparing orders
        this.orders
            .filter(order => order.status === 'preparing' && order.startTime)
            .forEach(order => {
                const timer = setInterval(() => {
                    this.updateOrderTimer(order.id);
                }, 1000);
                this.timers.set(order.id, timer);
            });
    }
    updateOrderTimer(orderId) {
        const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
        if (!orderCard)
            return;
        const order = this.orders.find(o => o.id === orderId);
        if (!order || !order.startTime || !order.estimatedPrepTime)
            return;
        const timerDisplay = orderCard.querySelector('.timer-display');
        if (!timerDisplay)
            return;
        const startTime = new Date(order.startTime).getTime();
        const estimatedTime = order.estimatedPrepTime * 60 * 1000;
        const remainingTime = Math.max(0, estimatedTime - (Date.now() - startTime));
        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        // Update timer class based on remaining time
        timerDisplay.className = 'timer-display';
        if (remainingTime < 5 * 60 * 1000) {
            timerDisplay.classList.add('timer-warning');
        }
        if (remainingTime < 2 * 60 * 1000) {
            timerDisplay.classList.add('timer-danger');
        }
    }
    showPrepTimeModal(orderId) {
        this.currentOrderId = orderId;
        const prepOrderIdEl = document.getElementById('prep-order-id');
        if (prepOrderIdEl) {
            prepOrderIdEl.textContent = orderId;
        }
        this.openModal('prep-time-modal');
    }
    confirmPrepTime() {
        return __awaiter(this, void 0, void 0, function* () {
            const minutesInput = document.getElementById('prep-minutes');
            const minutes = parseInt(minutesInput.value);
            if (!this.currentOrderId || isNaN(minutes) || minutes < 1) {
                this.showMessage('Please enter a valid preparation time', 'error');
                return;
            }
            try {
                const response = yield fetch(`${KITCHEN_API_BASE}/orders/${this.currentOrderId}/accept`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        chefId: this.currentChef === null || this.currentChef === void 0 ? void 0 : this.currentChef.id,
                        chefName: this.currentChef === null || this.currentChef === void 0 ? void 0 : this.currentChef.name,
                        estimatedPrepTime: minutes
                    })
                });
                if (response.ok) {
                    this.showMessage(`Order #${this.currentOrderId} accepted. Preparation started!`, 'success');
                    this.closeModal('prep-time-modal');
                    yield this.loadOrders();
                    // Notify waiters via WebSocket or polling
                    this.notifyStatusChange(this.currentOrderId, 'preparing');
                }
                else {
                    const error = yield response.json();
                    this.showMessage(error.error || 'Failed to accept order', 'error');
                }
            }
            catch (error) {
                console.error('Error accepting order:', error);
                this.showMessage('Error accepting order', 'error');
            }
        });
    }
    completeOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${KITCHEN_API_BASE}/orders/${orderId}/complete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        chefId: this.currentChef === null || this.currentChef === void 0 ? void 0 : this.currentChef.id
                    })
                });
                if (response.ok) {
                    this.showMessage(`Order #${orderId} marked as ready!`, 'success');
                    yield this.loadOrders();
                    // Notify waiters
                    this.notifyStatusChange(orderId, 'ready');
                }
                else {
                    const error = yield response.json();
                    this.showMessage(error.error || 'Failed to mark order as ready', 'error');
                }
            }
            catch (error) {
                console.error('Error completing order:', error);
                this.showMessage('Error completing order', 'error');
            }
        });
    }
    markOrderReady(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!confirm('Confirm that the order has been served to the customer?')) {
                return;
            }
            try {
                const response = yield fetch(`${KITCHEN_API_BASE}/orders/${orderId}/served`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    this.showMessage(`Order #${orderId} marked as served!`, 'success');
                    yield this.loadOrders();
                }
                else {
                    const error = yield response.json();
                    this.showMessage(error.error || 'Failed to update order status', 'error');
                }
            }
            catch (error) {
                console.error('Error marking order as served:', error);
                this.showMessage('Error updating order status', 'error');
            }
        });
    }
    showOrderDetails(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = this.orders.find(o => o.id === orderId);
            if (!order)
                return;
            const detailsContent = document.getElementById('order-details-content');
            const modalActions = document.getElementById('modal-actions');
            if (detailsContent) {
                detailsContent.innerHTML = this.createOrderDetails(order);
            }
            if (modalActions) {
                modalActions.innerHTML = this.createModalActions(order);
            }
            this.openModal('order-details-modal');
        });
    }
    createOrderDetails(order) {
        const total = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return `
            <div class="order-details">
                <div class="detail-row">
                    <strong>Order ID:</strong> ${order.id}
                </div>
                <div class="detail-row">
                    <strong>Table:</strong> ${order.tableNumber}
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span>
                </div>
                <div class="detail-row">
                    <strong>Created:</strong> ${new Date(order.createdAt).toLocaleString()}
                </div>
                ${order.estimatedPrepTime ? `
                    <div class="detail-row">
                        <strong>Estimated Prep Time:</strong> ${order.estimatedPrepTime} minutes
                    </div>
                ` : ''}
                ${order.startTime ? `
                    <div class="detail-row">
                        <strong>Started:</strong> ${new Date(order.startTime).toLocaleString()}
                    </div>
                ` : ''}
                ${order.assignedChef ? `
                    <div class="detail-row">
                        <strong>Assigned Chef:</strong> ${order.chefName || 'Unknown'}
                    </div>
                ` : ''}
                
                <h3 style="margin-top: 1rem;">Order Items:</h3>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <div>
                                <strong>${item.name}</strong>
                                <div>Quantity: ${item.quantity}</div>
                                <div>Price: ${item.price.toFixed(2)} EGP</div>
                                ${item.notes ? `<div><em>Note: ${item.notes}</em></div>` : ''}
                            </div>
                            <div>
                                ${(item.price * item.quantity).toFixed(2)} EGP
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="total-row" style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #667eea;">
                    <strong>Total:</strong> ${total.toFixed(2)} EGP
                </div>
                
                ${order.specialInstructions ? `
                    <div class="special-instructions" style="margin-top: 1rem;">
                        <strong>Special Instructions:</strong><br>
                        ${order.specialInstructions}
                    </div>
                ` : ''}
            </div>
        `;
    }
    createModalActions(order) {
        var _a;
        let actions = '';
        if (order.status === 'pending') {
            actions = `
                <button class="btn-kitchen btn-accept" onclick="kitchenDashboard.acceptOrder('${order.id}')">
                    Accept Order
                </button>
            `;
        }
        else if (order.status === 'preparing' && order.assignedChef === ((_a = this.currentChef) === null || _a === void 0 ? void 0 : _a.id)) {
            actions = `
                <button class="btn-kitchen btn-complete" onclick="kitchenDashboard.completeOrder('${order.id}')">
                    Mark Ready
                </button>
            `;
        }
        else if (order.status === 'ready') {
            actions = `
                <button class="btn-kitchen btn-ready" onclick="kitchenDashboard.markOrderReady('${order.id}')">
                    ✅ Order Served
                </button>
            `;
        }
        return actions;
    }
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
    notifyStatusChange(orderId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            // This would typically use WebSocket or Server-Sent Events
            // For now, we'll just log it
            console.log(`Order ${orderId} status changed to ${status}`);
            // In a real app, this would notify waiters via:
            // 1. WebSocket connection
            // 2. Server-Sent Events
            // 3. Polling from waiter dashboard
        });
    }
    showMessage(message, type) {
        if (!this.kitchenMessage)
            return;
        this.kitchenMessage.textContent = message;
        this.kitchenMessage.className = `kitchen-message ${type}`;
        setTimeout(() => {
            var _a;
            (_a = this.kitchenMessage).className = (_a = this.kitchenMessage) === null || _a === void 0 ? void 0 : _a.className.replace(` ${type}`, '');
        }, 5000);
    }
    setupPolling() {
        // Refresh orders every 10 seconds
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            yield this.loadOrders();
        }), 10000);
    }
}
// Global API base URL
const KITCHEN_API_BASE = 'http://localhost:3000/api/kitchen';
// Initialize dashboard
let kitchenDashboard;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        kitchenDashboard = new KitchenDashboard();
    });
}
else {
    kitchenDashboard = new KitchenDashboard();
}