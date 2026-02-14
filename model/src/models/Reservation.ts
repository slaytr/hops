import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Guest } from './Guest.js';
import { Room } from './Room.js';
import { RoomType } from './RoomType.js';
import { RatePlan } from './RatePlan.js';
import { Staff } from './Staff.js';
import { RoomOccupancy } from './RoomOccupancy.js';

@Table({
  tableName: 'reservations',
  timestamps: true,
})
export class Reservation extends Model {
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
  declare confirmation_number: string;

  @ForeignKey(() => Guest)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare guest_id: number;

  @ForeignKey(() => Room)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare room_id: number | null;

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
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare check_in_date: Date;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare check_out_date: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare adults: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare children: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare total_rate: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  declare tax_amount: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  declare deposit_paid: number;

  @Column({
    type: DataType.VIRTUAL(DataType.INTEGER),
    get() {
      const checkIn = this.getDataValue('check_in_date');
      const checkOut = this.getDataValue('check_out_date');
      if (checkIn && checkOut) {
        const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      }
      return 0;
    },
  })
  declare nights: number;

  @Column({
    type: DataType.VIRTUAL(DataType.DECIMAL(10, 2)),
    get() {
      const total = parseFloat(this.getDataValue('total_rate') || '0');
      const tax = parseFloat(this.getDataValue('tax_amount') || '0');
      return (total + tax).toFixed(2);
    },
  })
  declare total_amount: string;

  @Column({
    type: DataType.VIRTUAL(DataType.DECIMAL(10, 2)),
    get() {
      const total = parseFloat(this.getDataValue('total_rate') || '0');
      const tax = parseFloat(this.getDataValue('tax_amount') || '0');
      const deposit = parseFloat(this.getDataValue('deposit_paid') || '0');
      return (total + tax - deposit).toFixed(2);
    },
  })
  declare balance_due: string;

  @Column({
    type: DataType.ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'),
    allowNull: false,
    defaultValue: 'pending',
  })
  declare status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare special_requests: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @ForeignKey(() => Staff)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare booked_by_staff_id: number | null;

  @ForeignKey(() => Staff)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare cancelled_by_staff_id: number | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare cancelled_at: Date | null;

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
  @BelongsTo(() => Guest, 'guest_id')
  declare guest?: Guest;

  @BelongsTo(() => Room, 'room_id')
  declare room?: Room;

  @BelongsTo(() => RoomType, 'room_type_id')
  declare room_type?: RoomType;

  @BelongsTo(() => RatePlan, 'rate_plan_id')
  declare rate_plan?: RatePlan;

  @BelongsTo(() => Staff, 'booked_by_staff_id')
  declare booked_by_staff?: Staff;

  @BelongsTo(() => Staff, 'cancelled_by_staff_id')
  declare cancelled_by_staff?: Staff;

  @HasMany(() => RoomOccupancy, 'reservation_id')
  declare occupancies?: RoomOccupancy[];
}
