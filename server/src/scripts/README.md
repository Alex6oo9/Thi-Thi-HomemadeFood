# Order Debugging Scripts

This folder contains scripts to debug and fix the "orders not showing" issue.

## 📋 Available Scripts

### 1. Check Orders (`npm run check-orders`)

**Purpose**: Inspect the database for order integrity issues.

**What it does**:
- Counts total orders in database
- Identifies orders WITH userId
- Identifies orders WITHOUT userId
- Identifies orders with INVALID userId (user doesn't exist)
- Shows sample data for each category
- Lists all customers and their order counts

**When to use**:
- First step in debugging
- To verify if orders have userId field
- To see which users have orders

**Example output**:
```
📊 Total Orders: 15
✅ Orders WITH userId: 12
❌ Orders WITHOUT userId: 3
⚠️  Orders with INVALID userId: 0
```

### 2. Test Orders Endpoint (`npm run test-orders`)

**Purpose**: Simulate the complete order creation and retrieval flow.

**What it does**:
- Creates/finds a test customer (`test@customer.com`)
- Creates/finds a test product
- Simulates creating an order (like `POST /api/orders`)
- Verifies the order has userId set correctly
- Simulates `GET /api/orders/my` query
- Checks for type mismatches (string vs ObjectId)

**When to use**:
- To verify the order creation logic works
- To test if query filtering by userId works
- To check for type inconsistencies

**Example output**:
```
✅ SUCCESS! Order creation and retrieval flow works correctly.
```

### 3. Fix Orders (`npm run fix-orders`)

**Purpose**: Repair orders that are missing userId.

**What it does**:
- Finds all orders without userId
- Shows affected orders
- Provides options:
  1. Assign all broken orders to a specific customer
  2. Delete all broken orders
  3. Exit without changes
- Interactive prompts for safety
- Verifies the fix after completion

**When to use**:
- After confirming orders are missing userId (from `check-orders`)
- To repair database integrity
- CAUTION: Make database backup first!

**Safety features**:
- Shows preview before making changes
- Requires confirmation for destructive actions
- Verifies results after fixing

## 🚀 Usage Workflow

### Step 1: Diagnose the problem

```bash
npm run check-orders
```

This will show you:
- How many orders exist
- How many are missing userId
- Sample data from broken orders

### Step 2: Test the logic

```bash
npm run test-orders
```

This creates a test order and verifies the backend logic works correctly.

### Step 3: Fix broken orders (if needed)

```bash
npm run fix-orders
```

Follow the interactive prompts to assign broken orders to a customer.

### Step 4: Verify with debug logs

1. Start your server: `npm run dev`
2. Login as a customer
3. Navigate to `/orders` page
4. Check server console for debug logs:

```
═══ GET /api/orders/my DEBUG ═══
User from session: { id: 507f1f77bcf86cd799439011, email: 'user@example.com' }
Query filter: { userId: 507f1f77bcf86cd799439011 }
Query results: { foundOrders: 5, totalInDB: 5 }
═══ END DEBUG ═══
```

## 🔍 Debug Logging

Debug logs have been added to `GET /api/orders/my` endpoint in `src/routes/orders.ts`.

**The logs show**:
- Session user ID and type
- Query filter being used
- Number of orders found
- Sample userId from found orders

**To remove debug logs**: Once the issue is fixed, search for `// DEBUG LOGGING` comments in `src/routes/orders.ts` and remove those console.log blocks.

## 📊 Common Issues & Solutions

### Issue 1: Orders have no userId

**Symptoms**: `check-orders` shows "Orders WITHOUT userId: X"

**Cause**: Orders were created without setting userId from req.user._id

**Solution**:
1. Run `npm run fix-orders`
2. Assign orders to the correct customer
3. Ensure order creation code sets `userId: req.user._id`

### Issue 2: userId type mismatch

**Symptoms**: `test-orders` shows string vs ObjectId mismatch

**Cause**: Inconsistent data types in database

**Solution**: The scripts will identify this and the fix-orders script can reassign with correct type.

### Issue 3: User not authenticated

**Symptoms**: Debug logs show no user in session when accessing `/orders`

**Cause**: Session not persisting or user logged out

**Solution**: Check:
- Session middleware configuration
- Cookie settings (sameSite, secure)
- Frontend sending cookies with requests

### Issue 4: All orders show for wrong user

**Symptoms**: Admin sees customer orders or vice versa

**Cause**: Frontend might be calling wrong endpoint or user ID mixup

**Solution**: Check frontend code and verify which endpoint is being called.

## 🛠️ Technical Details

### Database Query

The `GET /api/orders/my` endpoint uses:
```javascript
const filter = { userId: req.user._id };
const orders = await Order.find(filter);
```

For this to work:
1. `req.user` must be populated (via session)
2. `req.user._id` must match `order.userId` in database
3. Both must be the same type (ObjectId)

### Session Flow

1. User logs in → Passport creates session
2. Session stored in MongoDB (connect-mongo)
3. SessionId cookie sent to client
4. Client sends cookie with subsequent requests
5. Server deserializes user from session
6. `req.user` is populated for authenticated routes

## 📝 Files Modified

- `src/routes/orders.ts` - Added debug logging to GET /my endpoint
- `package.json` - Added npm scripts
- `src/scripts/checkOrders.ts` - Database inspection
- `src/scripts/testOrdersEndpoint.ts` - Flow testing
- `src/scripts/fixMissingUserIds.ts` - Repair tool

## 🧹 Cleanup After Fixing

Once the issue is resolved:

1. **Remove debug logs** from `src/routes/orders.ts`:
   - Search for `// DEBUG LOGGING` comments
   - Remove the console.log blocks

2. **Keep the scripts** for future debugging:
   - The scripts are useful for ongoing maintenance
   - No need to delete them

3. **Document the root cause**:
   - Update this README with what you found
   - Add notes to DEBUG_ORDERS.md if helpful

## ❓ Need Help?

If you're still stuck after running these scripts:

1. Check the debug log output
2. Verify session configuration
3. Check frontend cookie handling
4. Ensure user is actually logged in when accessing /orders
5. Check if the frontend is calling the correct API endpoint

## 🎯 Quick Reference

```bash
# Diagnose
npm run check-orders

# Test logic
npm run test-orders

# Fix broken orders
npm run fix-orders

# Run server with debug logs
npm run dev
# Then navigate to /orders as customer and check console
```
