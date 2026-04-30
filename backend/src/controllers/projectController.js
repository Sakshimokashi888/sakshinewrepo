const prisma = require('../lib/prisma');
const { validationResult } = require('express-validator');

const listProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: { some: { userId: req.user.id } }
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (err) { next(err); }
};

const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: {
        name, description,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' }
        }
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } }
      }
    });
    res.status(201).json(project);
  } catch (err) { next(err); }
};

const getProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Check membership
    const isMember = project.members.some(m => m.userId === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Access denied' });

    res.json(project);
  } catch (err) { next(err); }
};

const updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { name, description }
    });
    res.json(project);
  } catch (err) { next(err); }
};

const deleteProject = async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) { next(err); }
};

const addMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { userId, role } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: req.params.id, userId } },
      create: { projectId: req.params.id, userId, role: role || 'MEMBER' },
      update: { role: role || 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.status(201).json(member);
  } catch (err) { next(err); }
};

const removeMember = async (req, res, next) => {
  try {
    const { id: projectId, userId } = req.params;
    // Can't remove project owner
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project.ownerId === userId) {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } }
    });
    res.json({ message: 'Member removed' });
  } catch (err) { next(err); }
};

module.exports = { listProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember };
