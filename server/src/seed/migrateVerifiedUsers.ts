/**
 * One-time migration: mark all existing users as email-verified.
 *
 * Run ONCE after deploying the isEmailVerified field to prevent
 * existing users (admin, customers) from being locked out.
 *
 * Usage: npm run migrate:email-verified
 */

import dotenv from 'dotenv';
import { connectMongoDB } from '../config/mongo';
import { User } from '../models/User';

dotenv.config();

const migrate = async () => {
  try {
    await connectMongoDB();
    console.log('Connected to database');

    const result = await User.updateMany(
      { isEmailVerified: { $ne: true } },
      { $set: { isEmailVerified: true } }
    );

    console.log(`\n✅ Migration complete`);
    console.log(`   Updated ${result.modifiedCount} user(s) → isEmailVerified = true`);
    console.log(`   Matched ${result.matchedCount} user(s) total\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
