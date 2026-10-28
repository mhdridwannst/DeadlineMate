/*
  Warnings:

  - You are about to drop the `FocusSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FocusSession" DROP CONSTRAINT "FocusSession_taskId_fkey";

-- DropForeignKey
ALTER TABLE "FocusSession" DROP CONSTRAINT "FocusSession_userId_fkey";

-- DropTable
DROP TABLE "FocusSession";
