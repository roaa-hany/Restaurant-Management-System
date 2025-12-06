"use strict";
const KITCHEN_API_BASE = 'http://localhost:3000/api';
// REPLACE localStorage with in-memory session
let currentKitchenSession = null;
// Define authentication helper functions using in-memory state
var AuthHelpers;
(function (AuthHelpers) {
    /**
     * Validate session for specific role
     */
    function validateSession(expectedRole) {
        if (!currentKitchenSession)
            return false;
        if (currentKitchenSession.role !== expectedRole)
            return false;
        return true;
    }
    AuthHelpers.validateSession = validateSession;
    /**
     * Get current user info
     */
    function getCurrentUser() {
        return currentKitchenSession;
    }
    AuthHelpers.getCurrentUser = getCurrentUser;
    /**
     * Set session (called after login)
     */
    function setSession(sessionData) {
        currentKitchenSession = sessionData;
    }
    AuthHelpers.setSession = setSession;
    /**
     * Logout user
     */
    function logout() {
        currentKitchenSession = null;
        window.location.href = 'login.html';
    }
    AuthHelpers.logout = logout;
})(AuthHelpers || (AuthHelpers = {}));
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
        // WebSocket for real-time updates
        this.ws = null;
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
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }
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
        const closeOrderDetailsBtn = document.getElementById('close-order-details');
        if (closeOrderDetailsBtn) {
            closeOrderDetailsBtn.addEventListener('click', () => {
                this.closeModal('order-details-modal');
            });
        }
        const closePrepTimeBtn = document.getElementById('close-prep-time');
        if (closePrepTimeBtn) {
            closePrepTimeBtn.addEventListener('click', () => {
                this.closeModal('prep-time-modal');
            });
        }
        const confirmPrepTimeBtn = document.getElementById('confirm-prep-time');
        if (confirmPrepTimeBtn) {
            confirmPrepTimeBtn.addEventListener('click', () => this.confirmPrepTime());
        }
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
                    this.startOrderCompletion(orderId);
                }
            }
            if (target.classList.contains('ready-order-btn')) {
                const orderId = target.getAttribute('data-order-id');
                if (orderId) {
                    this.startMarkOrderReady(orderId);
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
    async init() {
        await this.checkAuth();
        await this.loadOrders();
        this.setupWebSocket();
        this.setupPolling();
    }
    async checkAuth() {
        // For demo purposes, auto-login as kitchen staff
        if (!AuthHelpers.validateSession('kitchen')) {
            // Auto-set a kitchen session for demo
            AuthHelpers.setSession({
                id: 'chef_1',
                username: 'chef',
                name: 'Head Chef',
                role: 'kitchen'
            });
        }
        // Get current user info
        const user = AuthHelpers.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        // Set current chef
        this.currentChef = {
            id: user.id,
            name: user.name
        };
        // Update chef name display
        if (this.chefNameEl) {
            this.chefNameEl.textContent = user.name;
        }
    }
    handleLogout() {
        AuthHelpers.logout();
    }
    async loadOrders() {
        try {
            // Load only orders that are pending, preparing, or ready (not served or paid)
            const response = await fetch(`${KITCHEN_API_BASE}/orders?status=pending,preparing,ready`);
            if (response.ok) {
                const allOrders = await response.json();
                // Filter out served and paid orders for kitchen display
                this.orders = allOrders.filter((order) => order.status === 'pending' ||
                    order.status === 'preparing' ||
                    order.status === 'ready');
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
    }
    calculateStats() {
        const today = new Date().toDateString();
        this.stats.pendingOrders = this.orders.filter(o => o.status === 'pending').length;
        this.stats.preparingOrders = this.orders.filter(o => o.status === 'preparing').length;
        this.stats.readyOrders = this.orders.filter(o => o.status === 'ready').length;
        // For today completed, we need to fetch served orders separately
        this.stats.todayCompleted = 0; // Will be updated by separate API call if needed
        // Calculate average prep time for completed orders today
        const preparingOrders = this.orders.filter(o => o.status === 'preparing' && o.estimatedPrepTime);
        if (preparingOrders.length > 0) {
            const totalTime = preparingOrders.reduce((sum, order) => sum + (order.estimatedPrepTime || 0), 0);
            this.stats.avgPrepTime = Math.round(totalTime / preparingOrders.length);
        }
        else {
            this.stats.avgPrepTime = 0;
        }
        this.updateStatsDisplay();
    }
    updateStatsDisplay() {
        if (this.pendingOrdersEl)
            this.pendingOrdersEl.textContent = this.stats.pendingOrders.toString();
        if (this.preparingOrdersEl)
            this.preparingOrdersEl.textContent = this.stats.preparingOrders.toString();
        if (this.readyOrdersEl)
            this.readyOrdersEl.textContent = this.stats.readyOrders.toString();
        if (this.todayCompletedEl)
            this.todayCompletedEl.textContent = this.stats.todayCompleted.toString();
        if (this.avgPrepTimeEl)
            this.avgPrepTimeEl.textContent = `${this.stats.avgPrepTime}m`;
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
                return this.orders.filter(o => o.assignedChef === this.currentChef?.id &&
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
                        ${order.assignedWaiter ? `<div style="font-size: 0.9rem; color: #666;">Waiter: ${order.assignedWaiter}</div>` : ''}
                    </div>
                    <div>
                        <span class="status-badge ${statusClass}">${order.status}</span>
                        ${order.priority ? `<span class="order-priority ${priorityClass}">${priorityText}</span>` : ''}
                    </div>
                </div>
                
                <div class="order-body">
                    ${order.customerName ? `<p><strong>Customer:</strong> ${order.customerName}</p>` : ''}
                    
                    <div class="order-items">
                        ${order.items.slice(0, 5).map(item => `
                            <div class="order-item">
                                <span class="item-name">${item.name}</span>
                                <span class="item-quantity">x${item.quantity}</span>
                                ${item.notes ? `<div class="item-note">Note: ${item.notes}</div>` : ''}
                            </div>
                        `).join('')}
                        
                        ${order.items.length > 5 ? `
                            <div class="order-item">
                                <span>... and ${order.items.length - 5} more items</span>
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
                        
                        ${order.status === 'preparing' && order.assignedChef === this.currentChef?.id ? `
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
        const estimatedTime = order.estimatedPrepTime * 60 * 1000;
        const remainingTime = Math.max(0, estimatedTime - (Date.now() - startTime));
        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        let timerClass = '';
        if (remainingTime < 5 * 60 * 1000) {
            timerClass = 'timer-warning';
        }
        if (remainingTime < 2 * 60 * 1000) {
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
            const timer = window.setInterval(() => {
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
    async confirmPrepTime() {
        const minutesInput = document.getElementById('prep-minutes');
        const minutes = parseInt(minutesInput.value);
        if (!this.currentOrderId || isNaN(minutes) || minutes < 1) {
            this.showMessage('Please enter a valid preparation time', 'error');
            return;
        }
        try {
            const response = await fetch(`${KITCHEN_API_BASE}/orders/${this.currentOrderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'preparing',
                    assignedChef: this.currentChef?.id,
                    chefName: this.currentChef?.name,
                    estimatedPrepTime: minutes,
                    startTime: new Date().toISOString()
                })
            });
            if (response.ok) {
                this.showMessage(`Order #${this.currentOrderId} accepted. Preparation started!`, 'success');
                this.closeModal('prep-time-modal');
                await this.loadOrders();
                this.notifyStatusChange(this.currentOrderId, 'preparing', minutes);
            }
            else {
                const error = await response.json();
                this.showMessage(error.error || 'Failed to accept order', 'error');
            }
        }
        catch (error) {
            console.error('Error accepting order:', error);
            this.showMessage('Error accepting order', 'error');
        }
    }
    async startOrderCompletion(orderId) {
        try {
            const response = await fetch(`${KITCHEN_API_BASE}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'ready',
                    chefId: this.currentChef?.id
                })
            });
            if (response.ok) {
                this.showMessage(`Order #${orderId} marked as ready!`, 'success');
                await this.loadOrders();
                this.notifyStatusChange(orderId, 'ready');
            }
            else {
                const error = await response.json();
                this.showMessage(error.error || 'Failed to mark order as ready', 'error');
            }
        }
        catch (error) {
            console.error('Error completing order:', error);
            this.showMessage('Error completing order', 'error');
        }
    }
    async startMarkOrderReady(orderId) {
        if (!confirm('Confirm that the order has been collected by the waiter?')) {
            return;
        }
        try {
            const response = await fetch(`${KITCHEN_API_BASE}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'served'
                })
            });
            if (response.ok) {
                this.showMessage(`Order #${orderId} marked as served!`, 'success');
                await this.loadOrders();
            }
            else {
                const error = await response.json();
                this.showMessage(error.error || 'Failed to update order status', 'error');
            }
        }
        catch (error) {
            console.error('Error marking order as served:', error);
            this.showMessage('Error updating order status', 'error');
        }
    }
    async showOrderDetails(orderId) {
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
                        <strong>Started:</strong> ${new Date(order.startTime).toLocaleTimeString()}
                    </div>
                ` : ''}
                ${order.assignedChef ? `
                    <div class="detail-row">
                        <strong>Assigned Chef:</strong> ${order.chefName || 'Unknown'}
                    </div>
                ` : ''}
                ${order.assignedWaiter ? `
                    <div class="detail-row">
                        <strong>Waiter:</strong> ${order.assignedWaiter}
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
        let actions = '';
        if (order.status === 'pending') {
            actions = `
                <button class="btn-kitchen btn-accept" onclick="window.kitchenDashboard?.acceptOrder('${order.id}')">
                    Accept Order
                </button>
            `;
        }
        else if (order.status === 'preparing' && order.assignedChef === this.currentChef?.id) {
            actions = `
                <button class="btn-kitchen btn-complete" onclick="window.kitchenDashboard?.completeOrder('${order.id}')">
                    Mark Ready
                </button>
            `;
        }
        else if (order.status === 'ready') {
            actions = `
                <button class="btn-kitchen btn-ready" onclick="window.kitchenDashboard?.markAsServed('${order.id}')">
                    ✅ Order Collected
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
    setupWebSocket() {
        try {
            this.ws = new WebSocket('ws://localhost:3000/kitchen-updates');
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'new_order') {
                    this.showMessage(`New order received: Order #${data.order.id} from Table ${data.order.tableNumber}`, 'success');
                    this.loadOrders();
                }
                if (data.type === 'order_updated') {
                    const orderIndex = this.orders.findIndex(o => o.id === data.orderId);
                    if (orderIndex !== -1) {
                        this.orders[orderIndex] = { ...this.orders[orderIndex], ...data.updates };
                        this.renderOrders();
                        this.updateTimers();
                    }
                }
            };
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }
        catch (error) {
            console.error('Failed to setup WebSocket:', error);
        }
    }
    async notifyStatusChange(orderId, status, estimatedTime) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'order_status_changed',
                orderId: orderId,
                status: status,
                estimatedTime: estimatedTime,
                timestamp: new Date().toISOString()
            }));
        }
    }
    showMessage(message, type) {
        if (!this.kitchenMessage)
            return;
        this.kitchenMessage.textContent = message;
        this.kitchenMessage.className = `kitchen-message ${type}`;
        setTimeout(() => {
            if (this.kitchenMessage) {
                this.kitchenMessage.className = 'kitchen-message';
            }
        }, 5000);
    }
    setupPolling() {
        setInterval(async () => {
            await this.loadOrders();
        }, 10000);
    }
    // Public methods for onclick handlers
    acceptOrder(orderId) {
        this.showPrepTimeModal(orderId);
    }
    completeOrder(orderId) {
        this.startOrderCompletion(orderId);
    }
    markAsServed(orderId) {
        this.startMarkOrderReady(orderId);
    }
}
// Initialize dashboard
let kitchenDashboard;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        kitchenDashboard = new KitchenDashboard();
        // Make it available globally for onclick handlers
        window.kitchenDashboard = kitchenDashboard;
    });
}
else {
    kitchenDashboard = new KitchenDashboard();
    window.kitchenDashboard = kitchenDashboard;
}
