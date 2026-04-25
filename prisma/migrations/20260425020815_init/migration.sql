-- CreateTable
CREATE TABLE "FuneralHome" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "dataSource" TEXT NOT NULL DEFAULT 'SELF_REPORTED',
    "lat" REAL,
    "lng" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "funeralHomeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL,
    "priceMin" REAL,
    "priceMax" REAL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Service_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "FuneralHome" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GplRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "funeralHomeId" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "emailSentAt" DATETIME,
    "responseReceivedAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GplRequest_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "FuneralHome" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScraperJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "funeralHomeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "lastRun" DATETIME,
    "results" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScraperJob_funeralHomeId_fkey" FOREIGN KEY ("funeralHomeId") REFERENCES "FuneralHome" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
