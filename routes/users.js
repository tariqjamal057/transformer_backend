const express = require("express");
const { PrismaClient, UserRole } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { logActivity } = require("../utils/activityLogger");
const { paginate } = require("../utils/pagination");
const multer = require("multer");
const xlsx = require("xlsx");
const auth = require("../middleware/auth");

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
const prisma = new PrismaClient();

// Get all users (with optional role filtering and pagination)
router.get("/", auth, async (req, res) => {
  try {
    const { role, supplyTenderId } = req.query;
    let where = {};

    // Filter for sub-admin roles if requested
    if (role === "subadmin") {
      where = {
        role: {
          in: [UserRole.MANAGER, UserRole.DATA_FEEDER, UserRole.SUPERVISOR],
        },
        supplyTenderId: supplyTenderId,
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

router.post("/bulk-upload", upload.single("file"), auth, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: "The uploaded file is empty." });
    }

    const dataWithRows = data.map((row, index) => ({
      ...row,
      __rowNum: index + 2, // Excel rows are 1-based, plus 1 for the header
    }));

    const parsedUsers = [];
    const invalidRecords = [];
    const existingLoginIds = new Set(
      (await prisma.user.findMany({ select: { loginId: true } })).map(
        (u) => u.loginId,
      ),
    );
    const loginIdsInThisUpload = new Set();

    for (const item of dataWithRows) {
      const errorsForUser = [];
      const userLoginId = String(item.loginId).trim();
      const userRole = String(item.role).toUpperCase().trim();

      // Required field validation
      const requiredFields = [
        "name",
        "loginId",
        "number",
        "password",
        "role",
        "pages",
      ];
      for (const field of requiredFields) {
        if (!item[field] || String(item[field]).trim().length === 0) {
          errorsForUser.push(`'${field}' is a required field.`);
        }
      }

      // LoginId uniqueness check
      if (userLoginId && existingLoginIds.has(userLoginId)) {
        errorsForUser.push(`Login ID '${userLoginId}' already exists.`);
      }
      if (userLoginId && loginIdsInThisUpload.has(userLoginId)) {
        errorsForUser.push(
          `Login ID '${userLoginId}' is duplicated within the uploaded file.`,
        );
      } else if (userLoginId) {
        loginIdsInThisUpload.add(userLoginId);
      }

      // Role validation
      if (userRole && !Object.values(UserRole).includes(userRole)) {
        errorsForUser.push(`Role '${item.role}' is not a valid user role.`);
      }

      // Pages parsing
      let pagesArray = [];
      if (item.pages) {
        pagesArray = String(item.pages)
          .split(",")
          .map((page) => page.trim())
          .filter((page) => page.length > 0);
      }

      if (errorsForUser.length > 0) {
        invalidRecords.push({
          loginId: userLoginId || "N/A",
          row: item.__rowNum,
          errors: errorsForUser,
        });
        continue;
      }

      // If no errors, hash password and prepare for creation
      const hashedPassword = await bcrypt.hash(String(item.password), 10);

      parsedUsers.push({
        name: String(item.name).trim(),
        loginId: userLoginId,
        number: String(item.number).trim(),
        password: hashedPassword,
        role: userRole,
        pages: pagesArray,
      });
    }

    if (invalidRecords.length > 0) {
      return res.status(400).json({
        error: "Bulk upload failed due to invalid data.",
        details: invalidRecords,
      });
    }

    if (parsedUsers.length === 0) {
      return res.status(400).json({ error: "No valid users to upload." });
    }

    const createdUsers = await prisma.user.createMany({
      data: parsedUsers,
      skipDuplicates: true, // Prisma will skip if loginId is unique but somehow already exists (though checked above)
    });
    await logActivity(
      req.user.userId,
      "CREATE",
      "User",
      null,
      null,
      createdUsers,
    );

    res.status(201).json({ message: "Bulk upload completed.", createdUsers });
  } catch (error) {
    console.error("Bulk upload error:", error);
    res.status(500).json({
      error: "Something went wrong during bulk upload",
      details: error.message,
    });
  }
});

// Get user by ID
router.get("/:id", auth, async (req, res) => {
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
router.post("/", auth, async (req, res) => {
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
      "CREATE",
      "User",
      user.id,
      null,
      userWithoutPassword,
    );
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// Update user
router.put("/:id", auth, async (req, res) => {
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
        existingUser.password,
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
      "UPDATE",
      "User",
      updatedUser.id,
      existingUserWithoutPassword,
      updatedUserWithoutPassword,
    );
    res.json(updatedUserWithoutPassword);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user
router.delete("/:id", auth, async (req, res) => {
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
      "DELETE",
      "User",
      req.params.id,
      existingUserWithoutPassword,
      null,
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
