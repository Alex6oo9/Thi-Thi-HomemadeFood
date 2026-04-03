/**
 * db:reset:users — deletes all users from the database.
 * Sessions stored in MongoDB are also cleared so no stale cookies linger.
 * Orders and Products are left untouched.
 */

import mongoose from 'mongoose';
import { User } from '../models/User';
import { config } from '../config/env';

const resetUsers = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} user(s).`);

    if (userCount === 0) {
      console.log('Nothing to delete.');
      return;
    }

    // Also wipe sessions so deleted accounts cannot re-authenticate
    const db = mongoose.connection.db!;
    const sessionCount = await db.collection('sessions').countDocuments();

    const { deletedCount } = await User.deleteMany({});
    console.log(`Deleted ${deletedCount} user(s).`);

    if (sessionCount > 0) {
      await db.collection('sessions').deleteMany({});
      console.log(`Cleared ${sessionCount} session(s).`);
    }

    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

resetUsers();
