-- CreateEnum
CREATE TYPE "PublicationCategory" AS ENUM ('ARTICLE', 'REGULATION', 'GOVT_LETTER', 'CIRCULAR', 'PRESENTATION', 'OTHER');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "attachmentId" TEXT;

-- AlterTable
ALTER TABLE "Publication" DROP COLUMN "fileSizeBytes",
DROP COLUMN "fileUrl",
DROP COLUMN "isPublic",
DROP COLUMN "pageCount",
ADD COLUMN     "fileId" TEXT NOT NULL,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "category",
ADD COLUMN     "category" "PublicationCategory" NOT NULL DEFAULT 'OTHER',
ALTER COLUMN "publishedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "author" TEXT,
    "coverImageId" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_isPublished_publishedAt_idx" ON "BlogPost"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "Publication_category_publishedAt_idx" ON "Publication"("category", "publishedAt");

-- CreateIndex
CREATE INDEX "Publication_isPublished_publishedAt_idx" ON "Publication"("isPublished", "publishedAt");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "StoredFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "StoredFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

