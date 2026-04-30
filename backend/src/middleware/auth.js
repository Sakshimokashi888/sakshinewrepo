const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireProjectAdmin = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } }
    });
    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Project admin access required' });
    }
    req.projectMember = member;
    next();
  } catch (err) {
    next(err);
  }
};

const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId;
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } }
    });
    if (!member) {
      return res.status(403).json({ error: 'Project membership required' });
    }
    req.projectMember = member;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireAdmin, requireProjectAdmin, requireProjectMember };
