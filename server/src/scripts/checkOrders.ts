import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { config } from '../config/env';

/**
 * Database Inspection Script
 * Checks all orders for userId field integrity
 */

const checkOrders = async () => {
  try {
    console.log('🔍 Starting Order Database Inspection...\n');

    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all orders
    const allOrders = await Order.find({});
    const totalOrders = allOrders.length;

    console.log(`📊 Total Orders: ${totalOrders}\n`);

    if (totalOrders === 0) {
      console.log('⚠️  No orders found in database.');
      return;
    }

    // Check userId field presence and validity
    const ordersWithUserId = allOrders.filter(order => order.userId);
    const ordersWithoutUserId = allOrders.filter(order => !order.userId);

    console.log(`✅ Orders WITH userId: ${ordersWithUserId.length}`);
    console.log(`❌ Orders WITHOUT userId: ${ordersWithoutUserId.length}\n`);

    // Check if userIds are valid (exist in users collection)
    const invalidUserIdOrders = [];
    for (const order of ordersWithUserId) {
      const userExists = await User.findById(order.userId);
      if (!userExists) {
        invalidUserIdOrders.push(order);
      }
    }

    console.log(`⚠️  Orders with INVALID userId: ${invalidUserIdOrders.length}\n`);

    // Show samples
    if (ordersWithoutUserId.length > 0) {
      console.log('═══════════════════════════════════════════════════');
      console.log('❌ ORDERS WITHOUT userId (Sample):');
      console.log('═══════════════════════════════════════════════════');
      ordersWithoutUserId.slice(0, 3).forEach((order, idx) => {
        console.log(`\n[${idx + 1}] Order ID: ${order._id}`);
        console.log(`    Status: ${order.status}`);
        console.log(`    Items: ${order.items.length}`);
        console.log(`    Total: ${order.totals.total} MMK`);
        console.log(`    Phone: ${order.contactInfo.phone}`);
        console.log(`    Created: ${order.createdAt}`);
        console.log(`    userId field: ${order.userId === undefined ? 'MISSING' : order.userId}`);
      });
      console.log('\n');
    }

    if (invalidUserIdOrders.length > 0) {
      console.log('═══════════════════════════════════════════════════');
      console.log('⚠️  ORDERS WITH INVALID userId (Sample):');
      console.log('═══════════════════════════════════════════════════');
      invalidUserIdOrders.slice(0, 3).forEach((order, idx) => {
        console.log(`\n[${idx + 1}] Order ID: ${order._id}`);
        console.log(`    userId: ${order.userId} (DOES NOT EXIST)`);
        console.log(`    Status: ${order.status}`);
        console.log(`    Phone: ${order.contactInfo.phone}`);
        console.log(`    Created: ${order.createdAt}`);
      });
      console.log('\n');
    }

    if (ordersWithUserId.length > 0 && invalidUserIdOrders.length === 0) {
      console.log('═══════════════════════════════════════════════════');
      console.log('✅ VALID ORDERS (Sample):');
      console.log('═══════════════════════════════════════════════════');
      const validOrders = ordersWithUserId.slice(0, 3);

      for (const order of validOrders) {
        const user = await User.findById(order.userId);
        console.log(`\n[${validOrders.indexOf(order) + 1}] Order ID: ${order._id}`);
        console.log(`    userId: ${order.userId} ✓`);
        console.log(`    User Email: ${user?.email}`);
        console.log(`    User Role: ${user?.role}`);
        console.log(`    Status: ${order.status}`);
        console.log(`    Total: ${order.totals.total} MMK`);
        console.log(`    Created: ${order.createdAt}`);
      }
      console.log('\n');
    }

    // Show user summary
    console.log('═══════════════════════════════════════════════════');
    console.log('👥 USER SUMMARY:');
    console.log('═══════════════════════════════════════════════════');

    const customers = await User.find({ role: 'customer' });
    console.log(`Total Customers: ${customers.length}\n`);

    // For each customer, show their order count
    for (const customer of customers) {
      const orderCount = await Order.countDocuments({ userId: customer._id });
      console.log(`📧 ${customer.email}`);
      console.log(`   Role: ${customer.role}`);
      console.log(`   Orders: ${orderCount}`);
      console.log(`   ID: ${customer._id}\n`);
    }

    // Summary
    console.log('═══════════════════════════════════════════════════');
    console.log('📝 SUMMARY:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Total Orders: ${totalOrders}`);
    console.log(`✅ Valid Orders: ${ordersWithUserId.length - invalidUserIdOrders.length}`);
    console.log(`❌ Missing userId: ${ordersWithoutUserId.length}`);
    console.log(`⚠️  Invalid userId: ${invalidUserIdOrders.length}`);

    const problemOrders = ordersWithoutUserId.length + invalidUserIdOrders.length;
    if (problemOrders > 0) {
      console.log(`\n🔧 ${problemOrders} order(s) need fixing!`);
      console.log(`   Run 'npm run fix-orders' to repair them.`);
    } else {
      console.log(`\n🎉 All orders have valid userIds!`);
    }
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

checkOrders();
