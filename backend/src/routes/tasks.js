const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { updateTask, deleteTask, getDashboard } = require('../controllers/taskController');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', getDashboard);

router.put('/:id', [
  body('title').optional().trim().notEmpty(),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
], updateTask);

router.delete('/:id', deleteTask);

module.exports = router;
