const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../utils/activityLogger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, loginId: true, number: true, role: true, pages: true, isActive: true, createdAt: true, updatedAt: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, loginId: true, number: true, role: true, pages: true, isActive: true, createdAt: true, updatedAt: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { name, loginId, number, password, role, pages } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        loginId,
        number,
        password: hashedPassword,
        role: role.toUpperCase(),
        pages,
      },
    });
    // Exclude password from log
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    await logActivity(req.user.userId, req.user.name, 'CREATE', 'User', user.id, null, userWithoutPassword);
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...otherData } = req.body;
    let dataToUpdate = { ...otherData };

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }
    if (dataToUpdate.role) {
      dataToUpdate.role = dataToUpdate.role.toUpperCase();
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: dataToUpdate,
    });

    // Exclude password from log
    const existingUserWithoutPassword = { ...existingUser };
    delete existingUserWithoutPassword.password;
    const updatedUserWithoutPassword = { ...updatedUser };
    delete updatedUserWithoutPassword.password;

    await logActivity(req.user.userId, req.user.name, 'UPDATE', 'User', updatedUser.id, existingUserWithoutPassword, updatedUserWithoutPassword);
    res.json(updatedUserWithoutPassword);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({
      where: { id: req.params.id },
    });
    // Exclude password from log
    const existingUserWithoutPassword = { ...existingUser };
    delete existingUserWithoutPassword.password;
    await logActivity(req.user.userId, req.user.name, 'DELETE', 'User', req.params.id, existingUserWithoutPassword, null);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
