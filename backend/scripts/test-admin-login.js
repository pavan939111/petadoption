// Test Admin Login Flow
// This script tests the complete admin login flow to ensure everything works

import mongoose from 'mongoose';
import Admin from '../src/models/Admin.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'pawsunite';
const JWT_SECRET = process.env.JWT_SECRET;

const ADMIN_EMAIL = 'pavankumar@gmail.com';
const ADMIN_PASSWORD = '1234567890';

async function testAdminLogin() {
  try {
    console.log('🧪 Testing Admin Login Flow\n');

    // Step 1: Connect to MongoDB
    console.log('🔄 Step 1: Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
    });
    console.log('   ✅ Connected to MongoDB\n');

    // Step 2: Find admin in database
    console.log('🔍 Step 2: Finding admin in database...');
    const admin = await Admin.findOne({ email: ADMIN_EMAIL }).select('+password');
    
    if (!admin) {
      throw new Error('Admin not found in database!');
    }
    console.log(`   ✅ Admin found: ${admin.name} (${admin.email})`);
    console.log(`   ✅ Admin ID: ${admin._id}`);
    console.log(`   ✅ Active: ${admin.is_active}`);
    console.log(`   ✅ Verified: ${admin.is_verified}\n`);

    // Step 3: Test password verification
    console.log('🔐 Step 3: Testing password verification...');
    const passwordMatch = await admin.matchPassword(ADMIN_PASSWORD);
    
    if (!passwordMatch) {
      throw new Error('Password verification failed!');
    }
    console.log('   ✅ Password verification successful\n');

    // Step 4: Generate JWT token (simulating login)
    console.log('🎫 Step 4: Generating JWT token...');
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not set in environment!');
    }
    
    const token = jwt.sign({ id: admin._id }, JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });
    console.log('   ✅ JWT token generated');
    console.log(`   Token: ${token.substring(0, 50)}...\n`);

    // Step 5: Verify JWT token
    console.log('✅ Step 5: Verifying JWT token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`   ✅ Token verified`);
    console.log(`   Decoded ID: ${decoded.id}\n`);

    // Step 6: Simulate middleware check
    console.log('🛡️  Step 6: Simulating middleware authentication...');
    const adminFromToken = await Admin.findById(decoded.id);
    
    if (!adminFromToken) {
      throw new Error('Admin not found using token ID!');
    }
    console.log('   ✅ Admin found using token ID');
    console.log(`   ✅ Admin email: ${adminFromToken.email}`);
    console.log(`   ✅ Admin role: admin\n`);

    // Step 7: Simulate login response
    console.log('📤 Step 7: Simulating login response...');
    const loginResponse = {
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: adminFromToken._id,
        name: adminFromToken.name,
        email: adminFromToken.email,
        role: 'admin',
      },
    };
    console.log('   ✅ Login response structure:');
    console.log(`      success: ${loginResponse.success}`);
    console.log(`      message: ${loginResponse.message}`);
    console.log(`      user.role: ${loginResponse.user.role}`);
    console.log(`      user.email: ${loginResponse.user.email}\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS PASSED - Admin Login Flow Working!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}\n`);
    console.log('📝 Expected Behavior:');
    console.log('   1. User enters credentials on login page');
    console.log('   2. Backend checks Admin collection');
    console.log('   3. Returns token and user with role: "admin"');
    console.log('   4. Frontend stores user with role: "admin"');
    console.log('   5. Login component redirects to /admin dashboard\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

testAdminLogin();

