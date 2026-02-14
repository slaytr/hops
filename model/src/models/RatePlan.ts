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
    field: 'plan_type',
  })
  declare planType: 'standard' | 'promotional' | 'corporate' | 'seasonal' | 'package';

  @Column({
    type: DataType.ENUM('flexible', 'moderate', 'strict', 'non_refundable'),
    allowNull: false,
    defaultValue: 'flexible',
    field: 'cancellation_policy',
  })
  declare cancellationPolicy: 'flexible' | 'moderate' | 'strict' | 'non_refundable';

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'min_nights',
  })
  declare minNights: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'max_nights',
  })
  declare maxNights: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'advance_booking_required',
  })
  declare advanceBookingRequired: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'deposit_percentage',
  })
  declare depositPercentage: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'deposit_required',
  })
  declare depositRequired: boolean;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'valid_from',
  })
  declare validFrom: Date | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
    field: 'valid_to',
  })
  declare validTo: Date | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  })
  declare isActive: boolean;

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
  @HasMany(() => RoomRate, 'rate_plan_id')
  declare roomRates?: RoomRate[];

  @HasMany(() => Reservation, 'rate_plan_id')
  declare reservations?: Reservation[];
}
