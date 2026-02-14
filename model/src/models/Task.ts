import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Room } from './Room.js';
import { Staff } from './Staff.js';

@Table({
  tableName: 'tasks',
  timestamps: true,
})
export class Task extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Room)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare room_id: number;

  @ForeignKey(() => Staff)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare assigned_staff_id: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare task_date: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare start_date_time: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare end_date_time: Date | null;

  @Column({
    type: DataType.ENUM('cleaning', 'maintenance', 'inspection', 'turndown'),
    allowNull: false,
    defaultValue: 'cleaning',
  })
  declare task_type: 'cleaning' | 'maintenance' | 'inspection' | 'turndown';

  @Column({
    type: DataType.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
  })
  declare priority: 'low' | 'medium' | 'high' | 'urgent';

  @Column({
    type: DataType.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  })
  declare status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare started_at: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare completed_at: Date | null;

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
  @BelongsTo(() => Room, 'room_id')
  declare room?: Room;

  @BelongsTo(() => Staff, 'assigned_staff_id')
  declare assigned_staff?: Staff;
}
