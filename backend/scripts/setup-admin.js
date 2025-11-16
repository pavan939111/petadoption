// Complete Admin Setup Script
// This script will:
// 1. Drop existing Admin collection (if exists)
// 2. Create fresh admin in MongoDB
// 3. Verify admin was created correctly

import mongoose from 'mongoose';
import Admin from '../src/models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'pawsunite';

const ADMIN_EMAIL = 'pavankumar@gmail.com';
const ADMIN_PASSWORD = '1234567890';
const ADMIN_NAME = 'Pavan Kumar';

async function setupAdmin() {
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
    console.log(`📦 Database: ${MONGODB_DB_NAME}\n`);

    // Step 1: Drop Admin collection to start fresh
    console.log('🗑️  Step 1: Dropping existing Admin collection...');
    try {
      await mongoose.connection.db.collection('admins').drop();
      console.log('   ✅ Admin collection dropped\n');
    } catch (error) {
      if (error.code === 26) {
        console.log('   ℹ️  Admin collection does not exist (this is okay)\n');
      } else {
        throw error;
      }
    }

    // Step 2: Create new admin
    console.log('👤 Step 2: Creating new admin...');
    const admin = new Admin({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD, // Will be hashed by pre-save hook
      is_active: true,
      is_verified: true,
    });

    await admin.save();
    console.log('   ✅ Admin created successfully\n');

    // Step 3: Verify admin was saved correctly
    console.log('🔍 Step 3: Verifying admin in database...');
    const savedAdmin = await Admin.findOne({ email: ADMIN_EMAIL }).select('+password');
    
    if (!savedAdmin) {
      throw new Error('Admin was not found in database after creation!');
    }

    // Verify password was hashed
    if (savedAdmin.password === ADMIN_PASSWORD) {
      throw new Error('Password was not hashed!');
    }

    // Test password matching
    const passwordMatch = await savedAdmin.matchPassword(ADMIN_PASSWORD);
    if (!passwordMatch) {
      throw new Error('Password verification failed!');
    }

    console.log('   ✅ Admin verification successful\n');

    // Step 4: Display admin details
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ADMIN ACCOUNT CREATED SUCCESSFULLY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  📧 Email:    ${savedAdmin.email}`);
    console.log(`  🔑 Password: ${ADMIN_PASSWORD}`);
    console.log(`  👤 Name:     ${savedAdmin.name}`);
    console.log(`  🆔 ID:        ${savedAdmin._id}`);
    console.log(`  ✅ Active:    ${savedAdmin.is_active}`);
    console.log(`  ✅ Verified:  ${savedAdmin.is_verified}`);
    console.log(`  📅 Created:   ${savedAdmin.createdAt}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 5: Count total admins
    const adminCount = await Admin.countDocuments();
    console.log(`📊 Total admins in database: ${adminCount}\n`);

    // Step 6: Test login simulation
    console.log('🧪 Step 4: Testing login simulation...');
    const testAdmin = await Admin.findOne({ email: ADMIN_EMAIL }).select('+password');
    const testPasswordMatch = await testAdmin.matchPassword(ADMIN_PASSWORD);
    
    if (testPasswordMatch) {
      console.log('   ✅ Login simulation successful');
      console.log('   ✅ Password verification works correctly\n');
    } else {
      throw new Error('Login simulation failed!');
    }

    console.log('🎉 Admin setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start your backend server: npm run dev');
    console.log('   2. Start your frontend: npm run dev');
    console.log('   3. Login with the credentials above');
    console.log('   4. You will be redirected to /admin dashboard\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error setting up admin:', error.message);
    console.error('   Stack:', error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

setupAdmin();

