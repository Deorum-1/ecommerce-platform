CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

ALTER TABLE "Tenant"
ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'NGN',
ADD COLUMN "description" TEXT,
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "website" TEXT;

CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "minimumSubtotal" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Discount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Discount_tenantId_id_key" ON "Discount"("tenantId", "id");
CREATE UNIQUE INDEX "Discount_tenantId_code_key" ON "Discount"("tenantId", "code");
CREATE INDEX "Discount_tenantId_active_idx" ON "Discount"("tenantId", "active");
