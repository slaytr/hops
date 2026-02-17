import { db } from "../db.js";
import { Op } from "sequelize";

export interface CreateTaskData {
  roomId?: string;
  staffId?: string;
  taskDate?: string;
  duration?: number;
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
      // Task overlaps range if: taskDate <= rangeEnd AND taskDate + duration - 1 >= rangeStart
      // We fetch tasks where taskDate is within an extended range, then filter precisely
      const tasks = await db.models.Task.findAll({
        where: {
          ...(status ? { status } : {}),
          ...(staffId ? { staffId } : {}),
        },
        include: [
          { model: db.models.Room, attributes: ['roomNumber'] },
          { model: db.models.Staff, as: 'assignedStaff', attributes: ['firstName', 'lastName'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      return tasks.filter((t: any) => {
        const taskDate = t.taskDate;
        if (!taskDate) return false;
        const duration = t.duration || 1;

        // Task occupies dates: [taskDate, taskDate + duration - 1]
        const taskStart = new Date(`${taskDate}T00:00:00`);
        const taskEnd = new Date(taskStart);
        taskEnd.setDate(taskEnd.getDate() + duration - 1);

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

    // Validate duration
    const duration = data.duration ?? 1;
    if (duration < 1) {
      throw new Error("Duration must be at least 1 day");
    }

    const task = await db.models.Task.create({
      roomId: data.roomId || null,
      staffId: data.staffId || null,
      taskDate: data.taskDate || null,
      duration,
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

    if (data.taskDate !== undefined) updates.taskDate = data.taskDate;
    if (data.duration !== undefined) {
      if (data.duration < 1) {
        throw new Error("Duration must be at least 1 day");
      }
      updates.duration = data.duration;
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
