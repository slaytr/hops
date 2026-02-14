import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Room } from './Room.js';
import { RoomRate } from './RoomRate.js';
import { Reservation } from './Reservation.js';

@Table({
  tableName: 'room_types',
  timestamps: true,
})
export class RoomType extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare base_rate: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  declare max_occupancy: number;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare amenities: string[] | null;

  @Column({
    type: DataType.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
  })
  declare status: 'active' | 'inactive';

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
  @HasMany(() => Room, 'room_type_id')
  declare rooms?: Room[];

  @HasMany(() => RoomRate, 'room_type_id')
  declare room_rates?: RoomRate[];

  @HasMany(() => Reservation, 'room_type_id')
  declare reservations?: Reservation[];
}
