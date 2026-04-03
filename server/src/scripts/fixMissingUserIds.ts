import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { config } from '../config/env';
import readline from 'readline';

/**
 * Migration Script: Fix Orders Missing userId
 * Safely adds userId to orders that are missing it
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

const fixMissingUserIds = async () => {
  try {
    console.log('🔧 Starting Order Fix Script...\n');

    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Find orders without userId
    const ordersWithoutUserId = await Order.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });

    console.log(`Found ${ordersWithoutUserId.length} order(s) without userId\n`);

    if (ordersWithoutUserId.length === 0) {
      console.log('🎉 All orders already have userId! Nothing to fix.');
      rl.close();
      return;
    }

    // Show sample of broken orders
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 ORDERS MISSING userId:');
    console.log('═══════════════════════════════════════════════════');
    ordersWithoutUserId.slice(0, 5).forEach((order, idx) => {
      console.log(`\n[${idx + 1}] Order ID: ${order._id}`);
      console.log(`    Status: ${order.status}`);
      console.log(`    Phone: ${order.contactInfo.phone}`);
      console.log(`    Total: ${order.totals.total} MMK`);
      console.log(`    Created: ${order.createdAt}`);
    });
    if (ordersWithoutUserId.length > 5) {
      console.log(`\n... and ${ordersWithoutUserId.length - 5} more`);
    }
    console.log('\n');

    // Get all customers
    const customers = await User.find({ role: 'customer' });
    console.log('═══════════════════════════════════════════════════');
    console.log('👥 AVAILABLE CUSTOMERS:');
    console.log('═══════════════════════════════════════════════════');

    if (customers.length === 0) {
      console.log('❌ No customers found in database!');
      console.log('   You need to create a customer account first.');
      rl.close();
      return;
    }

    customers.forEach((customer, idx) => {
      console.log(`[${idx + 1}] ${customer.email}`);
      console.log(`    ID: ${customer._id}`);
      console.log(`    Created: ${customer.createdAt || 'N/A'}\n`);
    });

    // Ask user what to do
    console.log('═══════════════════════════════════════════════════');
    console.log('🤔 HOW TO FIX?');
    console.log('═══════════════════════════════════════════════════');
    console.log('Options:');
    console.log('1. Assign all broken orders to a specific customer');
    console.log('2. Delete all broken orders (CAUTION!)');
    console.log('3. Exit without making changes');
    console.log('');

    const choice = await question('Enter your choice (1/2/3): ');

    if (choice === '3') {
      console.log('Exiting without changes...');
      rl.close();
      return;
    }

    if (choice === '2') {
      console.log(`\n⚠️  WARNING: This will DELETE ${ordersWithoutUserId.length} orders permanently!`);
      const confirm = await question('Type "DELETE" to confirm: ');

      if (confirm === 'DELETE') {
        const result = await Order.deleteMany({
          $or: [
            { userId: { $exists: false } },
            { userId: null }
          ]
        });
        console.log(`✅ Deleted ${result.deletedCount} order(s)`);
      } else {
        console.log('Deletion cancelled.');
      }
      rl.close();
      return;
    }

    if (choice === '1') {
      const customerEmail = await question('\nEnter customer email to assign orders to: ');
      const selectedCustomer = await User.findOne({
        email: customerEmail.trim(),
        role: 'customer'
      });

      if (!selectedCustomer) {
        console.log(`❌ Customer not found: ${customerEmail}`);
        rl.close();
        return;
      }

      console.log(`\nSelected customer: ${selectedCustomer.email}`);
      console.log(`Customer ID: ${selectedCustomer._id}`);
      console.log(`\nThis will assign ${ordersWithoutUserId.length} order(s) to this customer.`);

      const confirm = await question('Proceed? (yes/no): ');

      if (confirm.toLowerCase() === 'yes') {
        console.log('\n🔄 Updating orders...\n');

        let updated = 0;
        for (const order of ordersWithoutUserId) {
          order.userId = selectedCustomer._id;
          await order.save();
          updated++;
          console.log(`✓ Updated order ${order._id}`);
        }

        console.log(`\n✅ Successfully updated ${updated} order(s)!`);
        console.log(`\nVerifying...`);

        // Verify the fix
        const remainingBroken = await Order.countDocuments({
          $or: [
            { userId: { $exists: false } },
            { userId: null }
          ]
        });

        const customerOrderCount = await Order.countDocuments({
          userId: selectedCustomer._id
        });

        console.log(`\n📊 VERIFICATION:`);
        console.log(`   Remaining broken orders: ${remainingBroken}`);
        console.log(`   Total orders for ${selectedCustomer.email}: ${customerOrderCount}`);

        if (remainingBroken === 0) {
          console.log(`\n🎉 All orders fixed successfully!`);
        } else {
          console.log(`\n⚠️  Still ${remainingBroken} broken order(s) remaining.`);
        }
      } else {
        console.log('Update cancelled.');
      }

      rl.close();
      return;
    }

    console.log('Invalid choice. Exiting...');
    rl.close();

  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

fixMissingUserIds();
