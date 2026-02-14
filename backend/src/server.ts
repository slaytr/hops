import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  User,
  Staff,
  RoomType,
  Room,
  Task,
  testConnection
} from "./db/index.js";

// Request body interfaces
interface CreateStaffBody {
  userId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  department?: string;
  employmentDate?: string;
  hourlyRate?: number;
  status?: string;
  notes?: string;
}

interface UpdateStaffBody extends Partial<CreateStaffBody> {}

interface CreateRoomTypeBody {
  name: string;
  description?: string;
  baseRate: number;
  maxOccupancy: number;
  amenities?: string[];
  status?: string;
}

interface UpdateRoomTypeBody extends Partial<CreateRoomTypeBody> {}

interface CreateRoomBody {
  roomNumber: string;
  roomTypeId: string;
  floor?: number;
  status?: string;
  notes?: string;
}

interface UpdateRoomBody extends Partial<CreateRoomBody> {}

interface CreateTaskBody {
  roomId: string;
  assignedStaffId: string;
  taskDate?: string;
  startDateTime?: string;
  endDateTime?: string;
  taskType?: string;
  priority?: string;
  status?: string;
  notes?: string;
}

interface UpdateTaskBody extends Partial<CreateTaskBody> {
  startedAt?: string;
  completedAt?: string;
}

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: true,
});

// ==================== ROOT ====================

fastify.get("/", async () => {
  return { hello: "world" };
});

// ==================== USERS ====================

// Get all users
fastify.get("/users", async () => {
  const users = await User.findAll({
    order: [['created_at', 'DESC']],
    attributes: { exclude: ['password_hash'] }
  });

  return { users };
});

// Get user by ID
fastify.get<{ Params: { id: string } }>("/users/:id", async (request, reply) => {
  const user = await User.findByPk(request.params.id, {
    attributes: { exclude: ['password_hash'] }
  });

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  return { user };
});

// Create new user
fastify.post<{ Body: { email: string; userType: string; status?: string } }>("/users", async (request, reply) => {
  const { email, userType, status } = request.body;

  if (!email || !userType) {
    return reply.status(400).send({ error: "Email and user type are required" });
  }

  try {
    const user = await User.create({
      email,
      user_type: userType,
      status: status || 'active'
    });

    return { success: true, user };
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return reply.status(400).send({ error: "Email already exists" });
    }
    throw error;
  }
});

// Update user
fastify.put<{ Params: { id: string }; Body: { email?: string; userType?: string; status?: string } }>("/users/:id", async (request, reply) => {
  const { email, userType, status } = request.body;

  const user = await User.findByPk(request.params.id);
  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  const updates: any = {};
  if (email) updates.email = email;
  if (userType) updates.user_type = userType;
  if (status) updates.status = status;

  if (Object.keys(updates).length === 0) {
    return reply.status(400).send({ error: "No fields to update" });
  }

  try {
    await user.update(updates);
    return { success: true, user };
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return reply.status(400).send({ error: "Email already exists" });
    }
    throw error;
  }
});

// Delete user
fastify.delete<{ Params: { id: string } }>("/users/:id", async (request, reply) => {
  const user = await User.findByPk(request.params.id);

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  try {
    await user.destroy();
    return { success: true, user };
  } catch (error: any) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return reply.status(400).send({ error: "Cannot delete user: staff or guest records are linked to this user" });
    }
    throw error;
  }
});

// ==================== STAFF ====================

// Get all staff
fastify.get("/staff", async () => {
  const staff = await Staff.findAll({
    include: [{ model: User, attributes: ['email'] }],
    order: [['created_at', 'DESC']]
  });

  return { staff };
});

// Get staff by ID
fastify.get<{ Params: { id: string } }>("/staff/:id", async (request, reply) => {
  const staff = await Staff.findByPk(request.params.id, {
    include: [{ model: User, attributes: ['email'] }]
  });

  if (!staff) {
    return reply.status(404).send({ error: "Staff member not found" });
  }

  return { staff };
});

// Create new staff member
fastify.post<{ Body: CreateStaffBody }>("/staff", async (request, reply) => {
  const { userId, firstName, lastName, phone, role, department, employmentDate, hourlyRate, status, notes } = request.body;

  if (!firstName || !lastName || !role) {
    return reply.status(400).send({ error: "First name, last name, and role are required" });
  }

  // Validate userId if provided
  if (userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      return reply.status(400).send({ error: "Invalid user ID" });
    }
    if (user.user_type !== 'staff') {
      return reply.status(400).send({ error: "User type must be 'staff'" });
    }
  }

  try {
    const staff = await Staff.create({
      user_id: userId || null,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      role,
      department: department || null,
      employment_date: employmentDate || null,
      hourly_rate: hourlyRate || null,
      status: status || 'active',
      notes: notes || null
    });

    return { success: true, staff };
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return reply.status(400).send({ error: "User ID already linked to another staff member" });
    }
    throw error;
  }
});

// Update staff member
fastify.put<{ Params: { id: string }; Body: UpdateStaffBody }>("/staff/:id", async (request, reply) => {
  const { userId, firstName, lastName, phone, role, department, employmentDate, hourlyRate, status, notes } = request.body;

  const staff = await Staff.findByPk(request.params.id);
  if (!staff) {
    return reply.status(404).send({ error: "Staff member not found" });
  }

  // Validate userId if provided
  if (userId !== undefined && userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      return reply.status(400).send({ error: "Invalid user ID" });
    }
    if (user.user_type !== 'staff') {
      return reply.status(400).send({ error: "User type must be 'staff'" });
    }
  }

  const updates: any = {};
  if (userId !== undefined) updates.user_id = userId || null;
  if (firstName) updates.first_name = firstName;
  if (lastName) updates.last_name = lastName;
  if (phone !== undefined) updates.phone = phone;
  if (role) updates.role = role;
  if (department !== undefined) updates.department = department;
  if (employmentDate !== undefined) updates.employment_date = employmentDate;
  if (hourlyRate !== undefined) updates.hourly_rate = hourlyRate;
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;

  if (Object.keys(updates).length === 0) {
    return reply.status(400).send({ error: "No fields to update" });
  }

  try {
    await staff.update(updates);
    await staff.reload({ include: [{ model: User, attributes: ['email'] }] });
    return { success: true, staff };
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return reply.status(400).send({ error: "User ID already linked to another staff member" });
    }
    throw error;
  }
});

// Delete staff member
fastify.delete<{ Params: { id: string } }>("/staff/:id", async (request, reply) => {
  const staff = await Staff.findByPk(request.params.id);

  if (!staff) {
    return reply.status(404).send({ error: "Staff member not found" });
  }

  try {
    await staff.destroy();
    return { success: true, staff };
  } catch (error: any) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return reply.status(400).send({ error: "Cannot delete staff member: tasks or reservations are assigned to this person" });
    }
    throw error;
  }
});

// ==================== ROOM TYPES ====================

// Get all room types
fastify.get("/room-types", async () => {
  const roomTypes = await RoomType.findAll({
    order: [['created_at', 'DESC']]
  });

  return { roomTypes };
});

// Get room type by ID
fastify.get<{ Params: { id: string } }>("/room-types/:id", async (request, reply) => {
  const roomType = await RoomType.findByPk(request.params.id);

  if (!roomType) {
    return reply.status(404).send({ error: "Room type not found" });
  }

  return { roomType };
});

// Create new room type
fastify.post<{ Body: CreateRoomTypeBody }>("/room-types", async (request, reply) => {
  const { name, description, baseRate, maxOccupancy, amenities, status } = request.body;

  if (!name || baseRate === undefined || baseRate === null || !maxOccupancy) {
    return reply.status(400).send({ error: "Name, base rate, and max occupancy are required" });
  }

  if (baseRate < 0) {
    return reply.status(400).send({ error: "Base rate must be non-negative" });
  }

  if (maxOccupancy < 1) {
    return reply.status(400).send({ error: "Max occupancy must be at least 1" });
  }

  try {
    const roomType = await RoomType.create({
      name,
      description: description || null,
      base_rate: baseRate,
      max_occupancy: maxOccupancy,
      amenities: amenities ? JSON.stringify(amenities) : null,
      status: status || 'active'
    });

    return { success: true, roomType };
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return reply.status(400).send({ error: "Room type name already exists" });
    }
    throw error;
  }
});

// Update room type
fastify.put<{ Params: { id: string }; Body: UpdateRoomTypeBody }>("/room-types/:id", async (request, reply) => {
  const { name, description, baseRate, maxOccupancy, amenities, status } = request.body;

  const roomType = await RoomType.findByPk(request.params.id);
  if (!roomType) {
    return reply.status(404).send({ error: "Room type not found" });
  }

  if (baseRate !== undefined && baseRate < 0) {
    return reply.status(400).send({ error: "Base rate must be non-negative" });
  }

  if (maxOccupancy !== undefined && maxOccupancy < 1) {
    return reply.status(400).send({ error: "Max occupancy must be at least 1" });
  }

  const updates: any = {};
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (baseRate !== undefined) updates.base_rate = baseRate;
  if (maxOccupancy) updates.max_occupancy = maxOccupancy;
  if (amenities !== undefined) updates.amenities = amenities ? JSON.stringify(amenities) : null;
  if (status) updates.status = status;

  if (Object.keys(updates).length === 0) {
    return reply.status(400).send({ error: "No fields to update" });
  }

  try {
    await roomType.update(updates);
    return { success: true, roomType };
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return reply.status(400).send({ error: "Room type name already exists" });
    }
    throw error;
  }
});

// Delete room type
fastify.delete<{ Params: { id: string } }>("/room-types/:id", async (request, reply) => {
  const roomType = await RoomType.findByPk(request.params.id);

  if (!roomType) {
    return reply.status(404).send({ error: "Room type not found" });
  }

  try {
    await roomType.destroy();
    return { success: true, roomType };
  } catch (error: any) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return reply.status(400).send({ error: "Cannot delete room type: rooms exist with this type" });
    }
    throw error;
  }
});

// ==================== ROOMS ====================

// Get all rooms
fastify.get("/rooms", async () => {
  const rooms = await Room.findAll({
    include: [{ model: RoomType, attributes: ['name'] }],
    order: [['created_at', 'DESC']]
  });

  return { rooms };
});

// Get room by ID
fastify.get<{ Params: { id: string } }>("/rooms/:id", async (request, reply) => {
  const room = await Room.findByPk(request.params.id, {
    include: [{ model: RoomType, attributes: ['name'] }]
  });

  if (!room) {
    return reply.status(404).send({ error: "Room not found" });
  }

  return { room };
});

// Create new room
fastify.post<{ Body: CreateRoomBody }>("/rooms", async (request, reply) => {
  const { roomNumber, roomTypeId, floor, status, notes } = request.body;

  if (!roomNumber || !roomTypeId) {
    return reply.status(400).send({ error: "Room number and room type are required" });
  }

  // Validate roomTypeId exists
  const roomType = await RoomType.findByPk(roomTypeId);
  if (!roomType) {
    return reply.status(400).send({ error: "Invalid room type ID" });
  }

  try {
    const room = await Room.create({
      room_number: roomNumber,
      room_type_id: roomTypeId,
      floor: floor || null,
      status: status || 'available',
      notes: notes || null
    });

    await room.reload({ include: [{ model: RoomType, attributes: ['name'] }] });
    return { success: true, room };
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return reply.status(400).send({ error: "Room number already exists" });
    }
    throw error;
  }
});

// Update room
fastify.put<{ Params: { id: string }; Body: UpdateRoomBody }>("/rooms/:id", async (request, reply) => {
  const { roomNumber, roomTypeId, floor, status, notes } = request.body;

  const room = await Room.findByPk(request.params.id);
  if (!room) {
    return reply.status(404).send({ error: "Room not found" });
  }

  // Validate roomTypeId if provided
  if (roomTypeId) {
    const roomType = await RoomType.findByPk(roomTypeId);
    if (!roomType) {
      return reply.status(400).send({ error: "Invalid room type ID" });
    }
  }

  const updates: any = {};
  if (roomNumber) updates.room_number = roomNumber;
  if (roomTypeId) updates.room_type_id = roomTypeId;
  if (floor !== undefined) updates.floor = floor;
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;

  if (Object.keys(updates).length === 0) {
    return reply.status(400).send({ error: "No fields to update" });
  }

  try {
    await room.update(updates);
    await room.reload({ include: [{ model: RoomType, attributes: ['name'] }] });
    return { success: true, room };
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return reply.status(400).send({ error: "Room number already exists" });
    }
    throw error;
  }
});

// Delete room
fastify.delete<{ Params: { id: string } }>("/rooms/:id", async (request, reply) => {
  const room = await Room.findByPk(request.params.id);

  if (!room) {
    return reply.status(404).send({ error: "Room not found" });
  }

  await room.destroy();
  return { success: true, room };
});

// ==================== TASKS ====================

// Get all tasks with optional filters
fastify.get<{ Querystring: { date?: string; startDate?: string; endDate?: string; status?: string; staffId?: string } }>("/tasks", async (request) => {
  const { date, startDate, endDate, status, staffId } = request.query;

  const where: any = {};

  if (date) {
    where.task_date = date;
  } else if (startDate && endDate) {
    // For date range, use raw SQL comparison
    const tasks = await Task.findAll({
      where: status ? { status } : {},
      include: [
        { model: Room, attributes: ['room_number'] },
        { model: Staff, as: 'assigned_staff', attributes: ['first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // Filter by date range in application layer for now
    const filteredTasks = tasks.filter(t => {
      const taskStart = t.start_date_time || new Date(`${t.task_date}T12:00:00`);
      const taskEnd = t.end_date_time || new Date(`${t.task_date}T23:59:59`);
      const rangeStart = new Date(`${startDate}T00:00:00`);
      const rangeEnd = new Date(`${endDate}T23:59:59`);

      return taskStart <= rangeEnd && taskEnd >= rangeStart;
    });

    return { tasks: filteredTasks };
  }

  if (status) where.status = status;
  if (staffId) where.assigned_staff_id = staffId;

  const tasks = await Task.findAll({
    where,
    include: [
      { model: Room, attributes: ['room_number'] },
      { model: Staff, as: 'assigned_staff', attributes: ['first_name', 'last_name'] }
    ],
    order: [['created_at', 'DESC']]
  });

  return { tasks };
});

// Get task by ID
fastify.get<{ Params: { id: string } }>("/tasks/:id", async (request, reply) => {
  const task = await Task.findByPk(request.params.id, {
    include: [
      { model: Room, attributes: ['room_number'] },
      { model: Staff, as: 'assigned_staff', attributes: ['first_name', 'last_name'] }
    ]
  });

  if (!task) {
    return reply.status(404).send({ error: "Task not found" });
  }

  return { task };
});

// Create new task
fastify.post<{ Body: CreateTaskBody }>("/tasks", async (request, reply) => {
  const { roomId, assignedStaffId, taskDate, startDateTime, endDateTime, taskType, priority, status, notes } = request.body;

  if (!roomId || !assignedStaffId) {
    return reply.status(400).send({ error: "Room and assigned staff are required" });
  }

  if (!taskDate && !startDateTime) {
    return reply.status(400).send({ error: "Either taskDate or startDateTime is required" });
  }

  // Validate roomId exists
  const room = await Room.findByPk(roomId);
  if (!room) {
    return reply.status(400).send({ error: "Invalid room ID" });
  }

  // Validate assignedStaffId exists
  const assignedStaff = await Staff.findByPk(assignedStaffId);
  if (!assignedStaff) {
    return reply.status(400).send({ error: "Invalid staff ID" });
  }

  // Process date/time fields
  let finalTaskDate: string;
  let finalStartDateTime: Date | null = null;
  let finalEndDateTime: Date | null = null;

  if (startDateTime || endDateTime) {
    const start = startDateTime || endDateTime!;
    const end = endDateTime || startDateTime!;

    finalStartDateTime = new Date(start.includes('T') ? start : `${start}T12:00:00Z`);
    finalEndDateTime = new Date(end.includes('T') ? end : `${end}T23:59:59Z`);
    finalTaskDate = finalStartDateTime.toISOString().split('T')[0];

    if (finalEndDateTime < finalStartDateTime) {
      return reply.status(400).send({ error: "End date/time must be after start date/time" });
    }
  } else if (taskDate) {
    finalTaskDate = taskDate;
    finalStartDateTime = new Date(`${taskDate}T12:00:00Z`);
    finalEndDateTime = new Date(`${taskDate}T23:59:59Z`);
  } else {
    return reply.status(400).send({ error: "Either taskDate or startDateTime/endDateTime is required" });
  }

  try {
    const task = await Task.create({
      room_id: roomId,
      assigned_staff_id: assignedStaffId,
      task_date: finalTaskDate,
      start_date_time: finalStartDateTime,
      end_date_time: finalEndDateTime,
      task_type: taskType || 'cleaning',
      priority: priority || 'medium',
      status: status || 'pending',
      notes: notes || null
    });

    await task.reload({
      include: [
        { model: Room, attributes: ['room_number'] },
        { model: Staff, as: 'assigned_staff', attributes: ['first_name', 'last_name'] }
      ]
    });

    return { success: true, task };
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return reply.status(400).send({ error: "A task of this type already exists for this room on this date" });
    }
    throw error;
  }
});

// Update task
fastify.put<{ Params: { id: string }; Body: UpdateTaskBody }>("/tasks/:id", async (request, reply) => {
  const { roomId, assignedStaffId, taskDate, startDateTime, endDateTime, taskType, priority, status, notes, startedAt, completedAt } = request.body;

  const task = await Task.findByPk(request.params.id);
  if (!task) {
    return reply.status(404).send({ error: "Task not found" });
  }

  // Validate roomId if provided
  if (roomId) {
    const room = await Room.findByPk(roomId);
    if (!room) {
      return reply.status(400).send({ error: "Invalid room ID" });
    }
  }

  // Validate assignedStaffId if provided
  if (assignedStaffId) {
    const assignedStaff = await Staff.findByPk(assignedStaffId);
    if (!assignedStaff) {
      return reply.status(400).send({ error: "Invalid staff ID" });
    }
  }

  // Process date/time fields
  const updates: any = {};

  if (startDateTime !== undefined || endDateTime !== undefined) {
    const existingStart = task.start_date_time?.toISOString();
    const existingEnd = task.end_date_time?.toISOString();

    const newStart = startDateTime || existingStart;
    const newEnd = endDateTime || existingEnd;

    if (newStart && newEnd) {
      const finalStart = new Date(newStart.includes('T') ? newStart : `${newStart}T12:00:00Z`);
      const finalEnd = new Date(newEnd.includes('T') ? newEnd : `${newEnd}T12:00:00Z`);

      if (finalEnd < finalStart) {
        return reply.status(400).send({ error: "End date/time must be after start date/time" });
      }

      updates.start_date_time = finalStart;
      updates.end_date_time = finalEnd;
      updates.task_date = finalStart.toISOString().split('T')[0];
    }
  } else if (taskDate !== undefined) {
    updates.task_date = taskDate;
    updates.start_date_time = new Date(`${taskDate}T12:00:00Z`);
    updates.end_date_time = new Date(`${taskDate}T23:59:59Z`);
  }

  if (roomId) updates.room_id = roomId;
  if (assignedStaffId) updates.assigned_staff_id = assignedStaffId;
  if (taskType) updates.task_type = taskType;
  if (priority) updates.priority = priority;
  if (notes !== undefined) updates.notes = notes;
  if (startedAt !== undefined) updates.started_at = startedAt;
  if (completedAt !== undefined) updates.completed_at = completedAt;

  if (status) {
    updates.status = status;
    // Handle status transitions
    if (status === 'in_progress' && !task.started_at) {
      updates.started_at = new Date();
    }
    if (status === 'completed' && !task.completed_at) {
      updates.completed_at = new Date();
    }
  }

  if (Object.keys(updates).length === 0) {
    return reply.status(400).send({ error: "No fields to update" });
  }

  await task.update(updates);
  await task.reload({
    include: [
      { model: Room, attributes: ['room_number'] },
      { model: Staff, as: 'assigned_staff', attributes: ['first_name', 'last_name'] }
    ]
  });

  return { success: true, task };
});

// Delete task
fastify.delete<{ Params: { id: string } }>("/tasks/:id", async (request, reply) => {
  const task = await Task.findByPk(request.params.id);

  if (!task) {
    return reply.status(404).send({ error: "Task not found" });
  }

  await task.destroy();
  return { success: true, task };
});

// ==================== SERVER ====================

const port = parseInt(process.env.PORT || "3000", 10);

const start = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }
    fastify.log.info('Database connection established');

    await fastify.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
