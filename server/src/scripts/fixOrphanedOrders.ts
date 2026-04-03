import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { config } from '../config/env';

/**
 * Fix orphaned orders by creating a dedicated customer for them
 */

const fixOrphanedOrders = async () => {
  try {
    console.log('🔧 Fixing Orphaned Orders...\n');

    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Find orders with invalid userId
    const allOrders = await Order.find({});
    const invalidOrders = [];

    for (const order of allOrders) {
      if (order.userId) {
        const userExists = await User.findById(order.userId);
        if (!userExists) {
          invalidOrders.push(order);
        }
      }
    }

    console.log(`Found ${invalidOrders.length} order(s) with invalid userId\n`);

    if (invalidOrders.length === 0) {
      console.log('🎉 No orphaned orders found! All orders are valid.');
      return;
    }

    // Create or find orphaned orders customer
    let orphanedCustomer = await User.findOne({ email: 'orphaned@orders.com' });

    if (!orphanedCustomer) {
      console.log('Creating new customer for orphaned orders...');
      orphanedCustomer = await User.create({
        email: 'orphaned@orders.com',
        password: 'OrphanedOrders123!@#',
        role: 'customer',
        isActive: true,
        authProvider: 'local',
        profile: {
          firstName: 'Orphaned',
          lastName: 'Orders'
        }
      });
      console.log(`✅ Created customer: ${orphanedCustomer.email}`);
      console.log(`   Customer ID: ${orphanedCustomer._id}`);
      console.log(`   Password: OrphanedOrders123!@#\n`);
    } else {
      console.log(`✅ Found existing customer: ${orphanedCustomer.email}`);
      console.log(`   Customer ID: ${orphanedCustomer._id}\n`);
    }

    // Show orders to be fixed
    console.log('═══════════════════════════════════════════════════');
    console.log('📦 ORDERS TO BE FIXED:');
    console.log('═══════════════════════════════════════════════════');
    invalidOrders.forEach((order, idx) => {
      console.log(`[${idx + 1}] Order ID: ${order._id}`);
      console.log(`    Current userId: ${order.userId} (INVALID)`);
      console.log(`    Status: ${order.status}`);
      console.log(`    Phone: ${order.contactInfo.phone}`);
      console.log(`    Total: ${order.totals.total} MMK`);
      console.log(`    Created: ${order.createdAt}\n`);
    });

    // Update orders
    console.log('🔄 Assigning orders to orphaned@orders.com...\n');

    let updated = 0;
    for (const order of invalidOrders) {
      const oldUserId = order.userId;
      order.userId = orphanedCustomer._id;
      await order.save();
      updated++;
      console.log(`✓ Updated order ${order._id}`);
      console.log(`  ${oldUserId} → ${orphanedCustomer._id}`);
    }

    console.log(`\n✅ Successfully updated ${updated} order(s)!\n`);

    // Verify the fix
    console.log('═══════════════════════════════════════════════════');
    console.log('🔍 VERIFICATION:');
    console.log('═══════════════════════════════════════════════════');

    const remainingInvalid = [];
    const allOrdersAfter = await Order.find({});

    for (const order of allOrdersAfter) {
      if (order.userId) {
        const userExists = await User.findById(order.userId);
        if (!userExists) {
          remainingInvalid.push(order);
        }
      }
    }

    const orphanedCustomerOrders = await Order.countDocuments({
      userId: orphanedCustomer._id
    });

    console.log(`Remaining invalid orders: ${remainingInvalid.length}`);
    console.log(`Orders assigned to ${orphanedCustomer.email}: ${orphanedCustomerOrders}`);

    if (remainingInvalid.length === 0) {
      console.log(`\n🎉 SUCCESS! All orders now have valid userIds!`);
      console.log(`\n📝 IMPORTANT:`);
      console.log(`   Customer Email: orphaned@orders.com`);
      console.log(`   Password: OrphanedOrders123!@#`);
      console.log(`   This customer now owns the ${updated} previously orphaned orders.`);
      console.log(`   You can login with these credentials to view/manage them.`);
    } else {
      console.log(`\n⚠️  Warning: ${remainingInvalid.length} order(s) still have invalid userId`);
    }
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

fixOrphanedOrders();
