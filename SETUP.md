# Quick Setup Guide

## Step-by-Step Setup

1. **Install Node.js** (if not already installed)
   - Download from https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Project**
   ```bash
   npm run build
   ```
   This compiles TypeScript files to JavaScript.

4. **Start the Server**
   ```bash
   npm start
   ```
   You should see: `Server running on http://localhost:3000`

5. **Open in Browser**
   - Customer Interface: http://localhost:3000
   - Waiter Interface: http://localhost:3000/waiter.html

## Testing the Features

### Testing Menu Features
1. Open the customer interface
2. Browse menu items by category
3. Click on any menu item to see details
4. Click "View Ingredients" or "View Allergens" to see specific information

### Testing Reservations
1. Navigate to the "Reservations" tab
2. Fill out the reservation form
3. Submit to create a reservation
4. Note the confirmation message with reservation ID

### Testing Billing (Waiter Interface)
1. Open the waiter interface
2. Note: You'll need to create an order first via API or manually add test data
3. To test billing, you can create a test order using the API:
   ```bash
   curl -X POST http://localhost:3000/api/orders \
     -H "Content-Type: application/json" \
     -d '{
       "tableNumber": 5,
       "items": [
         {"menuItemId": "1", "quantity": 2, "price": 12.99},
         {"menuItemId": "3", "quantity": 1, "price": 24.99}
       ]
     }'
   ```
4. Then use the order ID in the billing interface to generate a bill

## Development Mode

For development with auto-reload:
```bash
npm run dev
```

This uses `ts-node` to run TypeScript directly without compilation.

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, you can change it in `src/server.ts`:
```typescript
const PORT = 3000; // Change to another port
```

### TypeScript Compilation Errors
Make sure all dependencies are installed:
```bash
npm install
```

### CORS Issues
The server is configured with CORS enabled. If you encounter issues, check the CORS configuration in `src/server.ts`.

### Browser Console Errors
- Make sure the server is running
- Check that the API base URL matches your server port
- Verify that the JavaScript files were compiled (check `public/js/` directory)

## Project Structure Overview

- `src/` - Server-side TypeScript code
- `public/` - Client-side HTML, CSS, and JavaScript
- `dist/` - Compiled server-side JavaScript (generated)
- `public/js/` - Compiled client-side JavaScript (generated)

## Next Steps

After Sprint 1, consider:
- Adding a database for persistent storage
- Implementing user authentication
- Adding order placement from customer interface
- Enhancing UI/UX with animations and better styling
- Adding unit tests

