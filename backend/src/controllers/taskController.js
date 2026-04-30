const prisma = require('../lib/prisma');
const { validationResult } = require('express-validator');

const getProjectTasks = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const { status, priority, assigneeId } = req.query;

    const where = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) { next(err); }
};

const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id: projectId } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    // Verify assignee is a project member
    if (assigneeId) {
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: assigneeId } }
      });
      if (!member) return res.status(400).json({ error: 'Assignee must be a project member' });
    }

    const task = await prisma.task.create({
      data: {
        title, description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        createdById: req.user.id
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });
    res.status(201).json(task);
  } catch (err) { next(err); }
};

const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
    });
    if (!member) return res.status(403).json({ error: 'Not a project member' });

    // Members can only update status of their own tasks
    if (member.role !== 'ADMIN' && task.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Only admins or task assignees can update this task' });
    }

    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined && member.role === 'ADMIN') updateData.priority = priority;
    if (dueDate !== undefined && member.role === 'ADMIN') updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined && member.role === 'ADMIN') updateData.assigneeId = assigneeId || null;

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } }
      }
    });
    res.json(updated);
  } catch (err) { next(err); }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: req.user.id } }
    });
    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required to delete tasks' });
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
};

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const [totalTasks, myTasks, overdueTasks, byStatus, recentTasks, projectCount] = await Promise.all([
      prisma.task.count({ where: { project: { members: { some: { userId } } } } }),
      prisma.task.count({ where: { assigneeId: userId } }),
      prisma.task.count({
        where: {
          assigneeId: userId,
          dueDate: { lt: now },
          status: { not: 'DONE' }
        }
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { project: { members: { some: { userId } } } },
        _count: { status: true }
      }),
      prisma.task.findMany({
        where: { project: { members: { some: { userId } } } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } }
        }
      }),
      prisma.projectMember.count({ where: { userId } })
    ]);

    const statusMap = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    byStatus.forEach(s => { statusMap[s.status] = s._count.status; });

    res.json({
      totalTasks,
      myTasks,
      overdueTasks,
      projectCount,
      byStatus: statusMap,
      recentTasks
    });
  } catch (err) { next(err); }
};

module.exports = { getProjectTasks, createTask, updateTask, deleteTask, getDashboard };
