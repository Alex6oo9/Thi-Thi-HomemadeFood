import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { config } from '../config/env';

/**
 * Endpoint Testing Script (Manual Database Verification)
 * Simulates the order creation and retrieval flow
 */

const testOrdersEndpoint = async () => {
  try {
    console.log('🧪 Starting Order Endpoint Test...\n');

    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find or create a test customer
    console.log('═══════════════════════════════════════════════════');
    console.log('STEP 1: Find/Create Test Customer');
    console.log('═══════════════════════════════════════════════════');

    let testCustomer = await User.findOne({ email: 'test@customer.com' });

    if (!testCustomer) {
      console.log('Creating new test customer...');
      testCustomer = await User.create({
        email: 'test@customer.com',
        password: 'Test123!@#',
        role: 'customer',
        isActive: true,
        authProvider: 'local'
      });
      console.log(`✅ Created test customer: ${testCustomer.email}`);
    } else {
      console.log(`✅ Found existing test customer: ${testCustomer.email}`);
    }
    console.log(`   User ID: ${testCustomer._id}`);
    console.log(`   Role: ${testCustomer.role}\n`);

    // Step 2: Find a product to order
    console.log('═══════════════════════════════════════════════════');
    console.log('STEP 2: Find Product');
    console.log('═══════════════════════════════════════════════════');

    let testProduct = await Product.findOne({ available: true });

    if (!testProduct) {
      console.log('Creating test product...');
      testProduct = await Product.create({
        name: 'Test Product',
        description: 'Test product for debugging',
        price: 10000,
        category: 'test',
        available: true,
        images: []
      });
      console.log(`✅ Created test product: ${testProduct.name}`);
    } else {
      console.log(`✅ Found existing product: ${testProduct.name}`);
    }
    console.log(`   Product ID: ${testProduct._id}`);
    console.log(`   Price: ${testProduct.price} MMK\n`);

    // Step 3: Simulate order creation (like POST /api/orders)
    console.log('═══════════════════════════════════════════════════');
    console.log('STEP 3: Simulate Order Creation');
    console.log('═══════════════════════════════════════════════════');

    const orderData = {
      userId: testCustomer._id,  // This is what should be set from req.user._id
      items: [{
        productId: testProduct._id,
        name: testProduct.name,
        price: testProduct.price,
        qty: 2
      }],
      notes: 'Test order from debugging script',
      contactInfo: {
        phone: '09123456789',
        address: 'Test Address, Yangon'
      },
      totals: {
        subtotal: testProduct.price * 2,
        total: testProduct.price * 2
      },
      status: 'RECEIVED',
      payment: {
        method: 'KBZPAY',
        verified: false
      }
    };

    const newOrder = await Order.create(orderData);
    console.log('✅ Order created successfully!');
    console.log(`   Order ID: ${newOrder._id}`);
    console.log(`   userId: ${newOrder.userId}`);
    console.log(`   userId type: ${typeof newOrder.userId}`);
    console.log(`   Items: ${newOrder.items.length}`);
    console.log(`   Total: ${newOrder.totals.total} MMK\n`);

    // Step 4: Verify order in database
    console.log('═══════════════════════════════════════════════════');
    console.log('STEP 4: Verify Order in Database');
    console.log('═══════════════════════════════════════════════════');

    const foundOrder = await Order.findById(newOrder._id);
    console.log(`✅ Found order: ${foundOrder?._id}`);
    console.log(`   userId field exists: ${foundOrder?.userId ? 'YES ✓' : 'NO ✗'}`);
    console.log(`   userId value: ${foundOrder?.userId}`);
    console.log(`   Matches customer ID: ${foundOrder?.userId.toString() === testCustomer._id.toString() ? 'YES ✓' : 'NO ✗'}\n`);

    // Step 5: Simulate GET /api/orders/my
    console.log('═══════════════════════════════════════════════════');
    console.log('STEP 5: Simulate GET /api/orders/my');
    console.log('═══════════════════════════════════════════════════');
    console.log('Simulating: const filter = { userId: req.user._id }');

    const filter = { userId: testCustomer._id };
    console.log(`Filter: { userId: ${filter.userId} }`);
    console.log(`Filter userId type: ${typeof filter.userId}\n`);

    const customerOrders = await Order.find(filter).sort({ createdAt: -1 });

    console.log(`✅ Query executed successfully!`);
    console.log(`   Found ${customerOrders.length} order(s) for customer\n`);

    if (customerOrders.length > 0) {
      console.log('   Order Details:');
      customerOrders.forEach((order, idx) => {
        console.log(`   [${idx + 1}] Order ID: ${order._id}`);
        console.log(`       userId: ${order.userId}`);
        console.log(`       Status: ${order.status}`);
        console.log(`       Total: ${order.totals.total} MMK`);
        console.log(`       Created: ${order.createdAt}\n`);
      });
    }

    // Step 6: Check for type mismatches
    console.log('═══════════════════════════════════════════════════');
    console.log('STEP 6: Type Checking');
    console.log('═══════════════════════════════════════════════════');

    // Check if there are any orders with string userId
    const allOrders = await Order.find({});
    console.log(`Total orders in database: ${allOrders.length}`);

    const stringUserIds = allOrders.filter(order =>
      order.userId && typeof order.userId === 'string'
    );
    console.log(`Orders with STRING userId: ${stringUserIds.length}`);

    const objectIdUserIds = allOrders.filter(order =>
      order.userId && typeof order.userId === 'object'
    );
    console.log(`Orders with OBJECTID userId: ${objectIdUserIds.length}\n`);

    // Final Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('📝 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Test Customer: ${testCustomer.email}`);
    console.log(`Customer ID: ${testCustomer._id}`);
    console.log(`Test Order Created: ${newOrder._id}`);
    console.log(`Order has userId: ${newOrder.userId ? 'YES ✓' : 'NO ✗'}`);
    console.log(`GET /my query found order: ${customerOrders.some(o => o._id.toString() === newOrder._id.toString()) ? 'YES ✓' : 'NO ✗'}`);

    if (customerOrders.some(o => o._id.toString() === newOrder._id.toString())) {
      console.log(`\n✅ SUCCESS! Order creation and retrieval flow works correctly.`);
      console.log(`   If customers still can't see orders, the issue is likely:`);
      console.log(`   1. Session not persisting (user not authenticated)`);
      console.log(`   2. Frontend not sending cookies`);
      console.log(`   3. Different user creating vs viewing orders`);
    } else {
      console.log(`\n❌ FAILED! Order was created but not found by userId query.`);
      console.log(`   This indicates a database or query issue.`);
    }
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

testOrdersEndpoint();
