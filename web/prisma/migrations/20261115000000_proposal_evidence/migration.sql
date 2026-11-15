ALTER TABLE "Proposal" ADD COLUMN "sentences" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Proposal" ADD COLUMN "userConfirmed" BOOLEAN NOT NULL DEFAULT false;
-- Pre-evidence approvals have no citations and must be reviewed again.
UPDATE "Proposal" SET "reviewStatus" = 'pending', "profileHash" = '';
