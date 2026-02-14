import { initializeDatabase } from '@hops/models';

// Initialize database connection using model library
export const sequelize = initializeDatabase({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  database: process.env.MYSQL_DATABASE || 'hops',
  username: process.env.MYSQL_USER || 'hops_user',
  password: process.env.MYSQL_PASSWORD || 'hops_password',
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

// Re-export all models and utilities from the model library
export {
  User,
  Staff,
  RoomType,
  Room,
  Task,
  Guest,
  RatePlan,
  RoomRate,
  Reservation,
  RoomOccupancy,
  getDatabase,
  closeDatabase,
  syncDatabase,
  testConnection
} from '@hops/models';
