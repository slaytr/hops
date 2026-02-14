import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import NodeCache from "node-cache";

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: true,
});

interface User {
  id: string;
  name: string;
  email: string;
  role: 'staff' | 'manager' | 'admin';
  status: 'active' | 'inactive';
  createdAt: string;
}

interface RoomType {
  id: string;
  name: string;
  description?: string;
  baseRate: number;
  maxOccupancy: number;
  amenities?: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

interface Room {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomTypeName?: string;
  floor?: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber?: string;
  assignedUserId: string;
  assignedUserName?: string;
  taskDate: string; // Keep for backward compatibility
  startDateTime?: string; // ISO 8601 datetime
  endDateTime?: string; // ISO 8601 datetime
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'turndown';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

const cache = new NodeCache();
const USERS_KEY = "users";
const ROOM_TYPES_KEY = "room_types";
const ROOMS_KEY = "rooms";
const HOUSEKEEPING_TASKS_KEY = "housekeeping_tasks";

// Initialize users array in cache with a sample user
const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@hotel.com',
    role: 'manager',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Jane Cleaner',
    email: 'jane@hotel.com',
    role: 'staff',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];
cache.set(USERS_KEY, sampleUsers);

// Initialize room types array in cache with sample data
const sampleRoomTypes: RoomType[] = [
  {
    id: '1',
    name: 'Standard Single',
    description: 'Comfortable single room',
    baseRate: 99.99,
    maxOccupancy: 1,
    amenities: ['WiFi', 'TV', 'Desk'],
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Deluxe Double',
    description: 'Spacious double room',
    baseRate: 159.99,
    maxOccupancy: 2,
    amenities: ['WiFi', 'TV', 'Mini Bar', 'Coffee Maker'],
    status: 'active',
    createdAt: new Date().toISOString()
  }
];
cache.set(ROOM_TYPES_KEY, sampleRoomTypes);

// Initialize rooms array in cache with sample data
const sampleRooms: Room[] = [
  {
    id: '1',
    roomNumber: '101',
    roomTypeId: '1',
    floor: 1,
    status: 'available',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    roomNumber: '201',
    roomTypeId: '2',
    floor: 2,
    status: 'cleaning',
    createdAt: new Date().toISOString()
  }
];
cache.set(ROOMS_KEY, sampleRooms);

// Initialize housekeeping tasks array in cache
cache.set(HOUSEKEEPING_TASKS_KEY, []);

fastify.get("/", async () => {
  return { hello: "world" };
});

// Get all users
fastify.get("/users", async () => {
  const users = cache.get<User[]>(USERS_KEY) || [];
  return { users };
});

// Get user by ID
fastify.get<{ Params: { id: string } }>("/users/:id", async (request, reply) => {
  const users = cache.get<User[]>(USERS_KEY) || [];
  const user = users.find(u => u.id === request.params.id);

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  return { user };
});

// Create new user
fastify.post<{ Body: Omit<User, 'id' | 'createdAt'> }>("/users", async (request, reply) => {
  const { name, email, role, status } = request.body;

  if (!name || !email || !role) {
    return reply.status(400).send({ error: "Name, email, and role are required" });
  }

  const users = cache.get<User[]>(USERS_KEY) || [];

  // Check if email already exists
  if (users.some(u => u.email === email)) {
    return reply.status(400).send({ error: "Email already exists" });
  }

  const newUser: User = {
    id: Date.now().toString(),
    name,
    email,
    role,
    status: status || 'active',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  cache.set(USERS_KEY, users);

  return { success: true, user: newUser };
});

// Update user
fastify.put<{ Params: { id: string }, Body: Partial<Omit<User, 'id' | 'createdAt'>> }>("/users/:id", async (request, reply) => {
  const users = cache.get<User[]>(USERS_KEY) || [];
  const userIndex = users.findIndex(u => u.id === request.params.id);

  if (userIndex === -1) {
    return reply.status(404).send({ error: "User not found" });
  }

  const { name, email, role, status } = request.body;

  // Check if email is being changed and already exists
  if (email && email !== users[userIndex].email && users.some(u => u.email === email)) {
    return reply.status(400).send({ error: "Email already exists" });
  }

  users[userIndex] = {
    ...users[userIndex],
    ...(name && { name }),
    ...(email && { email }),
    ...(role && { role }),
    ...(status && { status })
  };

  cache.set(USERS_KEY, users);

  return { success: true, user: users[userIndex] };
});

// Delete user
fastify.delete<{ Params: { id: string } }>("/users/:id", async (request, reply) => {
  const users = cache.get<User[]>(USERS_KEY) || [];
  const userIndex = users.findIndex(u => u.id === request.params.id);

  if (userIndex === -1) {
    return reply.status(404).send({ error: "User not found" });
  }

  // Check if user has assigned housekeeping tasks (RESTRICT behavior)
  const tasks = cache.get<HousekeepingTask[]>(HOUSEKEEPING_TASKS_KEY) || [];
  if (tasks.some(t => t.assignedUserId === request.params.id)) {
    return reply.status(400).send({ error: "Cannot delete user: housekeeping tasks are assigned to this user" });
  }

  const deletedUser = users.splice(userIndex, 1)[0];
  cache.set(USERS_KEY, users);

  return { success: true, user: deletedUser };
});

// ==================== ROOM TYPES ====================

// Get all room types
fastify.get("/room-types", async () => {
  const roomTypes = cache.get<RoomType[]>(ROOM_TYPES_KEY) || [];
  return { roomTypes };
});

// Get room type by ID
fastify.get<{ Params: { id: string } }>("/room-types/:id", async (request, reply) => {
  const roomTypes = cache.get<RoomType[]>(ROOM_TYPES_KEY) || [];
  const roomType = roomTypes.find(rt => rt.id === request.params.id);

  if (!roomType) {
    return reply.status(404).send({ error: "Room type not found" });
  }

  return { roomType };
});

// Create new room type
fastify.post<{ Body: Omit<RoomType, 'id' | 'createdAt' | 'updatedAt'> }>("/room-types", async (request, reply) => {
  const { name, description, baseRate, maxOccupancy, amenities, status } = request.body;

  // Validation
  if (!name || baseRate === undefined || baseRate === null || !maxOccupancy) {
    return reply.status(400).send({ error: "Name, base rate, and max occupancy are required" });
  }

  if (baseRate < 0) {
    return reply.status(400).send({ error: "Base rate must be non-negative" });
  }

  if (maxOccupancy < 1) {
    return reply.status(400).send({ error: "Max occupancy must be at least 1" });
  }

  const roomTypes = cache.get<RoomType[]>(ROOM_TYPES_KEY) || [];

  // Check unique name
  if (roomTypes.some(rt => rt.name.toLowerCase() === name.toLowerCase())) {
    return reply.status(400).send({ error: "Room type name already exists" });
  }

  const newRoomType: RoomType = {
    id: Date.now().toString(),
    name,
    description,
    baseRate,
    maxOccupancy,
    amenities,
    status: status || 'active',
    createdAt: new Date().toISOString()
  };

  roomTypes.push(newRoomType);
  cache.set(ROOM_TYPES_KEY, roomTypes);

  return { success: true, roomType: newRoomType };
});

// Update room type
fastify.put<{ Params: { id: string }, Body: Partial<Omit<RoomType, 'id' | 'createdAt'>> }>("/room-types/:id", async (request, reply) => {
  const roomTypes = cache.get<RoomType[]>(ROOM_TYPES_KEY) || [];
  const roomTypeIndex = roomTypes.findIndex(rt => rt.id === request.params.id);

  if (roomTypeIndex === -1) {
    return reply.status(404).send({ error: "Room type not found" });
  }

  const { name, description, baseRate, maxOccupancy, amenities, status } = request.body;

  // Check if name is being changed and already exists
  if (name && name.toLowerCase() !== roomTypes[roomTypeIndex].name.toLowerCase() && roomTypes.some(rt => rt.name.toLowerCase() === name.toLowerCase())) {
    return reply.status(400).send({ error: "Room type name already exists" });
  }

  // Validate baseRate if provided
  if (baseRate !== undefined && baseRate < 0) {
    return reply.status(400).send({ error: "Base rate must be non-negative" });
  }

  // Validate maxOccupancy if provided
  if (maxOccupancy !== undefined && maxOccupancy < 1) {
    return reply.status(400).send({ error: "Max occupancy must be at least 1" });
  }

  roomTypes[roomTypeIndex] = {
    ...roomTypes[roomTypeIndex],
    ...(name && { name }),
    ...(description !== undefined && { description }),
    ...(baseRate !== undefined && { baseRate }),
    ...(maxOccupancy && { maxOccupancy }),
    ...(amenities !== undefined && { amenities }),
    ...(status && { status }),
    updatedAt: new Date().toISOString()
  };

  cache.set(ROOM_TYPES_KEY, roomTypes);

  return { success: true, roomType: roomTypes[roomTypeIndex] };
});

// Delete room type
fastify.delete<{ Params: { id: string } }>("/room-types/:id", async (request, reply) => {
  const roomTypes = cache.get<RoomType[]>(ROOM_TYPES_KEY) || [];
  const roomTypeIndex = roomTypes.findIndex(rt => rt.id === request.params.id);

  if (roomTypeIndex === -1) {
    return reply.status(404).send({ error: "Room type not found" });
  }

  // Check if any rooms reference this room type (RESTRICT behavior)
  const rooms = cache.get<Room[]>(ROOMS_KEY) || [];
  if (rooms.some(r => r.roomTypeId === request.params.id)) {
    return reply.status(400).send({ error: "Cannot delete room type: rooms exist with this type" });
  }

  const deletedRoomType = roomTypes.splice(roomTypeIndex, 1)[0];
  cache.set(ROOM_TYPES_KEY, roomTypes);

  return { success: true, roomType: deletedRoomType };
});

// ==================== ROOMS ====================

// Get all rooms
fastify.get("/rooms", async () => {
  const rooms = cache.get<Room[]>(ROOMS_KEY) || [];
  const roomTypes = cache.get<RoomType[]>(ROOM_TYPES_KEY) || [];

  // Join with room types to populate roomTypeName
  const roomsWithTypes = rooms.map(room => {
    const roomType = roomTypes.find(rt => rt.id === room.roomTypeId);
    return {
      ...room,
      roomTypeName: roomType?.name
    };
  });

  return { rooms: roomsWithTypes };
});

// Get room by ID
fastify.get<{ Params: { id: string } }>("/rooms/:id", async (request, reply) => {
  const rooms = cache.get<Room[]>(ROOMS_KEY) || [];
  const room = rooms.find(r => r.id === request.params.id);

  if (!room) {
    return reply.status(404).send({ error: "Room not found" });
  }

  // Populate room type name
  const roomTypes = cache.get<RoomType[]>(ROOM_TYPES_KEY) || [];
  const roomType = roomTypes.find(rt => rt.id === room.roomTypeId);

  return {
    room: {
      ...room,
      roomTypeName: roomType?.name
    }
  };
});

// Create new room
fastify.post<{ Body: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'roomTypeName'> }>("/rooms", async (request, reply) => {
  const { roomNumber, roomTypeId, floor, status, notes } = request.body;

  // Validation
  if (!roomNumber || !roomTypeId) {
    return reply.status(400).send({ error: "Room number and room type are required" });
  }

  // Validate roomTypeId exists
  const roomTypes = cache.get<RoomType[]>(ROOM_TYPES_KEY) || [];
  if (!roomTypes.some(rt => rt.id === roomTypeId)) {
    return reply.status(400).send({ error: "Invalid room type ID" });
  }

  const rooms = cache.get<Room[]>(ROOMS_KEY) || [];

  // Check unique room number
  if (rooms.some(r => r.roomNumber.toLowerCase() === roomNumber.toLowerCase())) {
    return reply.status(400).send({ error: "Room number already exists" });
  }

  const newRoom: Room = {
    id: Date.now().toString(),
    roomNumber,
    roomTypeId,
    floor,
    status: status || 'available',
    notes,
    createdAt: new Date().toISOString()
  };

  rooms.push(newRoom);
  cache.set(ROOMS_KEY, rooms);

  // Populate room type name for response
  const roomType = roomTypes.find(rt => rt.id === roomTypeId);

  return {
    success: true,
    room: {
      ...newRoom,
      roomTypeName: roomType?.name
    }
  };
});

// Update room
fastify.put<{ Params: { id: string }, Body: Partial<Omit<Room, 'id' | 'createdAt' | 'roomTypeName'>> }>("/rooms/:id", async (request, reply) => {
  const rooms = cache.get<Room[]>(ROOMS_KEY) || [];
  const roomIndex = rooms.findIndex(r => r.id === request.params.id);

  if (roomIndex === -1) {
    return reply.status(404).send({ error: "Room not found" });
  }

  const { roomNumber, roomTypeId, floor, status, notes } = request.body;

  // Validate roomTypeId if provided
  if (roomTypeId) {
    const roomTypes = cache.get<RoomType[]>(ROOM_TYPES_KEY) || [];
    if (!roomTypes.some(rt => rt.id === roomTypeId)) {
      return reply.status(400).send({ error: "Invalid room type ID" });
    }
  }

  // Check if room number is being changed and already exists
  if (roomNumber && roomNumber.toLowerCase() !== rooms[roomIndex].roomNumber.toLowerCase() && rooms.some(r => r.roomNumber.toLowerCase() === roomNumber.toLowerCase())) {
    return reply.status(400).send({ error: "Room number already exists" });
  }

  rooms[roomIndex] = {
    ...rooms[roomIndex],
    ...(roomNumber && { roomNumber }),
    ...(roomTypeId && { roomTypeId }),
    ...(floor !== undefined && { floor }),
    ...(status && { status }),
    ...(notes !== undefined && { notes }),
    updatedAt: new Date().toISOString()
  };

  cache.set(ROOMS_KEY, rooms);

  // Populate room type name for response
  const roomTypes = cache.get<RoomType[]>(ROOM_TYPES_KEY) || [];
  const roomType = roomTypes.find(rt => rt.id === rooms[roomIndex].roomTypeId);

  return {
    success: true,
    room: {
      ...rooms[roomIndex],
      roomTypeName: roomType?.name
    }
  };
});

// Delete room
fastify.delete<{ Params: { id: string } }>("/rooms/:id", async (request, reply) => {
  const rooms = cache.get<Room[]>(ROOMS_KEY) || [];
  const roomIndex = rooms.findIndex(r => r.id === request.params.id);

  if (roomIndex === -1) {
    return reply.status(404).send({ error: "Room not found" });
  }

  // CASCADE delete: Remove all housekeeping tasks for this room
  const tasks = cache.get<HousekeepingTask[]>(HOUSEKEEPING_TASKS_KEY) || [];
  const filteredTasks = tasks.filter(t => t.roomId !== request.params.id);
  cache.set(HOUSEKEEPING_TASKS_KEY, filteredTasks);

  const deletedRoom = rooms.splice(roomIndex, 1)[0];
  cache.set(ROOMS_KEY, rooms);

  return { success: true, room: deletedRoom };
});

// ==================== HOUSEKEEPING TASKS ====================

// Get all housekeeping tasks with optional filters
fastify.get<{ Querystring: { date?: string; startDate?: string; endDate?: string; status?: string; userId?: string } }>("/housekeeping-tasks", async (request) => {
  let tasks = cache.get<HousekeepingTask[]>(HOUSEKEEPING_TASKS_KEY) || [];
  const rooms = cache.get<Room[]>(ROOMS_KEY) || [];
  const users = cache.get<User[]>(USERS_KEY) || [];

  // Apply filters
  const { date, startDate, endDate, status, userId } = request.query;

  if (date) {
    // Legacy single-date filter
    tasks = tasks.filter(t => t.taskDate === date);
  } else if (startDate && endDate) {
    // Date range filter: return tasks that overlap with the range
    // Task overlaps if: task.startDateTime <= rangeEnd AND task.endDateTime >= rangeStart
    const rangeStart = new Date(startDate + 'T00:00:00Z');
    const rangeEnd = new Date(endDate + 'T23:59:59Z');

    tasks = tasks.filter(t => {
      const taskStart = t.startDateTime ? new Date(t.startDateTime) : new Date(t.taskDate + 'T00:00:00Z');
      const taskEnd = t.endDateTime ? new Date(t.endDateTime) : new Date(t.taskDate + 'T23:59:59Z');

      return taskStart <= rangeEnd && taskEnd >= rangeStart;
    });
  }

  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }

  if (userId) {
    tasks = tasks.filter(t => t.assignedUserId === userId);
  }

  // Join with rooms and users to populate names
  const tasksWithDetails = tasks.map(task => {
    const room = rooms.find(r => r.id === task.roomId);
    const user = users.find(u => u.id === task.assignedUserId);
    return {
      ...task,
      roomNumber: room?.roomNumber,
      assignedUserName: user?.name
    };
  });

  return { tasks: tasksWithDetails };
});

// Get housekeeping task by ID
fastify.get<{ Params: { id: string } }>("/housekeeping-tasks/:id", async (request, reply) => {
  const tasks = cache.get<HousekeepingTask[]>(HOUSEKEEPING_TASKS_KEY) || [];
  const task = tasks.find(t => t.id === request.params.id);

  if (!task) {
    return reply.status(404).send({ error: "Housekeeping task not found" });
  }

  // Populate room and user names
  const rooms = cache.get<Room[]>(ROOMS_KEY) || [];
  const users = cache.get<User[]>(USERS_KEY) || [];
  const room = rooms.find(r => r.id === task.roomId);
  const user = users.find(u => u.id === task.assignedUserId);

  return {
    task: {
      ...task,
      roomNumber: room?.roomNumber,
      assignedUserName: user?.name
    }
  };
});

// Create new housekeeping task
fastify.post<{ Body: Omit<HousekeepingTask, 'id' | 'createdAt' | 'updatedAt' | 'roomNumber' | 'assignedUserName' | 'startedAt' | 'completedAt'> }>("/housekeeping-tasks", async (request, reply) => {
  const { roomId, assignedUserId, taskDate, startDateTime, endDateTime, taskType, priority, status, notes } = request.body;

  // Validation
  if (!roomId || !assignedUserId) {
    return reply.status(400).send({ error: "Room and assigned user are required" });
  }

  // Require either taskDate (legacy) or startDateTime+endDateTime
  if (!taskDate && !startDateTime) {
    return reply.status(400).send({ error: "Either taskDate or startDateTime is required" });
  }

  // Validate roomId exists
  const rooms = cache.get<Room[]>(ROOMS_KEY) || [];
  if (!rooms.some(r => r.id === roomId)) {
    return reply.status(400).send({ error: "Invalid room ID" });
  }

  // Validate assignedUserId exists and is a staff member
  const users = cache.get<User[]>(USERS_KEY) || [];
  const assignedUser = users.find(u => u.id === assignedUserId);
  if (!assignedUser) {
    return reply.status(400).send({ error: "Invalid user ID" });
  }
  if (assignedUser.role !== 'staff') {
    return reply.status(400).send({ error: "Only staff members can be assigned to housekeeping tasks" });
  }

  // Process date/time fields for backward compatibility
  let finalTaskDate: string;
  let finalStartDateTime: string | undefined;
  let finalEndDateTime: string | undefined;

  if (startDateTime || endDateTime) {
    // New format provided - use provided values or derive from the other
    const start = startDateTime || endDateTime!;
    const end = endDateTime || startDateTime!;

    finalStartDateTime = start.includes('T') ? start : `${start}T12:00:00Z`;
    finalEndDateTime = end.includes('T') ? end : `${end}T23:59:59Z`;
    finalTaskDate = finalStartDateTime.split('T')[0];

    // Validate end >= start
    if (new Date(finalEndDateTime) < new Date(finalStartDateTime)) {
      return reply.status(400).send({ error: "End date/time must be after start date/time" });
    }
  } else if (taskDate) {
    // Legacy format - convert to new format
    finalTaskDate = taskDate;
    finalStartDateTime = `${taskDate}T12:00:00Z`;
    finalEndDateTime = `${taskDate}T23:59:59Z`;
  } else {
    // This should never happen due to validation above, but TypeScript needs it
    return reply.status(400).send({ error: "Either taskDate or startDateTime/endDateTime is required" });
  }

  const tasks = cache.get<HousekeepingTask[]>(HOUSEKEEPING_TASKS_KEY) || [];

  const newTask: HousekeepingTask = {
    id: Date.now().toString(),
    roomId,
    assignedUserId,
    taskDate: finalTaskDate,
    startDateTime: finalStartDateTime,
    endDateTime: finalEndDateTime,
    taskType: taskType || 'cleaning',
    priority: priority || 'medium',
    status: status || 'pending',
    notes,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  cache.set(HOUSEKEEPING_TASKS_KEY, tasks);

  // Populate room and user names for response
  const room = rooms.find(r => r.id === roomId);
  const user = users.find(u => u.id === assignedUserId);

  return {
    success: true,
    task: {
      ...newTask,
      roomNumber: room?.roomNumber,
      assignedUserName: user?.name
    }
  };
});

// Update housekeeping task
fastify.put<{ Params: { id: string }, Body: Partial<Omit<HousekeepingTask, 'id' | 'createdAt' | 'roomNumber' | 'assignedUserName'>> }>("/housekeeping-tasks/:id", async (request, reply) => {
  const tasks = cache.get<HousekeepingTask[]>(HOUSEKEEPING_TASKS_KEY) || [];
  const taskIndex = tasks.findIndex(t => t.id === request.params.id);

  if (taskIndex === -1) {
    return reply.status(404).send({ error: "Housekeeping task not found" });
  }

  const { roomId, assignedUserId, taskDate, startDateTime, endDateTime, taskType, priority, status, notes, startedAt, completedAt } = request.body;

  // Validate roomId if provided
  if (roomId) {
    const rooms = cache.get<Room[]>(ROOMS_KEY) || [];
    if (!rooms.some(r => r.id === roomId)) {
      return reply.status(400).send({ error: "Invalid room ID" });
    }
  }

  // Validate assignedUserId if provided
  if (assignedUserId) {
    const users = cache.get<User[]>(USERS_KEY) || [];
    const assignedUser = users.find(u => u.id === assignedUserId);
    if (!assignedUser) {
      return reply.status(400).send({ error: "Invalid user ID" });
    }
    if (assignedUser.role !== 'staff') {
      return reply.status(400).send({ error: "Only staff members can be assigned to housekeeping tasks" });
    }
  }

  // Process date/time fields for backward compatibility
  let finalTaskDate: string | undefined;
  let finalStartDateTime: string | undefined;
  let finalEndDateTime: string | undefined;

  if (startDateTime !== undefined || endDateTime !== undefined) {
    // If either is provided, process both
    const newStart = startDateTime || tasks[taskIndex].startDateTime;
    const newEnd = endDateTime || tasks[taskIndex].endDateTime;

    if (newStart && newEnd) {
      finalStartDateTime = newStart.includes('T') ? newStart : `${newStart}T12:00:00Z`;
      finalEndDateTime = newEnd.includes('T') ? newEnd : `${newEnd}T12:00:00Z`;
      finalTaskDate = finalStartDateTime.split('T')[0];

      // Validate end >= start
      if (new Date(finalEndDateTime) < new Date(finalStartDateTime)) {
        return reply.status(400).send({ error: "End date/time must be after start date/time" });
      }
    }
  } else if (taskDate !== undefined) {
    // Legacy format - convert to new format
    finalTaskDate = taskDate;
    finalStartDateTime = `${taskDate}T12:00:00Z`;
    finalEndDateTime = `${taskDate}T23:59:59Z`;
  }

  // Handle status transitions
  let autoStartedAt = tasks[taskIndex].startedAt;
  let autoCompletedAt = tasks[taskIndex].completedAt;

  if (status === 'in_progress' && !tasks[taskIndex].startedAt) {
    autoStartedAt = new Date().toISOString();
  }

  if (status === 'completed' && !tasks[taskIndex].completedAt) {
    autoCompletedAt = new Date().toISOString();
  }

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...(roomId && { roomId }),
    ...(assignedUserId && { assignedUserId }),
    ...(finalTaskDate && { taskDate: finalTaskDate }),
    ...(finalStartDateTime && { startDateTime: finalStartDateTime }),
    ...(finalEndDateTime && { endDateTime: finalEndDateTime }),
    ...(taskType && { taskType }),
    ...(priority && { priority }),
    ...(status && { status }),
    ...(notes !== undefined && { notes }),
    ...(startedAt !== undefined && { startedAt }),
    ...(completedAt !== undefined && { completedAt }),
    ...(autoStartedAt && { startedAt: autoStartedAt }),
    ...(autoCompletedAt && { completedAt: autoCompletedAt }),
    updatedAt: new Date().toISOString()
  };

  cache.set(HOUSEKEEPING_TASKS_KEY, tasks);

  // Populate room and user names for response
  const rooms = cache.get<Room[]>(ROOMS_KEY) || [];
  const users = cache.get<User[]>(USERS_KEY) || [];
  const room = rooms.find(r => r.id === tasks[taskIndex].roomId);
  const user = users.find(u => u.id === tasks[taskIndex].assignedUserId);

  return {
    success: true,
    task: {
      ...tasks[taskIndex],
      roomNumber: room?.roomNumber,
      assignedUserName: user?.name
    }
  };
});

// Delete housekeeping task
fastify.delete<{ Params: { id: string } }>("/housekeeping-tasks/:id", async (request, reply) => {
  const tasks = cache.get<HousekeepingTask[]>(HOUSEKEEPING_TASKS_KEY) || [];
  const taskIndex = tasks.findIndex(t => t.id === request.params.id);

  if (taskIndex === -1) {
    return reply.status(404).send({ error: "Housekeeping task not found" });
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];
  cache.set(HOUSEKEEPING_TASKS_KEY, tasks);

  return { success: true, task: deletedTask };
});

const port = parseInt(process.env.PORT || "3000", 10);

const start = async () => {
  try {
    await fastify.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
