const express = require('express');
const { body } = require('express-validator');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');
const {
  listProjects, createProject, getProject,
  updateProject, deleteProject, addMember, removeMember
} = require('../controllers/projectController');
const { getProjectTasks, createTask } = require('../controllers/taskController');

const router = express.Router();

router.use(authenticate);

router.get('/', listProjects);

router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required'),
], createProject);

router.get('/:id', getProject);

router.put('/:id', [
  body('name').optional().trim().notEmpty(),
  requireProjectAdmin
], updateProject);

router.delete('/:id', requireProjectAdmin, deleteProject);

// Member management
router.post('/:id/members', requireProjectAdmin, [
  body('userId').notEmpty().withMessage('userId is required'),
], addMember);

router.delete('/:id/members/:userId', requireProjectAdmin, removeMember);

// Tasks under a project
router.get('/:id/tasks', requireProjectMember, getProjectTasks);

router.post('/:id/tasks', requireProjectAdmin, [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
], createTask);

module.exports = router;
