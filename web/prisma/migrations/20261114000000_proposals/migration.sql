CREATE TABLE "Proposal" (
 "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "opportunityId" TEXT NOT NULL,
 "draft" TEXT NOT NULL DEFAULT '', "language" TEXT NOT NULL CHECK ("language" IN ('ar','en')),
 "score" DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK ("score" BETWEEN 0 AND 100),
 "summary" TEXT NOT NULL DEFAULT '', "risks" TEXT[] NOT NULL,
 "suggestedPrice" DOUBLE PRECISION NOT NULL DEFAULT 20 CHECK ("suggestedPrice" >= 0),
 "currency" TEXT NOT NULL DEFAULT 'USD', "platform" TEXT NOT NULL,
 "profileHash" TEXT NOT NULL DEFAULT '', "unsupportedClaims" JSONB NOT NULL DEFAULT '[]',
 "reviewStatus" TEXT NOT NULL DEFAULT 'pending' CHECK ("reviewStatus" IN ('pending','passed','blocked')),
 "version" INTEGER NOT NULL DEFAULT 0, "leaseUntil" TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01',
 "appliedAt" TIMESTAMP(3), "jobId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Proposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "Proposal_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "Proposal_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Proposal_opportunityId_key" ON "Proposal"("opportunityId");
CREATE UNIQUE INDEX "Proposal_jobId_key" ON "Proposal"("jobId");
CREATE INDEX "Proposal_userId_updatedAt_idx" ON "Proposal"("userId","updatedAt");
CREATE TABLE "ProposalPriceFloor" (
 "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "platform" TEXT NOT NULL,
 "minimum" DOUBLE PRECISION NOT NULL DEFAULT 20 CHECK ("minimum" >= 0),
 "currency" TEXT NOT NULL DEFAULT 'USD', "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "ProposalPriceFloor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ProposalPriceFloor_userId_platform_key" ON "ProposalPriceFloor"("userId","platform");
ALTER TABLE "AiCall" ADD COLUMN "proposalId" TEXT;
ALTER TABLE "AiCall" ADD CONSTRAINT "AiCall_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
