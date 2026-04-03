import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { config } from '../config/env';

/**
 * Check payment proof URLs in orders
 */

const checkPaymentProofs = async () => {
  try {
    console.log('🔍 Checking Payment Proof URLs...\n');

    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Find orders with payment proof
    const ordersWithProof = await Order.find({
      'payment.proofUrl': { $exists: true, $ne: null }
    }).where('payment.proofUrl').ne('');

    console.log(`Found ${ordersWithProof.length} order(s) with payment proof\n`);

    if (ordersWithProof.length === 0) {
      console.log('No orders with payment proof found.');
      return;
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('📸 PAYMENT PROOF URLs:');
    console.log('═══════════════════════════════════════════════════\n');

    ordersWithProof.forEach((order, idx) => {
      console.log(`[${idx + 1}] Order ID: ${order._id}`);
      console.log(`    proofUrl: ${order.payment.proofUrl}`);
      console.log(`    txLast6: ${order.payment.txLast6}`);
      console.log(`    verified: ${order.payment.verified}`);
      console.log(`    Status: ${order.status}`);

      // Check if URL looks like Cloudinary
      const isCloudinary = order.payment.proofUrl?.includes('cloudinary.com');
      const isLocal = order.payment.proofUrl?.includes('/uploads/');
      const hasUndefined = order.payment.proofUrl?.includes('undefined');

      console.log(`    Type: ${isCloudinary ? '☁️  Cloudinary' : isLocal ? '💾 Local' : '❓ Unknown'}`);
      if (hasUndefined) {
        console.log(`    ⚠️  WARNING: URL contains "undefined"!`);
      }
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

checkPaymentProofs();
