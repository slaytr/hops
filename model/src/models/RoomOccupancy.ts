import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Room } from './Room.js';
import { Reservation } from './Reservation.js';

@Table({
  tableName: 'room_occupancy',
  timestamps: true,
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
  })
  declare room_id: number;

  @ForeignKey(() => Reservation)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare reservation_id: number | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare occupancy_date: Date;

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

  @BelongsTo(() => Reservation, 'reservation_id')
  declare reservation?: Reservation;
}
