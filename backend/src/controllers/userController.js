const prisma = require('../lib/prisma');

const getMe = async (req, res) => {
  const { password, ...user } = req.user;
  res.json(user);
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    res.json(users);
  } catch (err) { next(err); }
};

module.exports = { getMe, getAllUsers };
