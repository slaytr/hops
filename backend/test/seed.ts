import "dotenv/config";
import { db } from "../src/db.js";

// Access models from db instance
const {
  User,
  Staff,
  RoomType,
  Room,
  Task,
  Guest,
  RatePlan,
  RoomRate
} = db.models;

async function seed() {
  try {
    console.log('Starting database seeding...');

    // Seed users (authentication)
    console.log('Seeding users...');
    const [user1, user2, user3, user4] = await Promise.all([
      User.findOrCreate({
        where: { email: 'john.manager@hotel.com' },
        defaults: { user_type: 'staff', status: 'active' }
      }),
      User.findOrCreate({
        where: { email: 'jane.cleaner@hotel.com' },
        defaults: { user_type: 'staff', status: 'active' }
      }),
      User.findOrCreate({
        where: { email: 'bob.staff@hotel.com' },
        defaults: { user_type: 'staff', status: 'active' }
      }),
      User.findOrCreate({
        where: { email: 'alice.admin@hotel.com' },
        defaults: { user_type: 'staff', status: 'active' }
      })
    ]);

    // Seed staff
    console.log('Seeding staff...');
    await Promise.all([
      Staff.findOrCreate({
        where: { user_id: user1[0].id },
        defaults: {
          first_name: 'John',
          last_name: 'Manager',
          role: 'manager',
          department: 'Management',
          employment_date: new Date('2020-01-15'),
          hourly_rate: 35.00,
          status: 'active'
        }
      }),
      Staff.findOrCreate({
        where: { user_id: user2[0].id },
        defaults: {
          first_name: 'Jane',
          last_name: 'Cleaner',
          role: 'housekeeper',
          department: 'Housekeeping',
          employment_date: new Date('2021-03-20'),
          hourly_rate: 18.50,
          status: 'active'
        }
      }),
      Staff.findOrCreate({
        where: { user_id: user3[0].id },
        defaults: {
          first_name: 'Bob',
          last_name: 'Staff',
          role: 'front_desk',
          department: 'Front Desk',
          employment_date: new Date('2022-06-10'),
          hourly_rate: 22.00,
          status: 'active'
        }
      }),
      Staff.findOrCreate({
        where: { user_id: user4[0].id },
        defaults: {
          first_name: 'Alice',
          last_name: 'Admin',
          role: 'admin',
          department: 'Administration',
          employment_date: new Date('2019-08-01'),
          hourly_rate: 40.00,
          status: 'active'
        }
      })
    ]);

    // Seed room types
    console.log('Seeding room types...');
    const [rt1, rt2, rt3, rt4] = await Promise.all([
      RoomType.findOrCreate({
        where: { name: 'Standard Single' },
        defaults: {
          description: 'Comfortable single room',
          base_rate: 99.99,
          max_occupancy: 1,
          amenities: JSON.stringify(['WiFi', 'TV', 'Desk']),
          status: 'active'
        }
      }),
      RoomType.findOrCreate({
        where: { name: 'Deluxe Double' },
        defaults: {
          description: 'Spacious double room',
          base_rate: 159.99,
          max_occupancy: 2,
          amenities: JSON.stringify(['WiFi', 'TV', 'Mini Bar', 'Coffee Maker']),
          status: 'active'
        }
      }),
      RoomType.findOrCreate({
        where: { name: 'Executive Suite' },
        defaults: {
          description: 'Luxury suite with separate living area',
          base_rate: 299.99,
          max_occupancy: 4,
          amenities: JSON.stringify(['WiFi', 'TV', 'Mini Bar', 'Coffee Maker', 'Jacuzzi', 'Balcony']),
          status: 'active'
        }
      }),
      RoomType.findOrCreate({
        where: { name: 'Budget Room' },
        defaults: {
          description: 'Basic accommodation',
          base_rate: 59.99,
          max_occupancy: 1,
          amenities: JSON.stringify(['WiFi', 'TV']),
          status: 'active'
        }
      })
    ]);

    // Seed rooms
    console.log('Seeding rooms...');
    const rooms = await Promise.all([
      Room.findOrCreate({
        where: { room_number: '101' },
        defaults: { room_type_id: rt1[0].id, floor: 1, status: 'available' }
      }),
      Room.findOrCreate({
        where: { room_number: '102' },
        defaults: { room_type_id: rt1[0].id, floor: 1, status: 'available' }
      }),
      Room.findOrCreate({
        where: { room_number: '201' },
        defaults: { room_type_id: rt2[0].id, floor: 2, status: 'available' }
      }),
      Room.findOrCreate({
        where: { room_number: '202' },
        defaults: { room_type_id: rt2[0].id, floor: 2, status: 'maintenance', notes: 'AC repair scheduled' }
      }),
      Room.findOrCreate({
        where: { room_number: '301' },
        defaults: { room_type_id: rt3[0].id, floor: 3, status: 'available' }
      })
    ]);

    // Seed rate plans
    console.log('Seeding rate plans...');
    const [rp1, rp2, rp3] = await Promise.all([
      RatePlan.findOrCreate({
        where: { code: 'STANDARD' },
        defaults: {
          name: 'Standard Rate',
          description: 'Regular pricing',
          plan_type: 'standard',
          cancellation_policy: 'flexible',
          min_nights: 1,
          advance_booking_required: 0,
          deposit_percentage: 0,
          deposit_required: false,
          is_active: true
        }
      }),
      RatePlan.findOrCreate({
        where: { code: 'WEEKEND' },
        defaults: {
          name: 'Weekend Special',
          description: 'Weekend discounted rate',
          plan_type: 'promotional',
          cancellation_policy: 'moderate',
          min_nights: 2,
          advance_booking_required: 0,
          deposit_percentage: 25,
          deposit_required: true,
          is_active: true
        }
      }),
      RatePlan.findOrCreate({
        where: { code: 'CORPORATE' },
        defaults: {
          name: 'Corporate Rate',
          description: 'Discounted rate for corporate clients',
          plan_type: 'corporate',
          cancellation_policy: 'flexible',
          min_nights: 1,
          advance_booking_required: 0,
          deposit_percentage: 0,
          deposit_required: false,
          is_active: true
        }
      })
    ]);

    // Seed room rates
    console.log('Seeding room rates...');
    await Promise.all([
      // Standard rates
      RoomRate.findOrCreate({
        where: {
          room_type_id: rt1[0].id,
          rate_plan_id: rp1[0].id,
          day_of_week: 'all'
        },
        defaults: {
          rate: 99.99,
          extra_person_rate: 0,
          extra_child_rate: 0
        }
      }),
      RoomRate.findOrCreate({
        where: {
          room_type_id: rt2[0].id,
          rate_plan_id: rp1[0].id,
          day_of_week: 'all'
        },
        defaults: {
          rate: 159.99,
          extra_person_rate: 20.00,
          extra_child_rate: 10.00
        }
      }),
      // Weekend rates
      RoomRate.findOrCreate({
        where: {
          room_type_id: rt2[0].id,
          rate_plan_id: rp2[0].id,
          day_of_week: 'all'
        },
        defaults: {
          rate: 139.99,
          extra_person_rate: 20.00,
          extra_child_rate: 10.00
        }
      })
    ]);

    // Seed guests
    console.log('Seeding guests...');
    await Promise.all([
      Guest.findOrCreate({
        where: { email: 'sarah.jones@example.com' },
        defaults: {
          first_name: 'Sarah',
          last_name: 'Jones',
          phone: '+1-555-0123',
          vip_status: false
        }
      }),
      Guest.findOrCreate({
        where: { email: 'mike.smith@example.com' },
        defaults: {
          first_name: 'Mike',
          last_name: 'Smith',
          phone: '+1-555-0456',
          vip_status: true
        }
      })
    ]);

    // Get staff for task assignment
    const staff = await Staff.findAll();
    const housekeeper = staff.find(s => s.role === 'housekeeper');

    if (housekeeper) {
      // Seed tasks
      console.log('Seeding tasks...');
      await Promise.all([
        Task.findOrCreate({
          where: {
            room_id: rooms[0][0].id,
            task_date: new Date().toISOString().split('T')[0],
            task_type: 'cleaning'
          },
          defaults: {
            assigned_staff_id: housekeeper.id,
            start_date_time: new Date(),
            end_date_time: new Date(Date.now() + 2 * 60 * 60 * 1000),
            priority: 'high',
            status: 'pending',
            notes: 'Regular cleaning'
          }
        }),
        Task.findOrCreate({
          where: {
            room_id: rooms[1][0].id,
            task_date: new Date().toISOString().split('T')[0],
            task_type: 'cleaning'
          },
          defaults: {
            assigned_staff_id: housekeeper.id,
            start_date_time: new Date(),
            end_date_time: new Date(Date.now() + 2 * 60 * 60 * 1000),
            priority: 'medium',
            status: 'pending'
          }
        })
      ]);
    }

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
