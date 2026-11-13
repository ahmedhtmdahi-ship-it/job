CREATE TABLE "Opportunity" (
 "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "sourceId" TEXT NOT NULL, "externalId" TEXT NOT NULL, "canonicalUrl" TEXT NOT NULL, "url" TEXT,
 "title" TEXT NOT NULL, "description" TEXT NOT NULL, "company" TEXT,
 "budgetMin" DOUBLE PRECISION CHECK ("budgetMin">=0), "budgetMax" DOUBLE PRECISION CHECK ("budgetMax">=0), "currency" TEXT,
 "jobType" TEXT NOT NULL CHECK ("jobType" IN ('freelance','remote_job')), "postedAt" TIMESTAMP(3), "bidsCount" INTEGER CHECK ("bidsCount">=0),
 "skills" TEXT[] NOT NULL, "country" TEXT, "language" TEXT NOT NULL CHECK ("language" IN ('ar','en')),
 "disposition" TEXT NOT NULL DEFAULT 'new' CHECK ("disposition" IN ('new','saved','skipped')),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "Opportunity_userId_sourceId_canonicalUrl_key" ON "Opportunity"("userId","sourceId","canonicalUrl");
CREATE UNIQUE INDEX "Opportunity_userId_canonicalUrl_key" ON "Opportunity"("userId","canonicalUrl");
CREATE INDEX "Opportunity_userId_disposition_postedAt_idx" ON "Opportunity"("userId","disposition","postedAt");
CREATE TABLE "SourceRun" (
 "id" TEXT PRIMARY KEY,"userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,"sourceId" TEXT NOT NULL,
 "status" TEXT NOT NULL CHECK ("status" IN ('ok','blocked','failed','parser_error')), "reason" TEXT,
 "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "itemCount" INTEGER NOT NULL DEFAULT 0,"cached" BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX "SourceRun_userId_sourceId_startedAt_idx" ON "SourceRun"("userId","sourceId","startedAt");
CREATE TABLE "OpportunityPreference" (
 "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
 "minimumBudget" DOUBLE PRECISION CHECK ("minimumBudget">=0),"currency" TEXT NOT NULL DEFAULT 'USD',"language" TEXT NOT NULL DEFAULT 'ar' CHECK ("language" IN ('ar','en')),
 "dailyRefresh" BOOLEAN NOT NULL DEFAULT FALSE,"nextRefreshAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "refreshLeaseUntil" TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01'
);
CREATE INDEX "OpportunityPreference_dailyRefresh_nextRefreshAt_idx" ON "OpportunityPreference"("dailyRefresh","nextRefreshAt");
CREATE TABLE "SourceCache" ("id" TEXT PRIMARY KEY, "sourceId" TEXT NOT NULL UNIQUE,"nextFetchAt" TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01',"fetchedAt" TIMESTAMP(3),"status" TEXT NOT NULL DEFAULT 'blocked',"payload" JSONB);
