import { Sequelize } from 'sequelize-typescript';
import { createSequelizeInstance, defaultConfig, DatabaseConfig } from './config/database.js';

// Export configuration
export { DatabaseConfig, defaultConfig } from './config/database.js';

// Create and export Sequelize instance
let sequelize: Sequelize | null = null;

export function getDatabase(): Sequelize {
  if (!sequelize) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return sequelize;
}

// Export models from Sequelize - they are loaded automatically by Sequelize
// from the models directory specified in createSequelizeInstance
export let User: any;
export let Staff: any;
export let Guest: any;
export let RoomType: any;
export let Room: any;
export let Task: any;
export let RatePlan: any;
export let RoomRate: any;
export let Reservation: any;
export let RoomOccupancy: any;

// Initialize model references after database initialization
function loadModels() {
  const db = getDatabase();
  User = db.models.User;
  Staff = db.models.Staff;
  Guest = db.models.Guest;
  RoomType = db.models.RoomType;
  Room = db.models.Room;
  Task = db.models.Task;
  RatePlan = db.models.RatePlan;
  RoomRate = db.models.RoomRate;
  Reservation = db.models.Reservation;
  RoomOccupancy = db.models.RoomOccupancy;
}

// Initialize database with model loading
export function initializeDatabase(config?: DatabaseConfig): Sequelize {
  if (sequelize) {
    return sequelize;
  }

  sequelize = createSequelizeInstance(config || defaultConfig);
  loadModels();
  return sequelize;
}

export async function closeDatabase(): Promise<void> {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
  }
}

export async function syncDatabase(options?: { force?: boolean; alter?: boolean }): Promise<void> {
  const db = getDatabase();
  await db.sync(options);
}

export async function testConnection(): Promise<boolean> {
  try {
    const db = getDatabase();
    await db.authenticate();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Default export
export default {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  syncDatabase,
  testConnection,
};
