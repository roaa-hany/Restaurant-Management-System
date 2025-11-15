# Data Storage Information

## Where is Reservation Data Saved?

### Current Implementation (Sprint 1)
Reservations are currently stored **in server memory** (RAM). This means:

- ✅ **Data is saved** when you create a reservation
- ❌ **Data is lost** when the server restarts
- ✅ **Data persists** while the server is running
- ✅ **Data is accessible** via the API endpoints

### Technical Details

The reservation data is stored in the `reservations` array in `src/server.ts`:

```typescript
let reservations: Reservation[] = [...sampleReservations];
```

When a reservation is created via `POST /api/reservations`, it is added to this array and remains in memory until:
1. The server is stopped/restarted
2. The server process crashes
3. The server is shut down

### Viewing Saved Reservations

You can view all saved reservations by:
1. **API Endpoint**: `GET http://localhost:3000/api/reservations`
2. **Waiter Interface**: Currently not displayed, but can be added in future sprints

### Example: Check Reservations via API

```bash
curl http://localhost:3000/api/reservations
```

### Future Improvements (Future Sprints)

For production use, the system should be upgraded to use a database:

**Recommended Options:**
- **MongoDB**: Good for flexible schema and JSON-like data
- **PostgreSQL**: Relational database with strong data integrity
- **SQLite**: Simple file-based database for smaller deployments

**Benefits of Database Storage:**
- ✅ Data persists across server restarts
- ✅ Better data integrity and validation
- ✅ Ability to query and filter data efficiently
- ✅ Backup and recovery options
- ✅ Concurrent access handling

### Current Data Storage Summary

| Data Type | Storage Location | Persistence |
|-----------|-----------------|-------------|
| Menu Items | Hardcoded in `src/data/sampleData.ts` | ✅ Permanent (until code change) |
| Reservations | Server memory (`reservations` array) | ❌ Lost on restart |
| Orders | Server memory (`orders` array) | ❌ Lost on restart |
| Bills | Generated on-demand, not stored | ❌ Not persisted |

### Testing Data Persistence

To test that reservations are being saved:

1. **Start the server**: `npm start`
2. **Create a reservation** via the customer interface
3. **Check the API**: `curl http://localhost:3000/api/reservations`
4. **Restart the server**: Stop and start again
5. **Check again**: The reservation will be gone (proving it's in-memory only)

### Adding Persistence (Quick Solution)

If you need data to persist immediately, you could:

1. **Use a JSON file** to store data:
   ```typescript
   import fs from 'fs';
   // Save to file after each operation
   fs.writeFileSync('data.json', JSON.stringify(reservations));
   ```

2. **Use a simple database** like SQLite:
   ```bash
   npm install sqlite3
   ```

However, for Sprint 1, in-memory storage is acceptable as it keeps the implementation simple and focuses on core functionality.

