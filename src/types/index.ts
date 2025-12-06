/**
 * Type definitions for the Restaurant Management System
 */

// sampleData.ts
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  ingredients: string[];
  allergens: string[];
  available: boolean;
}

export type MenuCategory = 'appetizer' | 'main' | 'dessert' | 'beverage';

export interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  tableNumber: number;
  reservationDate: string; // ISO date string
  reservationTime: string; // HH:mm format - start time
  endTime: string; // HH:mm format - end time
  numberOfGuests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'served' | 'paid';
  createdAt: string; // ISO date string
  assignedWaiter?: string;
  customerName?: string;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
  // Added these to match sample data and frontend display
  id?: string; 
  name?: string; 
}

export interface Bill {
  id: string;
  orderId: string;
  tableNumber: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  paymentStatus: 'pending' | 'paid';
  createdAt: string;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  // Added 'maintenance' to status union
  status: 'available' | 'occupied' | 'reserved' | 'need-assistance' | 'maintenance';
  assignedWaiter?: string;
  currentOrder?: string;
  location?: string; // Added this property
}

export interface Feedback {
  id: string;
  customerName: string;
  customerEmail: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string; // ISO date string
  status?: 'pending' | 'reviewed'; // Optional status for manager review
}