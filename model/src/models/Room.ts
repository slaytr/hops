import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { RoomType } from './RoomType.js';
import { Task } from './Task.js';
import { Reservation } from './Reservation.js';
import { RoomOccupancy } from './RoomOccupancy.js';

@Table({
  tableName: 'rooms',
  timestamps: true,
})
export class Room extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    unique: true,
    field: 'room_number',
  })
  declare roomNumber: string;

  @ForeignKey(() => RoomType)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'room_type_id',
  })
  declare roomTypeId: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare floor: number | null;

  @Column({
    type: DataType.ENUM('available', 'occupied', 'maintenance', 'cleaning'),
    allowNull: false,
    defaultValue: 'available',
  })
  declare status: 'available' | 'occupied' | 'maintenance' | 'cleaning';

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
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'updated_at',
  })
  declare updatedAt: Date;

  // Associations
  @BelongsTo(() => RoomType, 'room_type_id')
  declare roomType?: RoomType;

  @HasMany(() => Task, 'room_id')
  declare tasks?: Task[];

  @HasMany(() => Reservation, 'room_id')
  declare reservations?: Reservation[];

  @HasMany(() => RoomOccupancy, 'room_id')
  declare occupancies?: RoomOccupancy[];
}
