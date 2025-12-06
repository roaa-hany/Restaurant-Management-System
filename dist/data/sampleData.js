"use strict";
/**
 * Sample data for the Restaurant Management System
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleOrders = exports.sampleReservations = exports.sampleTables = exports.sampleMenuItems = void 0;
exports.sampleMenuItems = [
    {
        id: '1',
        name: 'Fattoush Salad',
        description: 'Fresh mixed greens with crispy pita chips, tomatoes, cucumbers, and tangy sumac dressing',
        price: 45.00,
        category: 'appetizer',
        imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=200&fit=crop',
        ingredients: ['mixed greens', 'pita bread', 'tomatoes', 'cucumbers', 'radish', 'sumac', 'olive oil', 'lemon', 'mint'],
        allergens: ['gluten'],
        available: true
    },
    {
        id: '3',
        name: 'Koshari',
        description: 'Traditional Egyptian dish with rice, lentils, pasta, chickpeas, and spicy tomato sauce',
        price: 65.00,
        category: 'main',
        imageUrl: 'https://everylittlecrumb.com/wp-content/uploads/koshary-3.jpg',
        ingredients: ['rice', 'lentils', 'pasta', 'chickpeas', 'tomatoes', 'onions', 'garlic', 'cumin', 'coriander'],
        allergens: ['gluten'],
        available: true
    },
    {
        id: '4',
        name: 'Grilled Kofta',
        description: 'Spiced minced meat grilled on skewers, served with tahini sauce and fresh vegetables',
        price: 120.00,
        category: 'main',
        imageUrl: 'https://www.recipetineats.com/tachyon/2014/11/Lamb-Koftas_7.jpg?resize=900%2C1125&zoom=1',
        ingredients: ['ground beef', 'onions', 'parsley', 'cumin', 'coriander', 'paprika', 'garlic', 'tahini'],
        allergens: [],
        available: true
    },
    {
        id: '5',
        name: 'Molokhia',
        description: 'Traditional Egyptian stew made with jute leaves, served with rice and chicken',
        price: 95.00,
        category: 'main',
        imageUrl: 'https://cdn-ildbfgp.nitrocdn.com/VufjoYCGjKoZYtYxAiuAHPeLwGCGbqQJ/assets/images/optimized/rev-8bb7bd6/amwhatieat.com/wp-content/uploads/2025/02/inshot_20250204_1310301483986591262287373473.webp',
        ingredients: ['molokhia leaves', 'chicken', 'garlic', 'coriander', 'onions', 'rice', 'chicken broth'],
        allergens: [],
        available: true
    },
    {
        id: '6',
        name: 'Basbousa',
        description: 'Sweet semolina cake soaked in syrup, topped with coconut and almonds',
        price: 40.00,
        category: 'dessert',
        imageUrl: 'https://amiraspantry.com/wp-content/uploads/2020/04/basbousa-1.jpg',
        ingredients: ['semolina', 'sugar', 'butter', 'yogurt', 'coconut', 'almonds', 'rose water', 'syrup'],
        allergens: ['gluten', 'dairy', 'nuts'],
        available: true
    },
    {
        id: '7',
        name: 'Umm Ali',
        description: 'Traditional Egyptian bread pudding with milk, nuts, and raisins',
        price: 45.00,
        category: 'dessert',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Umm_Ali.JPG/1920px-Umm_Ali.JPG',
        ingredients: ['puff pastry', 'milk', 'sugar', 'almonds', 'pistachios', 'raisins', 'coconut', 'cream'],
        allergens: ['gluten', 'dairy', 'nuts'],
        available: true
    },
    {
        id: '8',
        name: 'Karkadeh (Hibiscus Tea)',
        description: 'Refreshing hibiscus tea served hot or cold, sweetened to taste',
        price: 25.00,
        category: 'beverage',
        imageUrl: 'https://www.shirincook.com/wp-content/uploads/2025/06/Karkadeh-.webp',
        ingredients: ['hibiscus flowers', 'water', 'sugar', 'mint'],
        allergens: [],
        available: true
    },
    {
        id: '9',
        name: 'Egyptian Coffee',
        description: 'Strong traditional coffee with cardamom, served in small cups',
        price: 20.00,
        category: 'beverage',
        imageUrl: 'https://www.eatright.org/-/media/images/eatright-articles/eatright-article-feature-images/benefitsofcoffee_600x450.jpg?h=450&w=600&rev=6c8a9cd4a94d4cac8af8543054fd7b07&hash=F64F1F79DE48F33E3FB6A4FD5979C51F',
        ingredients: ['coffee beans', 'cardamom', 'water', 'sugar'],
        allergens: [],
        available: true
    }
];
exports.sampleTables = [
    { id: 'table_1', number: 1, capacity: 2, status: 'available' },
    { id: 'table_2', number: 2, capacity: 4, status: 'available' },
    { id: 'table_3', number: 3, capacity: 4, status: 'available' },
    { id: 'table_4', number: 4, capacity: 6, status: 'available' },
    { id: 'table_5', number: 5, capacity: 2, status: 'available' },
    { id: 'table_6', number: 6, capacity: 4, status: 'available' },
    { id: 'table_7', number: 7, capacity: 8, status: 'available' },
    { id: 'table_8', number: 8, capacity: 4, status: 'available' },
    { id: 'table_9', number: 9, capacity: 6, status: 'available' },
    { id: 'table_10', number: 10, capacity: 2, status: 'available' }
];
exports.sampleReservations = [];
exports.sampleOrders = [];
