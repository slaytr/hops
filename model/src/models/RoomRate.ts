import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { RoomType } from './RoomType.js';
import { RatePlan } from './RatePlan.js';

@Table({
  tableName: 'room_rates',
  timestamps: true,
  underscored: true,
})
export class RoomRate extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => RoomType)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'room_type_id',
  })
  declare roomTypeId: number;

  @ForeignKey(() => RatePlan)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'rate_plan_id',
  })
  declare ratePlanId: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare rate: number;

  @Column({
    type: DataType.ENUM('all', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
    allowNull: false,
    defaultValue: 'all',
    field: 'day_of_week',
  })
  declare dayOfWeek: 'all' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'extra_person_rate',
  })
  declare extraPersonRate: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'extra_child_rate',
  })
  declare extraChildRate: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'effective_from',
  })
  declare effectiveFrom: Date | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'effective_to',
  })
  declare effectiveTo: Date | null;

  // Timestamps handled automatically by Sequelize
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => RoomType, 'room_type_id')
  declare roomType?: RoomType;

  @BelongsTo(() => RatePlan, 'rate_plan_id')
  declare ratePlan?: RatePlan;
}
