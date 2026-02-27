/*
  Warnings:

  - You are about to drop the column `createdById` on the `Task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_createdById_fkey";

-- DropIndex
DROP INDEX "Task_createdById_idx";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "createdById";
