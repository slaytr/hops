import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Room } from './Room.js';
import { Staff } from './Staff.js';

@Table({
  tableName: 'tasks',
  timestamps: true,
  underscored: true,
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
    allowNull: true,
    field: 'room_id',
  })
  declare roomId: number | null;

  @ForeignKey(() => Staff)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'staff_id',
  })
  declare staffId: number | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'task_date',
  })
  declare taskDate: Date | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare duration: number;

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

  // Timestamps handled automatically by Sequelize
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => Room, 'room_id')
  declare room?: Room;

  @BelongsTo(() => Staff, 'staff_id')
  declare assignedStaff?: Staff;
}
