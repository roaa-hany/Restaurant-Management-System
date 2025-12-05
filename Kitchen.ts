
interface KitchenOrder {
    id: string;
    tableNumber: number;
    items: KitchenOrderItem[];
    status: 'pending' | 'preparing' | 'ready' | 'served' | 'paid';
    createdAt: string;
    updatedAt?: string;
    estimatedPrepTime?: number;
    startTime?: string;
    assignedChef?: string;
    chefName?: string;
    priority?: 'low' | 'medium' | 'high';
    specialInstructions?: string;
    customerName?: string;
    assignedWaiter?: string;
}

interface KitchenOrderItem {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
}

interface KitchenStats {
    pendingOrders: number;
    preparingOrders: number;
    readyOrders: number;
    todayCompleted: number;
    avgPrepTime: number;
}

const KITCHEN_API_BASE = 'http://localhost:3000/api';

// Define authentication helper functions inline
namespace AuthHelpers {
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
}

class KitchenDashboard {
    private orders: KitchenOrder[] = [];
    private stats: KitchenStats = {
        pendingOrders: 0,
        preparingOrders: 0,
        readyOrders: 0,
        todayCompleted: 0,
        avgPrepTime: 0
    };
    private currentChef: { id: string; name: string } | null = null;
    private currentFilter: string = 'all';
    private timers: Map<string, NodeJS.Timeout> = new Map();

    // DOM Elements
    private chefNameEl!: HTMLElement | null;
    private logoutBtn!: HTMLElement | null;
    private ordersContainer!: HTMLElement | null;
    private kitchenMessage!: HTMLElement | null;
    private filterButtons!: NodeListOf<HTMLElement>;

    // Stats elements
    private pendingOrdersEl!: HTMLElement | null;
    private preparingOrdersEl!: HTMLElement | null;
    private readyOrdersEl!: HTMLElement | null;
    private todayCompletedEl!: HTMLElement | null;
    private avgPrepTimeEl!: HTMLElement | null;

    // Modals
    private orderDetailsModal!: HTMLElement | null;
    private prepTimeModal!: HTMLElement | null;
    private currentOrderId: string | null = null;

    // WebSocket for real-time updates
    private ws: WebSocket | null = null;

    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.init();
    }

    private initializeElements(): void {
        this.chefNameEl = document.getElementById('chef-name');
        this.logoutBtn = document.getElementById('logout-btn');
        this.ordersContainer = document.getElementById('orders-container');
        this.kitchenMessage = document.getElementById('kitchen-message');
        this.filterButtons = document.querySelectorAll('.filter-btn') as NodeListOf<HTMLElement>;

        this.pendingOrdersEl = document.getElementById('pending-orders');
        this.preparingOrdersEl = document.getElementById('preparing-orders');
        this.readyOrdersEl = document.getElementById('ready-orders');
        this.todayCompletedEl = document.getElementById('today-completed');
        this.avgPrepTimeEl = document.getElementById('avg-prep-time');

        this.orderDetailsModal = document.getElementById('order-details-modal');
        this.prepTimeModal = document.getElementById('prep-time-modal');
    }

    private setupEventListeners(): void {
        // Logout
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = (e.target as HTMLElement).getAttribute('data-filter');
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
            const target = e.target as HTMLElement;

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

    private async init(): Promise<void> {
        await this.checkAuth();
        await this.loadOrders();
        this.setupWebSocket();
        this.setupPolling();
    }

    private async checkAuth(): Promise<void> {
        // Validate kitchen session using the auth helper
        if (!AuthHelpers.validateSession('kitchen')) {
            window.location.href = 'login.html';
            return;
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

    private handleLogout(): void {
        AuthHelpers.logout();
    }

    private async loadOrders(): Promise<void> {
        try {
            // Load only orders that are pending, preparing, or ready (not served or paid)
            const response = await fetch(`${KITCHEN_API_BASE}/orders?status=pending,preparing,ready`);
            if (response.ok) {
                const allOrders = await response.json();

                // Filter out served and paid orders for kitchen display
                this.orders = allOrders.filter((order: KitchenOrder) =>
                    order.status === 'pending' ||
                    order.status === 'preparing' ||
                    order.status === 'ready'
                );

                this.calculateStats();
                this.renderOrders();
                this.updateTimers();
            } else {
                this.showMessage('Error loading orders', 'error');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showMessage('Error loading orders', 'error');
        }
    }

    private calculateStats(): void {
        const today = new Date().toDateString();

        this.stats.pendingOrders = this.orders.filter(o => o.status === 'pending').length;
        this.stats.preparingOrders = this.orders.filter(o => o.status === 'preparing').length;
        this.stats.readyOrders = this.orders.filter(o => o.status === 'ready').length;

        // For today completed, we need to fetch served orders separately
        this.stats.todayCompleted = 0; // Will be updated by separate API call if needed

        // Calculate average prep time for completed orders today
        // In a real app, you'd fetch completed orders from the server
        const preparingOrders = this.orders.filter(o => o.status === 'preparing' && o.estimatedPrepTime);

        if (preparingOrders.length > 0) {
            const totalTime = preparingOrders.reduce((sum, order) =>
                sum + (order.estimatedPrepTime || 0), 0
            );
            this.stats.avgPrepTime = Math.round(totalTime / preparingOrders.length);
        } else {
            this.stats.avgPrepTime = 0;
        }

        this.updateStatsDisplay();
    }

    private updateStatsDisplay(): void {
        if (this.pendingOrdersEl) this.pendingOrdersEl.textContent = this.stats.pendingOrders.toString();
        if (this.preparingOrdersEl) this.preparingOrdersEl.textContent = this.stats.preparingOrders.toString();
        if (this.readyOrdersEl) this.readyOrdersEl.textContent = this.stats.readyOrders.toString();
        if (this.todayCompletedEl) this.todayCompletedEl.textContent = this.stats.todayCompleted.toString();
        if (this.avgPrepTimeEl) this.avgPrepTimeEl.textContent = `${this.stats.avgPrepTime}m`;
    }

    private renderOrders(): void {
        if (!this.ordersContainer) return;

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

    private filterOrders(): KitchenOrder[] {
        switch (this.currentFilter) {
            case 'pending':
                return this.orders.filter(o => o.status === 'pending');
            case 'preparing':
                return this.orders.filter(o => o.status === 'preparing');
            case 'ready':
                return this.orders.filter(o => o.status === 'ready');
            case 'my':
                return this.orders.filter(o =>
                    o.assignedChef === this.currentChef?.id &&
                    (o.status === 'preparing' || o.status === 'ready')
                );
            default:
                return this.orders;
        }
    }

    private setFilter(filter: string): void {
        this.currentFilter = filter;

        this.filterButtons.forEach(btn => {
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.renderOrders();
    }

    private createOrderCard(order: KitchenOrder): string {
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

    private createTimerDisplay(order: KitchenOrder): string {
        if (!order.startTime || !order.estimatedPrepTime) return '';

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

    private updateTimers(): void {
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

    private updateOrderTimer(orderId: string): void {
        const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
        if (!orderCard) return;

        const order = this.orders.find(o => o.id === orderId);
        if (!order || !order.startTime || !order.estimatedPrepTime) return;

        const timerDisplay = orderCard.querySelector('.timer-display');
        if (!timerDisplay) return;

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

    private showPrepTimeModal(orderId: string): void {
        this.currentOrderId = orderId;

        const prepOrderIdEl = document.getElementById('prep-order-id');
        if (prepOrderIdEl) {
            prepOrderIdEl.textContent = orderId;
        }

        this.openModal('prep-time-modal');
    }

    private async confirmPrepTime(): Promise<void> {
        const minutesInput = document.getElementById('prep-minutes') as HTMLInputElement;
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

                // Notify waiters via WebSocket
                this.notifyStatusChange(this.currentOrderId, 'preparing', minutes);
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Failed to accept order', 'error');
            }
        } catch (error) {
            console.error('Error accepting order:', error);
            this.showMessage('Error accepting order', 'error');
        }
    }

    private async startOrderCompletion(orderId: string): Promise<void> {
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

                // Notify waiters
                this.notifyStatusChange(orderId, 'ready');
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Failed to mark order as ready', 'error');
            }
        } catch (error) {
            console.error('Error completing order:', error);
            this.showMessage('Error completing order', 'error');
        }
    }

    private async startMarkOrderReady(orderId: string): Promise<void> {
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
            } else {
                const error = await response.json();
                this.showMessage(error.error || 'Failed to update order status', 'error');
            }
        } catch (error) {
            console.error('Error marking order as served:', error);
            this.showMessage('Error updating order status', 'error');
        }
    }

    private async showOrderDetails(orderId: string): Promise<void> {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

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

    private createOrderDetails(order: KitchenOrder): string {
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

    private createModalActions(order: KitchenOrder): string {
        let actions = '';

        if (order.status === 'pending') {
            actions = `
                <button class="btn-kitchen btn-accept" onclick="window.kitchenDashboard?.acceptOrder('${order.id}')">
                    Accept Order
                </button>
            `;
        } else if (order.status === 'preparing' && order.assignedChef === this.currentChef?.id) {
            actions = `
                <button class="btn-kitchen btn-complete" onclick="window.kitchenDashboard?.completeOrder('${order.id}')">
                    Mark Ready
                </button>
            `;
        } else if (order.status === 'ready') {
            actions = `
                <button class="btn-kitchen btn-ready" onclick="window.kitchenDashboard?.markAsServed('${order.id}')">
                    ✅ Order Collected
                </button>
            `;
        }

        return actions;
    }

    private openModal(modalId: string): void {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    private closeModal(modalId: string): void {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    private setupWebSocket(): void {
        try {
            this.ws = new WebSocket('ws://localhost:3000/kitchen-updates');

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.type === 'new_order') {
                    this.showMessage(`New order received: Order #${data.order.id} from Table ${data.order.tableNumber}`, 'success');
                    this.loadOrders();
                }

                if (data.type === 'order_updated') {
                    // Update the specific order
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
        } catch (error) {
            console.error('Failed to setup WebSocket:', error);
        }
    }

    private async notifyStatusChange(orderId: string, status: string, estimatedTime?: number): Promise<void> {
        // Send WebSocket notification
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

    private showMessage(message: string, type: 'success' | 'error'): void {
        if (!this.kitchenMessage) return;

        this.kitchenMessage.textContent = message;
        this.kitchenMessage.className = `kitchen-message ${type}`;

        setTimeout(() => {
            if (this.kitchenMessage) {
                this.kitchenMessage.className = 'kitchen-message';
            }
        }, 5000);
    }

    private setupPolling(): void {
        setInterval(async () => {
            await this.loadOrders();
        }, 10000);
    }

    // Public methods for onclick handlers
    public acceptOrder(orderId: string): void {
        this.showPrepTimeModal(orderId);
    }

    public completeOrder(orderId: string): void {
        this.startOrderCompletion(orderId);
    }

    public markAsServed(orderId: string): void {
        this.startMarkOrderReady(orderId);
    }
}

// Initialize dashboard
let kitchenDashboard: KitchenDashboard;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        kitchenDashboard = new KitchenDashboard();
        // Make it available globally for onclick handlers
        (window as any).kitchenDashboard = kitchenDashboard;
    });
} else {
    kitchenDashboard = new KitchenDashboard();
    (window as any).kitchenDashboard = kitchenDashboard;
}