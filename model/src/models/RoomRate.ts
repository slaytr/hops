import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { RoomType } from './RoomType.js';
import { RatePlan } from './RatePlan.js';

@Table({
  tableName: 'room_rates',
  timestamps: true,
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
  })
  declare room_type_id: number;

  @ForeignKey(() => RatePlan)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare rate_plan_id: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare rate: number;

  @Column({
    type: DataType.ENUM('all', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
    allowNull: false,
    defaultValue: 'all',
  })
  declare day_of_week: 'all' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  declare extra_person_rate: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  declare extra_child_rate: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare effective_from: Date | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare effective_to: Date | null;

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
  @BelongsTo(() => RoomType, 'room_type_id')
  declare room_type?: RoomType;

  @BelongsTo(() => RatePlan, 'rate_plan_id')
  declare rate_plan?: RatePlan;
}
