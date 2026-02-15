import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from './User.js';
import { Reservation } from './Reservation.js';

@Table({
  tableName: 'guests',
  timestamps: true,
  underscored: true,
})
export class Guest extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    unique: true,
    field: 'user_id',
  })
  declare userId: number | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'first_name',
  })
  declare firstName: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'last_name',
  })
  declare lastName: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare email: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare phone: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'address_line1',
  })
  declare addressLine1: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'address_line2',
  })
  declare addressLine2: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare city: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: 'state_province',
  })
  declare stateProvince: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    field: 'postal_code',
  })
  declare postalCode: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare country: string | null;

  @Column({
    type: DataType.ENUM('passport', 'drivers_license', 'national_id', 'other'),
    allowNull: true,
    field: 'id_type',
  })
  declare idType: 'passport' | 'drivers_license' | 'national_id' | 'other' | null;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
    field: 'id_number',
  })
  declare idNumber: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare preferences: Record<string, any> | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'vip_status',
  })
  declare vipStatus: boolean;

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
  @BelongsTo(() => User, 'user_id')
  declare user?: User;

  @HasMany(() => Reservation, 'guest_id')
  declare reservations?: Reservation[];
}
