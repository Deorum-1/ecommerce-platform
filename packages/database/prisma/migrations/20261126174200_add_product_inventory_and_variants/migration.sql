ALTER TABLE "Product"
ADD COLUMN "inventoryQuantity" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(12,2),
    "inventoryQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductVariant_tenantId_id_key"
ON "ProductVariant"("tenantId", "id");

CREATE UNIQUE INDEX "ProductVariant_tenantId_sku_key"
ON "ProductVariant"("tenantId", "sku");

CREATE INDEX "ProductVariant_tenantId_idx"
ON "ProductVariant"("tenantId");

CREATE INDEX "ProductVariant_tenantId_productId_idx"
ON "ProductVariant"("tenantId", "productId");

ALTER TABLE "ProductVariant"
ADD CONSTRAINT "ProductVariant_tenantId_productId_fkey"
FOREIGN KEY ("tenantId", "productId")
REFERENCES "Product"("tenantId", "id")
ON DELETE CASCADE ON UPDATE CASCADE;
