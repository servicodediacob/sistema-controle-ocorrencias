/*
  Warnings:

  - You are about to drop the column `role` on the `usuarios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "role",
ADD COLUMN     "perfil" "Role" NOT NULL DEFAULT 'user';
