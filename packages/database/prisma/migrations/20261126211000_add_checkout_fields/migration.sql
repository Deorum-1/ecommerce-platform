ALTER TABLE "Order"
ADD COLUMN "customerName" TEXT,
ADD COLUMN "customerEmail" TEXT,
ADD COLUMN "customerPhone" TEXT,
ADD COLUMN "shippingAddress" TEXT,
ADD COLUMN "shippingCity" TEXT,
ADD COLUMN "shippingState" TEXT,
ADD COLUMN "paymentReference" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "inventoryReleasedAt" TIMESTAMP(3);

ALTER TABLE "OrderItem"
ADD COLUMN "productName" TEXT,
ADD COLUMN "variantId" TEXT,
ADD COLUMN "variantName" TEXT,
ADD COLUMN "sku" TEXT;

CREATE UNIQUE INDEX "Order_paymentReference_key" ON "Order"("paymentReference");
CREATE INDEX "Order_tenantId_status_expiresAt_idx"
ON "Order"("tenantId", "status", "expiresAt");
CREATE INDEX "OrderItem_tenantId_variantId_idx"
ON "OrderItem"("tenantId", "variantId");
