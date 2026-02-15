import { db } from "../db.js";

export interface CreateTaskData {
  roomId?: string;
  staffId?: string;
  taskDate?: string;
  startDateTime?: string;
  endDateTime?: string;
  taskType?: string;
  priority?: string;
  status?: string;
  notes?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  startedAt?: string;
  completedAt?: string;
}

export interface TaskFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  staffId?: string;
}

export class TasksService {
  async getAll(filters: TaskFilters = {}) {
    const { date, startDate, endDate, status, staffId } = filters;

    const where: any = {};

    if (date) {
      where.taskDate = date;
    } else if (startDate && endDate) {
      // For date range, fetch all and filter in application layer
      const tasks = await db.models.Task.findAll({
        where: status ? { status } : {},
        include: [
          { model: db.models.Room, attributes: ['roomNumber'] },
          { model: db.models.Staff, as: 'assignedStaff', attributes: ['firstName', 'lastName'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      return tasks.filter((t: any) => {
        const taskStart = t.startDateTime || new Date(`${t.taskDate}T12:00:00`);
        const taskEnd = t.endDateTime || new Date(`${t.taskDate}T23:59:59`);
        const rangeStart = new Date(`${startDate}T00:00:00`);
        const rangeEnd = new Date(`${endDate}T23:59:59`);

        return taskStart <= rangeEnd && taskEnd >= rangeStart;
      });
    }

    if (status) where.status = status;
    if (staffId) where.staffId = staffId;

    return db.models.Task.findAll({
      where,
      include: [
        { model: db.models.Room, attributes: ['roomNumber'] },
        { model: db.models.Staff, as: 'assignedStaff', attributes: ['firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  async getById(id: string) {
    return db.models.Task.findByPk(id, {
      include: [
        { model: db.models.Room, attributes: ['roomNumber'] },
        { model: db.models.Staff, as: 'assignedStaff', attributes: ['firstName', 'lastName'] }
      ]
    });
  }

  async create(data: CreateTaskData) {
    // Validate roomId if provided
    if (data.roomId) {
      const room = await db.models.Room.findByPk(data.roomId);
      if (!room) {
        throw new Error("Invalid room ID");
      }
    }

    // Validate staffId if provided
    if (data.staffId) {
      const assignedStaff = await db.models.Staff.findByPk(data.staffId);
      if (!assignedStaff) {
        throw new Error("Invalid staff ID");
      }
    }

    // Process date/time fields
    let finalTaskDate: string | null = null;
    let finalStartDateTime: Date | null = null;
    let finalEndDateTime: Date | null = null;

    if (data.startDateTime || data.endDateTime) {
      const start = data.startDateTime || data.endDateTime!;
      const end = data.endDateTime || data.startDateTime!;

      finalStartDateTime = new Date(start.includes('T') ? start : `${start}T12:00:00Z`);
      finalEndDateTime = new Date(end.includes('T') ? end : `${end}T23:59:59Z`);
      finalTaskDate = finalStartDateTime.toISOString().split('T')[0];

      if (finalEndDateTime < finalStartDateTime) {
        throw new Error("End date/time must be after start date/time");
      }
    } else if (data.taskDate) {
      finalTaskDate = data.taskDate;
      finalStartDateTime = new Date(`${data.taskDate}T12:00:00Z`);
      finalEndDateTime = new Date(`${data.taskDate}T23:59:59Z`);
    }
    // If no dates provided, task will be created without dates (can be dragged onto calendar later)

    const task = await db.models.Task.create({
      roomId: data.roomId || null,
      staffId: data.staffId || null,
      taskDate: finalTaskDate,
      startDateTime: finalStartDateTime,
      endDateTime: finalEndDateTime,
      taskType: data.taskType || 'cleaning',
      priority: data.priority || 'medium',
      status: data.status || 'pending',
      notes: data.notes || null
    });

    await task.reload({
      include: [
        { model: db.models.Room, attributes: ['roomNumber'] },
        { model: db.models.Staff, as: 'assignedStaff', attributes: ['firstName', 'lastName'] }
      ]
    });

    return task;
  }

  async update(id: string, data: UpdateTaskData) {
    const task = await db.models.Task.findByPk(id);
    if (!task) return null;

    // Validate roomId if provided
    if (data.roomId) {
      const room = await db.models.Room.findByPk(data.roomId);
      if (!room) {
        throw new Error("Invalid room ID");
      }
    }

    // Validate staffId if provided
    if (data.staffId) {
      const assignedStaff = await db.models.Staff.findByPk(data.staffId);
      if (!assignedStaff) {
        throw new Error("Invalid staff ID");
      }
    }

    const updates: any = {};

    // Process date/time fields
    if (data.startDateTime !== undefined || data.endDateTime !== undefined) {
      const existingStart = task.startDateTime?.toISOString();
      const existingEnd = task.endDateTime?.toISOString();

      const newStart = data.startDateTime || existingStart;
      const newEnd = data.endDateTime || existingEnd;

      if (newStart && newEnd) {
        const finalStart = new Date(newStart.includes('T') ? newStart : `${newStart}T12:00:00Z`);
        const finalEnd = new Date(newEnd.includes('T') ? newEnd : `${newEnd}T12:00:00Z`);

        if (finalEnd < finalStart) {
          throw new Error("End date/time must be after start date/time");
        }

        updates.startDateTime = finalStart;
        updates.endDateTime = finalEnd;
        updates.taskDate = finalStart.toISOString().split('T')[0];
      }
    } else if (data.taskDate !== undefined) {
      updates.taskDate = data.taskDate;
      updates.startDateTime = new Date(`${data.taskDate}T12:00:00Z`);
      updates.endDateTime = new Date(`${data.taskDate}T23:59:59Z`);
    }

    if (data.roomId) updates.roomId = data.roomId;
    if (data.staffId) updates.staffId = data.staffId;
    if (data.taskType) updates.taskType = data.taskType;
    if (data.priority) updates.priority = data.priority;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.startedAt !== undefined) updates.startedAt = data.startedAt;
    if (data.completedAt !== undefined) updates.completedAt = data.completedAt;

    if (data.status) {
      updates.status = data.status;
      // Handle status transitions
      if (data.status === 'in_progress' && !task.startedAt) {
        updates.startedAt = new Date();
      }
      if (data.status === 'completed' && !task.completedAt) {
        updates.completedAt = new Date();
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("No fields to update");
    }

    await task.update(updates);
    await task.reload({
      include: [
        { model: db.models.Room, attributes: ['roomNumber'] },
        { model: db.models.Staff, as: 'assignedStaff', attributes: ['firstName', 'lastName'] }
      ]
    });

    return task;
  }

  async delete(id: string) {
    const task = await this.getById(id);
    if (!task) return null;

    await task.destroy();
    return task;
  }
}

export const tasksService = new TasksService();
