/**
 * db:reset — drops ALL data: users, orders, products, and sessions.
 * This is a full wipe of the application database.
 */

import mongoose from 'mongoose';
import { User } from '../models/User';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { config } from '../config/env';

const resetAll = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    const [users, orders, products] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
    ]);

    console.log(`Found: ${users} user(s), ${orders} order(s), ${products} product(s).`);

    const db = mongoose.connection.db!;
    const sessions = await db.collection('sessions').countDocuments();

    const [u, o, p] = await Promise.all([
      User.deleteMany({}),
      Order.deleteMany({}),
      Product.deleteMany({}),
    ]);

    console.log(`Deleted ${u.deletedCount} user(s).`);
    console.log(`Deleted ${o.deletedCount} order(s).`);
    console.log(`Deleted ${p.deletedCount} product(s).`);

    if (sessions > 0) {
      await db.collection('sessions').deleteMany({});
      console.log(`Cleared ${sessions} session(s).`);
    }

    console.log('Database fully reset.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

resetAll();
