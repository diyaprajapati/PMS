/*
  Warnings:

  - A unique constraint covering the columns `[projectId,title]` on the table `Sprint` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Sprint_title_key";

-- CreateIndex
CREATE UNIQUE INDEX "Sprint_projectId_title_key" ON "Sprint"("projectId", "title");
