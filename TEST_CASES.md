# Test Cases Sheet - Restaurant Management System

## Test Case Documentation

This document contains comprehensive test cases for the Restaurant Management System covering all major functionalities.

---

## Test Case 1: User Authentication - Waiter Login

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-001 |
| **Test Case Name** | Waiter Login with Valid Credentials |
| **Module** | Authentication |
| **Priority** | High |
| **Preconditions** | Server is running, database is initialized |
| **Test Steps** | 1. Navigate to login page<br>2. Select role "Waiter"<br>3. Enter username: "waiter"<br>4. Enter password: "waiter123"<br>5. Click "Login" button |
| **Expected Result** | User is redirected to waiter dashboard, session is stored in localStorage |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Username: waiter, Password: waiter123 |
| **Test Environment** | Development/Production |

---

## Test Case 2: User Authentication - Manager Login

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-002 |
| **Test Case Name** | Manager Login with Valid Credentials |
| **Module** | Authentication |
| **Priority** | High |
| **Preconditions** | Server is running, database is initialized |
| **Test Steps** | 1. Navigate to login page<br>2. Select role "Manager"<br>3. Enter username: "manager"<br>4. Enter password: "manager123"<br>5. Click "Login" button |
| **Expected Result** | User is redirected to manager dashboard, session is stored in localStorage |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Username: manager, Password: manager123 |
| **Test Environment** | Development/Production |

---

## Test Case 3: User Authentication - Invalid Credentials

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-003 |
| **Test Case Name** | Login with Invalid Credentials |
| **Module** | Authentication |
| **Priority** | High |
| **Preconditions** | Server is running |
| **Test Steps** | 1. Navigate to login page<br>2. Select role "Waiter"<br>3. Enter username: "invalid"<br>4. Enter password: "wrongpass"<br>5. Click "Login" button |
| **Expected Result** | Error message displayed: "Invalid credentials", user remains on login page |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Username: invalid, Password: wrongpass |
| **Test Environment** | Development/Production |

---

## Test Case 4: Menu Management - Add New Menu Item

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-004 |
| **Test Case Name** | Manager Adds New Menu Item |
| **Module** | Menu Management |
| **Priority** | High |
| **Preconditions** | Manager is logged in, on manager dashboard |
| **Test Steps** | 1. Navigate to "Menu Management" tab<br>2. Click "Add New Item" button<br>3. Fill in form: Name, Description, Price, Category, Ingredients, Allergens<br>4. Click "Save" button |
| **Expected Result** | New menu item is added to database, appears in menu list, persists after server restart |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Name: "Falafel", Price: 25.00, Category: "Appetizers" |
| **Test Environment** | Development/Production |

---

## Test Case 5: Menu Management - Update Menu Item

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-005 |
| **Test Case Name** | Manager Updates Existing Menu Item |
| **Module** | Menu Management |
| **Priority** | High |
| **Preconditions** | Manager is logged in, menu item exists |
| **Test Steps** | 1. Navigate to "Menu Management" tab<br>2. Click "Edit" on an existing menu item<br>3. Update price from 30.00 to 35.00<br>4. Click "Save" button |
| **Expected Result** | Menu item is updated in database, changes are reflected immediately, persist after restart |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Item ID: item_123, New Price: 35.00 |
| **Test Environment** | Development/Production |

---

## Test Case 6: Menu Management - Delete Menu Item

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-006 |
| **Test Case Name** | Manager Deletes Menu Item |
| **Module** | Menu Management |
| **Priority** | Medium |
| **Preconditions** | Manager is logged in, menu item exists |
| **Test Steps** | 1. Navigate to "Menu Management" tab<br>2. Click "Delete" on a menu item<br>3. Confirm deletion in dialog |
| **Expected Result** | Menu item is removed from database, no longer appears in menu, deletion persists after restart |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Item ID: item_123 |
| **Test Environment** | Development/Production |

---

## Test Case 7: Order Creation - Waiter Creates Order

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-007 |
| **Test Case Name** | Waiter Creates New Order for Table |
| **Module** | Order Management |
| **Priority** | High |
| **Preconditions** | Waiter is logged in, table is available, menu items exist |
| **Test Steps** | 1. Navigate to waiter dashboard<br>2. Select an available table<br>3. Click "Create Order"<br>4. Add menu items to order<br>5. Enter customer name<br>6. Click "Submit Order" |
| **Expected Result** | Order is created in database, table status changes to "occupied", order appears in kitchen dashboard |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Table: 1, Items: [Koshari, Hummus], Customer: "Ahmed Ali" |
| **Test Environment** | Development/Production |

---

## Test Case 8: Kitchen Dashboard - Chef Accepts Order

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-008 |
| **Test Case Name** | Chef Accepts Pending Order |
| **Module** | Kitchen Management |
| **Priority** | High |
| **Preconditions** | Chef is logged in, pending order exists |
| **Test Steps** | 1. Navigate to kitchen dashboard<br>2. View pending orders<br>3. Click "Accept Order" on a pending order<br>4. Enter preparation time (e.g., 20 minutes)<br>5. Click "Confirm" |
| **Expected Result** | Order status changes to "preparing", assigned chef is set, timer starts, order persists in database |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Order ID: order_123, Prep Time: 20 minutes |
| **Test Environment** | Development/Production |

---

## Test Case 9: Kitchen Dashboard - Chef Updates Order Status

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-009 |
| **Test Case Name** | Chef Updates Order Status from Preparing to Ready |
| **Module** | Kitchen Management |
| **Priority** | High |
| **Preconditions** | Chef is logged in, order is in "preparing" status |
| **Test Steps** | 1. Navigate to kitchen dashboard<br>2. Find order with status "preparing"<br>3. Select "Ready" from status dropdown<br>4. Click "Update Status" button |
| **Expected Result** | Order status changes to "ready" in database, UI updates immediately, status persists after restart |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Order ID: order_123, New Status: "ready" |
| **Test Environment** | Development/Production |

---

## Test Case 10: Payment Processing - Process Payment and Free Table

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-010 |
| **Test Case Name** | Waiter Processes Payment and Table Becomes Free |
| **Module** | Billing & Payment |
| **Priority** | High |
| **Preconditions** | Waiter is logged in, order exists with status "ready" or "served", table is occupied |
| **Test Steps** | 1. Navigate to waiter dashboard<br>2. Click "View Bills"<br>3. Select an order<br>4. Click "Process Payment"<br>5. Select payment method (Cash/Card/Digital)<br>6. Click "Confirm Payment"<br>7. Verify receipt is generated |
| **Expected Result** | Payment is processed, bill is generated, table status changes to "available", order is removed from billing list, receipt prints |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Order ID: order_123, Payment Method: "Cash" |
| **Test Environment** | Development/Production |

---

## Test Case 11: Feedback Submission - Customer Submits Feedback

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-011 |
| **Test Case Name** | Customer Submits Feedback Form |
| **Module** | Feedback System |
| **Priority** | Medium |
| **Preconditions** | Customer is on index.html page |
| **Test Steps** | 1. Navigate to customer menu page<br>2. Click "Feedback" navigation button<br>3. Fill in feedback form: Name, Email, Rating (1-5), Comment<br>4. Click "Submit Feedback" |
| **Expected Result** | Feedback is saved to database, success message is displayed, feedback persists after server restart |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Name: "Sara Mohamed", Email: "sara@example.com", Rating: 5, Comment: "Excellent service!" |
| **Test Environment** | Development/Production |

---

## Test Case 12: Manager Views Feedback

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-012 |
| **Test Case Name** | Manager Views Submitted Feedback |
| **Module** | Feedback Management |
| **Priority** | Medium |
| **Preconditions** | Manager is logged in, feedback exists in database |
| **Test Steps** | 1. Navigate to manager dashboard<br>2. Click "Customer Feedback" tab<br>3. View list of feedback entries<br>4. Filter by rating (optional) |
| **Expected Result** | All feedback entries are displayed with customer name, email, rating, comment, and submission date |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Filter: All ratings / Rating: 5 stars |
| **Test Environment** | Development/Production |

---

## Test Case 13: Table Reservation - Customer Books Table

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-013 |
| **Test Case Name** | Customer Creates Table Reservation |
| **Module** | Reservation System |
| **Priority** | High |
| **Preconditions** | Customer is on index.html, tables exist in database |
| **Test Steps** | 1. Navigate to customer menu page<br>2. Click "Reservations" tab<br>3. Fill in reservation form: Name, Email, Phone, Table Number, Date, Time, Number of Guests<br>4. Click "Book Table" |
| **Expected Result** | Reservation is created in database, confirmation message with reservation ID is displayed, reservation persists after restart |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Name: "Omar Hassan", Email: "omar@example.com", Table: 3, Date: "2025-12-15", Time: "19:00", Guests: 4 |
| **Test Environment** | Development/Production |

---

## Test Case 14: Data Persistence - Server Restart

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-014 |
| **Test Case Name** | Data Persists After Server Restart |
| **Module** | Database Persistence |
| **Priority** | Critical |
| **Preconditions** | Server is running, data exists (orders, reservations, menu items, feedback) |
| **Test Steps** | 1. Create test data: orders, reservations, menu items, feedback<br>2. Stop the server (Ctrl+C)<br>3. Restart the server (npm start)<br>4. Verify all data is still present |
| **Expected Result** | All data (orders, reservations, menu items, feedback, tables) persists in MySQL database and is loaded on server restart |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Various test records created before restart |
| **Test Environment** | Development/Production |

---

## Test Case 15: Waiter Dashboard - View Tables

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-015 |
| **Test Case Name** | Waiter Views Table Status |
| **Module** | Table Management |
| **Priority** | High |
| **Preconditions** | Waiter is logged in |
| **Test Steps** | 1. Navigate to waiter dashboard<br>2. View "Tables" section<br>3. Check table statuses (available, occupied, reserved) |
| **Expected Result** | All tables are displayed with correct status, color coding is accurate, real-time updates work |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Tables: 1-10 with various statuses |
| **Test Environment** | Development/Production |

---

## Test Case 16: Menu Display - Customer Views Menu Items

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-016 |
| **Test Case Name** | Customer Views Menu with Categories |
| **Module** | Customer Interface |
| **Priority** | High |
| **Preconditions** | Server is running, menu items exist in database |
| **Test Steps** | 1. Navigate to index.html<br>2. View menu items<br>3. Click category filters (Appetizers, Main Dishes, etc.)<br>4. Click on a menu item to view details |
| **Expected Result** | Menu items are displayed correctly, category filtering works, item details modal shows ingredients and allergens |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Menu items across all categories |
| **Test Environment** | Development/Production |

---

## Test Case 17: Order Status Flow - Complete Order Lifecycle

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-017 |
| **Test Case Name** | Complete Order Lifecycle: Pending → Preparing → Ready → Served → Paid |
| **Module** | Order Management |
| **Priority** | Critical |
| **Preconditions** | Waiter and chef are logged in, table is available |
| **Test Steps** | 1. Waiter creates order (status: pending)<br>2. Chef accepts order (status: preparing)<br>3. Chef updates to "ready"<br>4. Chef updates to "served"<br>5. Waiter processes payment<br>6. Verify table becomes free |
| **Expected Result** | Order progresses through all statuses correctly, each status change persists in database, table is freed after payment |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Order with multiple items |
| **Test Environment** | Development/Production |

---

## Test Case 18: Error Handling - Invalid Table Number

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-018 |
| **Test Case Name** | Error Handling for Invalid Table Number in Order Creation |
| **Module** | Error Handling |
| **Priority** | Medium |
| **Preconditions** | Waiter is logged in |
| **Test Steps** | 1. Navigate to waiter dashboard<br>2. Attempt to create order for non-existent table (e.g., table 999)<br>3. Submit order |
| **Expected Result** | Error message displayed: "Table not found", order is not created |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | Table Number: 999 (non-existent) |
| **Test Environment** | Development/Production |

---

## Test Case 19: Database Foreign Key Constraint - Invalid Waiter ID

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-019 |
| **Test Case Name** | System Handles Invalid Waiter ID Gracefully |
| **Module** | Database Integrity |
| **Priority** | Medium |
| **Preconditions** | Waiter is logged in, order creation API is accessible |
| **Test Steps** | 1. Create order via API with invalid assignedWaiter ID<br>2. Submit order |
| **Expected Result** | System validates waiter ID, sets assignedWaiter to null if invalid, order is created successfully without foreign key error |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | assignedWaiter: "invalid_waiter_id" |
| **Test Environment** | Development/Production |

---

## Test Case 20: Real-time Updates - Kitchen Dashboard Polling

| **Field** | **Value** |
|-----------|-----------|
| **Test Case ID** | TC-020 |
| **Test Case Name** | Kitchen Dashboard Updates Orders Automatically |
| **Module** | Real-time Updates |
| **Priority** | Medium |
| **Preconditions** | Chef is logged in, kitchen dashboard is open |
| **Test Steps** | 1. Open kitchen dashboard<br>2. Wait 5 seconds<br>3. Create new order from waiter dashboard<br>4. Observe kitchen dashboard |
| **Expected Result** | New order appears in kitchen dashboard within 5 seconds without page refresh |
| **Actual Result** | _[To be filled during testing]_ |
| **Status** | Pass/Fail |
| **Test Data** | New order created from another session |
| **Test Environment** | Development/Production |

---

## Test Summary

| **Total Test Cases** | 20 |
| **High Priority** | 12 |
| **Medium Priority** | 7 |
| **Critical Priority** | 1 |
| **Passed** | _[To be filled]_ |
| **Failed** | _[To be filled]_ |
| **Blocked** | _[To be filled]_ |
| **Not Executed** | _[To be filled]_ |

---

## Notes

- All test cases should be executed in both Development and Production environments
- Test data should be cleaned up after each test run
- Database backups should be taken before destructive tests (TC-006, TC-014)
- Cross-browser testing recommended for frontend test cases
- Performance testing should be conducted for high-traffic scenarios

