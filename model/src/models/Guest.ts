import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from './User.js';
import { Reservation } from './Reservation.js';

@Table({
  tableName: 'guests',
  timestamps: true,
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
  })
  declare user_id: number | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare first_name: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare last_name: string;

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
  })
  declare address_line1: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare address_line2: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare city: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare state_province: string | null;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare postal_code: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare country: string | null;

  @Column({
    type: DataType.ENUM('passport', 'drivers_license', 'national_id', 'other'),
    allowNull: true,
  })
  declare id_type: 'passport' | 'drivers_license' | 'national_id' | 'other' | null;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare id_number: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare preferences: Record<string, any> | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare vip_status: boolean;

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
  @BelongsTo(() => User, 'user_id')
  declare user?: User;

  @HasMany(() => Reservation, 'guest_id')
  declare reservations?: Reservation[];
}
