const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const logActivity = async (doneByUserId, type, modelName, recordId, before, after) => {
  try {
    await prisma.activityLog.create({
      data: {
        doneByUserId: doneByUserId,
        type: type, // 'CREATE', 'UPDATE', 'DELETE'
        modelName: modelName,
        recordId: recordId,
        before: before, // Prisma handles JSON directly
        after: after, // Prisma handles JSON directly
      },
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = { logActivity };
