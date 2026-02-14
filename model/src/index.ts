import { Sequelize } from 'sequelize-typescript';
import { createSequelizeInstance, defaultConfig, DatabaseConfig } from './config/database.js';

// Export models
export { User } from './models/User.js';
export { Staff } from './models/Staff.js';
export { RoomType } from './models/RoomType.js';
export { Room } from './models/Room.js';
export { Task } from './models/Task.js';
export { Guest } from './models/Guest.js';
export { RatePlan } from './models/RatePlan.js';
export { RoomRate } from './models/RoomRate.js';
export { Reservation } from './models/Reservation.js';
export { RoomOccupancy } from './models/RoomOccupancy.js';

// Export configuration
export { DatabaseConfig, defaultConfig } from './config/database.js';

// Create and export Sequelize instance
let sequelize: Sequelize | null = null;

export function initializeDatabase(config?: DatabaseConfig): Sequelize {
  if (sequelize) {
    return sequelize;
  }

  sequelize = createSequelizeInstance(config || defaultConfig);
  return sequelize;
}

export function getDatabase(): Sequelize {
  if (!sequelize) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
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
