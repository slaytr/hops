import { Sequelize } from 'sequelize-typescript';
import { User } from '../models/User.js';
import { Staff } from '../models/Staff.js';
import { RoomType } from '../models/RoomType.js';
import { Room } from '../models/Room.js';
import { Task } from '../models/Task.js';
import { Guest } from '../models/Guest.js';
import { RatePlan } from '../models/RatePlan.js';
import { RoomRate } from '../models/RoomRate.js';
import { Reservation } from '../models/Reservation.js';
import { RoomOccupancy } from '../models/RoomOccupancy.js';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  dialect: 'mysql';
  logging?: boolean | ((sql: string) => void);
}

export function createSequelizeInstance(config: DatabaseConfig): Sequelize {
  const sequelize = new Sequelize({
    ...config,
    models: [
      User,
      Staff,
      Guest,
      RoomType,
      Room,
      Task,
      RatePlan,
      RoomRate,
      Reservation,
      RoomOccupancy,
    ],
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  });

  return sequelize;
}

// Default configuration (can be overridden via environment variables)
export const defaultConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  database: process.env.MYSQL_DATABASE || 'hops_db',
  username: process.env.MYSQL_USER || 'hops_user',
  password: process.env.MYSQL_PASSWORD || 'hops_password',
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
};
