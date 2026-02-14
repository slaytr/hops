import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from './User.js';
import { Task } from './Task.js';
import { Reservation } from './Reservation.js';

@Table({
  tableName: 'staff',
  timestamps: true,
})
export class Staff extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    unique: true,
  })
  declare user_id: number | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare first_name: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare last_name: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare phone: string | null;

  @Column({
    type: DataType.ENUM('housekeeper', 'front_desk', 'manager', 'admin', 'maintenance'),
    allowNull: false,
  })
  declare role: 'housekeeper' | 'front_desk' | 'manager' | 'admin' | 'maintenance';

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare department: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare employment_date: Date | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
  })
  declare hourly_rate: number | null;

  @Column({
    type: DataType.ENUM('active', 'on_leave', 'terminated'),
    allowNull: false,
    defaultValue: 'active',
  })
  declare status: 'active' | 'on_leave' | 'terminated';

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'created_at',
  })
  declare created_at: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'updated_at',
  })
  declare updated_at: Date;

  // Associations
  @BelongsTo(() => User, 'user_id')
  declare user?: User;

  @HasMany(() => Task, 'assigned_staff_id')
  declare tasks?: Task[];

  @HasMany(() => Reservation, 'booked_by_staff_id')
  declare booked_reservations?: Reservation[];

  @HasMany(() => Reservation, 'cancelled_by_staff_id')
  declare cancelled_reservations?: Reservation[];
}
