import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Pet from '../src/models/Pet.js';

dotenv.config();

async function fixMicrochipIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'pawsunite',
    });
    console.log('✅ Connected to MongoDB');

    // Drop ALL existing microchip_id indexes if they exist
    try {
      const indexes = await Pet.collection.indexes();
      const microchipIndexes = indexes.filter(idx => 
        idx.key && idx.key.microchip_id !== undefined
      );
      
      for (const idx of microchipIndexes) {
        try {
          await Pet.collection.dropIndex(idx.name);
          console.log(`✅ Dropped index: ${idx.name}`);
        } catch (err) {
          console.log(`⚠️  Could not drop index ${idx.name}:`, err.message);
        }
      }
    } catch (error) {
      console.log('ℹ️  Error checking indexes:', error.message);
    }

    // Wait a moment for index drop to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create a new sparse unique index (only indexes non-null values)
    // sparse: true means the index only includes documents where the field exists and is not null
    await Pet.collection.createIndex(
      { microchip_id: 1 },
      { 
        sparse: true, 
        unique: true,
        name: 'microchip_id_1'
      }
    );
    console.log('✅ Created sparse unique index on microchip_id (only non-null values)');

    // Verify the index
    const indexes = await Pet.collection.indexes();
    const microchipIndex = indexes.find(idx => idx.name === 'microchip_id_1');
    console.log('📋 Index details:', JSON.stringify(microchipIndex, null, 2));

    console.log('✅ Microchip index fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing microchip index:', error);
    process.exit(1);
  }
}

fixMicrochipIndex();

