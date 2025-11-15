# Egyptian Restaurant Management System - Sprint 1

A simple, functional Egyptian restaurant management system implementing core features for customers and waiters.

## 📋 Features Implemented

### 0. Staff Authentication System
- Login page for waiters and managers
- Role-based access control
- Session management using localStorage
- Protected dashboard pages for future features
- Simple authentication API endpoint

### 1. Viewing Ingredients and Allergens
- Customers can view detailed ingredient lists for each menu item
- Allergen information is clearly displayed with warning indicators
- Accessible via menu item details modal

### 2. Interactive Digital Menu
- Beautiful, responsive menu display with images
- Menu items are displayed in a card-based layout
- Click on any item to view full details including ingredients and allergens

### 3. Categorized Menu Display
- Menu items organized by categories: Appetizers, Main Dishes, Desserts, Beverages
- Category filter buttons for easy navigation
- "All" option to view the complete menu

### 4. Bill Generation and Payment Processing
- Waiter interface for generating bills from orders
- Automatic calculation of subtotal, tax (10%), and total
- Support for multiple payment methods: Cash, Card, Digital Payment
- Payment processing workflow

### 5. Table Reservation System
- Customer-facing reservation form
- Fields: Name, Email, Phone, Table Number, Date, Time, Number of Guests
- Reservation confirmation with unique ID

## 🏗️ Project Structure

```
restaurant-management-system/
├── src/
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── data/
│   │   └── sampleData.ts     # Sample menu data
│   └── server.ts             # Express backend server
├── public/
│   ├── index.html            # Customer-facing interface
│   ├── waiter.html           # Waiter interface
│   ├── css/
│   │   └── styles.css        # Application styles
│   └── js/
│       ├── app.ts            # Customer interface logic
│       └── waiter.ts         # Waiter interface logic
├── dist/                     # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json             # TypeScript config for server
├── tsconfig.public.json      # TypeScript config for client
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (comes with Node.js)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```
   This compiles both server-side and client-side TypeScript files.

3. **Start the server:**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Customer Interface: http://localhost:3000
   - Staff Login: http://localhost:3000/login.html
   - Waiter Interface: http://localhost:3000/waiter.html
   - Waiter Dashboard: http://localhost:3000/waiter-dashboard.html (requires login)
   - Manager Dashboard: http://localhost:3000/manager-dashboard.html (requires login)
   - API Endpoints: http://localhost:3000/api

## 📡 API Endpoints

### Menu Endpoints
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get a specific menu item
- `GET /api/menu/category/:category` - Get menu items by category

### Reservation Endpoints
- `GET /api/reservations` - Get all reservations
- `POST /api/reservations` - Create a new reservation
- `GET /api/reservations/:id` - Get a specific reservation

### Order Endpoints
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get a specific order

### Billing Endpoints
- `POST /api/bills/generate` - Generate a bill for an order
- `POST /api/bills/:id/pay` - Process payment for a bill

### Authentication Endpoints
- `POST /api/auth/login` - Authenticate staff members (waiter or manager)

## 🎨 User Interface

### Customer Interface (`index.html`)
- **Menu View**: Browse menu items by category with filtering
- **Reservation View**: Book a table with customer details
- **Item Details Modal**: View ingredients and allergens for any menu item

### Staff Login (`login.html`)
- **Role Selection**: Choose between Waiter or Manager
- **Authentication**: Simple username/password login
- **Session Management**: Uses localStorage for session persistence

### Waiter Dashboard (`waiter-dashboard.html`)
- **Protected Page**: Requires waiter login
- **Placeholder**: Ready for future waiter-specific features
- **Navigation**: Links to billing system

### Manager Dashboard (`manager-dashboard.html`)
- **Protected Page**: Requires manager login
- **Placeholder**: Ready for future manager-specific features

### Waiter Interface (`waiter.html`)
- **Billing View**: Generate bills and process payments
- **Orders View**: View all orders with details
- **Navigation**: Links to waiter dashboard

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: HTML5, CSS3, TypeScript
- **Data Storage**: In-memory (for Sprint 1 - can be upgraded to database in future sprints)

## 📝 Development Notes

### Data Storage
Currently, the system uses in-memory storage for reservations and orders. This means:
- Data is lost when the server restarts
- Suitable for development and testing
- Can be easily upgraded to a database (MongoDB, PostgreSQL, etc.) in future sprints

**For detailed information about data storage, see [DATA_STORAGE.md](./DATA_STORAGE.md)**

### Sample Data
The system comes with 9 authentic Egyptian menu items across 4 categories:
- Appetizers: Fattoush Salad, Hummus
- Main Dishes: Koshari, Grilled Kofta, Molokhia
- Desserts: Basbousa, Umm Ali
- Beverages: Karkadeh (Hibiscus Tea), Egyptian Coffee

All prices are in Egyptian Pounds (EGP).

### Type Safety
All code is written in TypeScript with strict type checking enabled, ensuring:
- Type safety across the application
- Better IDE support and autocomplete
- Easier refactoring and maintenance

## 🔐 Login Credentials

**Demo Accounts:**
- **Waiter**: 
  - Username: `waiter`
  - Password: `waiter123`
- **Manager**: 
  - Username: `manager`
  - Password: `manager123`

## 🔄 Future Enhancements (Future Sprints)

- Database integration (MongoDB/PostgreSQL)
- Enhanced authentication (JWT tokens, password hashing)
- Order placement from customer interface
- Real-time order status updates
- Menu search and filtering
- Dietary preference filters
- Reservation management dashboard
- Payment gateway integration
- Order history and analytics

## 📄 License

ISC

## 👥 Team

This project is part of a software engineering course project.

---

**Note**: This is Sprint 1 implementation focusing on core foundation features. The system is designed to be simple, functional, and easily extensible for future sprints.

