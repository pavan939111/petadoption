// Usage: node scripts/create-admin.js
// This script creates an admin user in the Admin collection

import mongoose from 'mongoose';
import Admin from '../src/models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'pawsunite';

const email = 'pavankumar@gmail.com';
const password = '1234567890';
const name = 'Pavan Kumar';

async function createAdmin() {
  try {
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not set in environment.');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    let admin = await Admin.findOne({ email });
    if (admin) {
      console.log('\n⚠️  Admin already exists in Admin collection!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  Email: ${admin.email}`);
      console.log(`  Name: ${admin.name}`);
      console.log(`  ID: ${admin._id}`);
      console.log(`  Active: ${admin.is_active}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n✅ Admin can login with these credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}\n`);
    } else {
      // Create new admin (password will be hashed by the pre-save hook)
      admin = new Admin({
        name,
        email,
        password, // Will be hashed by Admin model's pre-save hook
        is_active: true,
        is_verified: true,
      });
      await admin.save();
      
      console.log('\n✅ Admin created successfully in Admin collection!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Admin Account Details:');
      console.log(`  Email: ${admin.email}`);
      console.log(`  Password: ${password}`);
      console.log(`  Name: ${admin.name}`);
      console.log(`  ID: ${admin._id}`);
      console.log(`  Active: ${admin.is_active}`);
      console.log(`  Verified: ${admin.is_verified}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n⚠️  IMPORTANT: Keep the credentials secure!');
      console.log('   When you login with these credentials, you will be redirected to /admin dashboard.\n');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate email - admin with this email already exists');
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

createAdmin();
