import { initializeDatabase, testConnection } from '@hops/models';

// Initialize database connection using model library
const sequelize = initializeDatabase({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  database: process.env.MYSQL_DATABASE || 'hops',
  username: process.env.MYSQL_USER || 'hops_user',
  password: process.env.MYSQL_PASSWORD || 'hops_password',
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

// Export db with models (type assertion to bypass strict typing)
export const db = sequelize as any;

// Re-export testConnection utility
export { testConnection };
