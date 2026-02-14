import { Table, Column, Model, DataType, HasOne } from 'sequelize-typescript';
import { Staff } from './Staff.js';
import { Guest } from './Guest.js';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'password_hash',
  })
  declare passwordHash: string | null;

  @Column({
    type: DataType.ENUM('staff', 'guest', 'admin'),
    allowNull: false,
    field: 'user_type',
  })
  declare userType: 'staff' | 'guest' | 'admin';

  @Column({
    type: DataType.ENUM('active', 'inactive', 'suspended'),
    allowNull: false,
    defaultValue: 'active',
  })
  declare status: 'active' | 'inactive' | 'suspended';

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'last_login',
  })
  declare lastLogin: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'created_at',
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'updated_at',
  })
  declare updatedAt: Date;

  // Associations
  @HasOne(() => Staff, 'user_id')
  declare staff?: Staff;

  @HasOne(() => Guest, 'user_id')
  declare guest?: Guest;
}
