import 'dotenv/config';
import { initializeDatabase, syncDatabase, closeDatabase } from './index.js';

async function sync() {
  try {
    console.log('Initializing database connection...');
    initializeDatabase();

    console.log('Syncing database models...');
    // alter: true will update existing tables to match models without dropping data
    await syncDatabase({ alter: false });

    console.log('✅ Database sync completed successfully!');
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    await closeDatabase();
    process.exit(1);
  }
}

sync();
