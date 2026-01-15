const express = require("express");
const { PrismaClient, UserRole } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { logActivity } = require("../utils/activityLogger");
const { paginate } = require("../utils/pagination");
const multer = require("multer");
const xlsx = require("xlsx");

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
const prisma = new PrismaClient();

// Get all users (with optional role filtering and pagination)
router.get("/", async (req, res) => {
  try {
    const { role } = req.query;
    let where = {};

    // Filter for sub-admin roles if requested
    if (role === "subadmin") {
      where = {
        role: {
          in: [UserRole.MANAGER, UserRole.DATA_FEEDER, UserRole.SUPERVISOR],
        },
      };
    }

    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = 10;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        loginId: true,
        number: true,
        role: true,
        password: true,
        pages: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const paginatedData = paginate(users, page, pageSize);
    res.json(paginatedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/bulk-upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const requiredFields = [
      "name",
      "loginId",
      "number",
      "password",
      "role",
      "pages",
    ];
    const createdUsers = [];

    for (const item of data) {
      // Validation
      for (const field of requiredFields) {
        if (item[field] === undefined || item[field] === null) {
          // Skip row if required field is missing, or return error
          console.warn(`Skipping row due to missing field '${field}':`, item);
          continue; // Or return a more specific error
        }
      }

      // Hashing password
      const hashedPassword = await bcrypt.hash(item.password.toString(), 10);

      // Parsing pages
      let pagesJson;
      try {
        pagesJson = JSON.parse(item.pages);
      } catch (e) {
        console.warn(
          `Skipping row due to invalid JSON in 'pages' field:`,
          item
        );
        continue;
      }

      const user = await prisma.user.create({
        data: {
          name: item.name,
          loginId: item.loginId,
          number: item.number.toString(),
          password: hashedPassword,
          role: item.role.toUpperCase(),
          pages: pagesJson,
        },
      });

      const { password, ...userWithoutPassword } = user;
      createdUsers.push(userWithoutPassword);
    }

    res.status(201).json({ message: "Bulk upload completed.", createdUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        loginId: true,
        number: true,
        role: true,
        pages: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post("/", async (req, res) => {
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
    await logActivity(
      req.user.userId,
      req.user.name,
      "CREATE",
      "User",
      user.id,
      null,
      userWithoutPassword
    );
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user
router.put("/:id", async (req, res) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, ...otherData } = req.body;
    let dataToUpdate = { ...otherData };
    if (password && password !== existingUser.password) {
      const isSamePassword = await bcrypt.compare(
        password,
        existingUser.password
      );
      if (!isSamePassword) {
        dataToUpdate.password = await bcrypt.hash(password, 10);
      }
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

    await logActivity(
      req.user.userId,
      req.user.name,
      "UPDATE",
      "User",
      updatedUser.id,
      existingUserWithoutPassword,
      updatedUserWithoutPassword
    );
    res.json(updatedUserWithoutPassword);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.user.delete({
      where: { id: req.params.id },
    });
    // Exclude password from log
    const existingUserWithoutPassword = { ...existingUser };
    delete existingUserWithoutPassword.password;
    await logActivity(
      req.user.userId,
      req.user.name,
      "DELETE",
      "User",
      req.params.id,
      existingUserWithoutPassword,
      null
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
