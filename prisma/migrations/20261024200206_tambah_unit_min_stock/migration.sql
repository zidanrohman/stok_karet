-- AlterTable
ALTER TABLE "products" ADD COLUMN     "min_stock" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'pcs';
