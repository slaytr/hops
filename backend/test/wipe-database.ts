import "dotenv/config";
import { db, testConnection } from "../src/db.js";

async function wipeDatabase() {
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      console.log('❌ Failed to connect to database');
      process.exit(1);
    }

    console.log('✅ Connected to database');
    console.log('🗑️  Dropping all tables...');

    // Force sync with force: true drops and recreates tables
    await db.sync({ force: true });

    console.log('✅ All tables dropped and recreated!');
    console.log('📊 Database is now empty and ready for seeding');

    await db.close();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

wipeDatabase();
