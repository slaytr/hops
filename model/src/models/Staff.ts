import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from './User.js';
import { Task } from './Task.js';
import { Reservation } from './Reservation.js';

@Table({
  tableName: 'staff',
  timestamps: true,
  underscored: true,
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
    field: 'user_id',
  })
  declare userId: number | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'first_name',
  })
  declare firstName: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'last_name',
  })
  declare lastName: string;

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
    field: 'employment_date',
  })
  declare employmentDate: Date | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: true,
    field: 'hourly_rate',
  })
  declare hourlyRate: number | null;

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
    type: DataType.JSON,
    allowNull: true,
    defaultValue: null,
  })
  declare permissions: string[] | null;

  // Timestamps handled automatically by Sequelize
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => User, 'user_id')
  declare user?: User;

  @HasMany(() => Task, 'staff_id')
  declare tasks?: Task[];

  @HasMany(() => Reservation, 'booked_by_staff_id')
  declare bookedReservations?: Reservation[];

  @HasMany(() => Reservation, 'cancelled_by_staff_id')
  declare cancelledReservations?: Reservation[];
}
