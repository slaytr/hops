import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { RoomRate } from './RoomRate.js';
import { Reservation } from './Reservation.js';

@Table({
  tableName: 'rate_plans',
  timestamps: true,
})
export class RatePlan extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  declare code: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @Column({
    type: DataType.ENUM('standard', 'promotional', 'corporate', 'seasonal', 'package'),
    allowNull: false,
    defaultValue: 'standard',
  })
  declare plan_type: 'standard' | 'promotional' | 'corporate' | 'seasonal' | 'package';

  @Column({
    type: DataType.ENUM('flexible', 'moderate', 'strict', 'non_refundable'),
    allowNull: false,
    defaultValue: 'flexible',
  })
  declare cancellation_policy: 'flexible' | 'moderate' | 'strict' | 'non_refundable';

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare min_nights: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare max_nights: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare advance_booking_required: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  declare deposit_percentage: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare deposit_required: boolean;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare valid_from: Date | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare valid_to: Date | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare is_active: boolean;

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
  @HasMany(() => RoomRate, 'rate_plan_id')
  declare room_rates?: RoomRate[];

  @HasMany(() => Reservation, 'rate_plan_id')
  declare reservations?: Reservation[];
}
