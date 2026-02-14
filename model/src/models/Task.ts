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
    field: 'room_id',
  })
  declare roomId: number;

  @ForeignKey(() => Staff)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'assigned_staff_id',
  })
  declare assignedStaffId: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    field: 'task_date',
  })
  declare taskDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'start_date_time',
  })
  declare startDateTime: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'end_date_time',
  })
  declare endDateTime: Date | null;

  @Column({
    type: DataType.ENUM('cleaning', 'maintenance', 'inspection', 'turndown'),
    allowNull: false,
    defaultValue: 'cleaning',
    field: 'task_type',
  })
  declare taskType: 'cleaning' | 'maintenance' | 'inspection' | 'turndown';

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
    field: 'started_at',
  })
  declare startedAt: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'completed_at',
  })
  declare completedAt: Date | null;

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
  @BelongsTo(() => Room, 'room_id')
  declare room?: Room;

  @BelongsTo(() => Staff, 'assigned_staff_id')
  declare assignedStaff?: Staff;
}
