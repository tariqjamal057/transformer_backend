/*
  Warnings:

  - You are about to drop the column `doneBy` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `doneByName` on the `activity_logs` table. All the data in the column will be lost.
  - Added the required column `doneByUserId` to the `activity_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "activity_logs" DROP COLUMN "doneBy",
DROP COLUMN "doneByName",
ADD COLUMN     "doneByUserId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_doneByUserId_fkey" FOREIGN KEY ("doneByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
