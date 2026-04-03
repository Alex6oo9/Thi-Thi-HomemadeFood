/**
 * db:reset:orders — deletes all orders from the database.
 * Users and Products are left untouched.
 */

import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { config } from '../config/env';

const resetOrders = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    const orderCount = await Order.countDocuments();
    console.log(`Found ${orderCount} order(s).`);

    if (orderCount === 0) {
      console.log('Nothing to delete.');
      return;
    }

    const { deletedCount } = await Order.deleteMany({});
    console.log(`Deleted ${deletedCount} order(s).`);

    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

resetOrders();
