import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Room } from './Room.js';
import { Reservation } from './Reservation.js';

@Table({
  tableName: 'room_occupancy',
  timestamps: true,
  underscored: true,
})
export class RoomOccupancy extends Model {
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

  @ForeignKey(() => Reservation)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'reservation_id',
  })
  declare reservationId: number | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
    field: 'occupancy_date',
  })
  declare occupancyDate: Date;

  @Column({
    type: DataType.ENUM('available', 'occupied', 'blocked', 'maintenance'),
    allowNull: false,
    defaultValue: 'occupied',
  })
  declare status: 'available' | 'occupied' | 'blocked' | 'maintenance';

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

  // Timestamps handled automatically by Sequelize
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date;

  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => Room, 'room_id')
  declare room?: Room;

  @BelongsTo(() => Reservation, 'reservation_id')
  declare reservation?: Reservation;
}
