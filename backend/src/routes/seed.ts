import { FastifyInstance } from 'fastify';
import { db } from '../db.js';

export default async function seedRoutes(fastify: FastifyInstance) {
  // Endpoint to create staff and assign to tasks
  fastify.post('/seed/staff', async (request, reply) => {
    try {
      const staffUsers = [
        { email: 'maria.garcia@hops.com', firstName: 'Maria', lastName: 'Garcia', role: 'housekeeper', phone: '555-0101' },
        { email: 'john.chen@hops.com', firstName: 'John', lastName: 'Chen', role: 'housekeeper', phone: '555-0102' },
        { email: 'sarah.johnson@hops.com', firstName: 'Sarah', lastName: 'Johnson', role: 'maintenance', phone: '555-0103' },
        { email: 'david.kim@hops.com', firstName: 'David', lastName: 'Kim', role: 'housekeeper', phone: '555-0104' },
        { email: 'emily.rodriguez@hops.com', firstName: 'Emily', lastName: 'Rodriguez', role: 'front_desk', phone: '555-0105' },
      ];

      const createdStaffIds = [];

      // Create staff users
      for (const staffUser of staffUsers) {
        const [existingUser]: any = await db.query(
          'SELECT id FROM users WHERE email = ?',
          { replacements: [staffUser.email], type: db.QueryTypes.SELECT }
        );

        let userId;
        if (existingUser) {
          userId = existingUser.id;
        } else {
          const [userResult]: any = await db.query(
            `INSERT INTO users (email, password_hash, user_type, status, created_at, updated_at)
             VALUES (?, NULL, 'staff', 'active', NOW(), NOW())`,
            { replacements: [staffUser.email] }
          );
          userId = userResult;
        }

        const [existingStaff]: any = await db.query(
          'SELECT id FROM staff WHERE user_id = ?',
          { replacements: [userId], type: db.QueryTypes.SELECT }
        );

        let staffId;
        if (existingStaff) {
          staffId = existingStaff.id;
        } else {
          const [staffResult]: any = await db.query(
            `INSERT INTO staff (user_id, first_name, last_name, phone, role, department, employment_date, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'Operations', DATE_SUB(NOW(), INTERVAL 180 DAY), 'active', NOW(), NOW())`,
            { replacements: [userId, staffUser.firstName, staffUser.lastName, staffUser.phone, staffUser.role] }
          );
          staffId = staffResult;
        }

        createdStaffIds.push({ staffId, name: `${staffUser.firstName} ${staffUser.lastName}`, role: staffUser.role });
      }

      // Get ALL tasks (to reassign them to our new staff)
      const tasks: any = await db.query(
        'SELECT id, task_type FROM tasks ORDER BY id',
        { type: db.QueryTypes.SELECT }
      );

      // Assign staff to tasks (round-robin)
      const assignments = [];
      if (tasks && tasks.length > 0) {
        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];
          const staff = createdStaffIds[i % createdStaffIds.length];

          await db.query(
            'UPDATE tasks SET staff_id = ? WHERE id = ?',
            { replacements: [staff.staffId, task.id] }
          );

          assignments.push({
            taskId: task.id,
            taskType: task.task_type,
            staffName: staff.name,
            staffRole: staff.role
          });
        }
      }

      return {
        success: true,
        staffCreated: createdStaffIds.length,
        tasksAssigned: assignments.length,
        assignments
      };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({ error: error.message });
    }
  });
}
