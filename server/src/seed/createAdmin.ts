import dotenv from 'dotenv';
import readline from 'readline';
import { connectMongoDB } from '../config/mongo';
import { User } from '../models/User';
import { UserRole } from '../types';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const createAdminUser = async () => {
  try {
    console.log('\n=== Create Admin Account ===\n');

    // Connect to database
    await connectMongoDB();
    console.log('Connected to database');

    // Collect user input
    const email = await question('Email: ');
    const password = await question('Password (min 12 chars): ');
    const firstName = await question('First Name (optional): ');
    const lastName = await question('Last Name (optional): ');

    const role: UserRole = 'admin';

    // Validation
    if (!email || !password) {
      console.error('\n❌ Error: Email and password are required');
      rl.close();
      process.exit(1);
    }

    if (password.length < 12) {
      console.error('\n❌ Error: Password must be at least 12 characters');
      rl.close();
      process.exit(1);
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.error(`\n❌ Error: User with email ${email} already exists`);
      console.log('Existing user details:');
      console.log(`  - Email: ${existingUser.email}`);
      console.log(`  - Role: ${existingUser.role}`);
      console.log(`  - Auth Provider: ${existingUser.authProvider}`);
      rl.close();
      process.exit(1);
    }

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role,
      authProvider: 'local',
      profile: {
        firstName: firstName || undefined,
        lastName: lastName || undefined
      }
    });

    console.log(`\n✅ ${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully!`);
    console.log('');
    console.log('Account Details:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    if (user.profile?.firstName || user.profile?.lastName) {
      console.log(`  Name: ${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim());
    }
    console.log('');
    console.log('Login URL:');
    console.log(`  ${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/login`);
    console.log('');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating user:', error);
    rl.close();
    process.exit(1);
  }
};

createAdminUser();
