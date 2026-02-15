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
  underscored: true,
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
    field: 'confirmation_number',
  })
  declare confirmationNumber: string;

  @ForeignKey(() => Guest)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'guest_id',
  })
  declare guestId: number;

  @ForeignKey(() => Room)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'room_id',
  })
  declare roomId: number | null;

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
    type: DataType.DATEONLY,
    allowNull: false,
    field: 'check_in_date',
  })
  declare checkInDate: Date;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    field: 'check_out_date',
  })
  declare checkOutDate: Date;

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
    field: 'total_rate',
  })
  declare totalRate: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'tax_amount',
  })
  declare taxAmount: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'deposit_paid',
  })
  declare depositPaid: number;

  @Column({
    type: DataType.VIRTUAL(DataType.INTEGER),
    get() {
      const checkIn = this.getDataValue('checkInDate');
      const checkOut = this.getDataValue('checkOutDate');
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
      const total = parseFloat(this.getDataValue('totalRate') || '0');
      const tax = parseFloat(this.getDataValue('taxAmount') || '0');
      return (total + tax).toFixed(2);
    },
  })
  declare totalAmount: string;

  @Column({
    type: DataType.VIRTUAL(DataType.DECIMAL(10, 2)),
    get() {
      const total = parseFloat(this.getDataValue('totalRate') || '0');
      const tax = parseFloat(this.getDataValue('taxAmount') || '0');
      const deposit = parseFloat(this.getDataValue('depositPaid') || '0');
      return (total + tax - deposit).toFixed(2);
    },
  })
  declare balanceDue: string;

  @Column({
    type: DataType.ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'),
    allowNull: false,
    defaultValue: 'pending',
  })
  declare status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'special_requests',
  })
  declare specialRequests: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  @ForeignKey(() => Staff)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'booked_by_staff_id',
  })
  declare bookedByStaffId: number | null;

  @ForeignKey(() => Staff)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'cancelled_by_staff_id',
  })
  declare cancelledByStaffId: number | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'cancelled_at',
  })
  declare cancelledAt: Date | null;

  // Timestamps handled automatically by Sequelize
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => Guest, 'guest_id')
  declare guest?: Guest;

  @BelongsTo(() => Room, 'room_id')
  declare room?: Room;

  @BelongsTo(() => RoomType, 'room_type_id')
  declare roomType?: RoomType;

  @BelongsTo(() => RatePlan, 'rate_plan_id')
  declare ratePlan?: RatePlan;

  @BelongsTo(() => Staff, 'booked_by_staff_id')
  declare bookedByStaff?: Staff;

  @BelongsTo(() => Staff, 'cancelled_by_staff_id')
  declare cancelledByStaff?: Staff;

  @HasMany(() => RoomOccupancy, 'reservation_id')
  declare occupancies?: RoomOccupancy[];
}
