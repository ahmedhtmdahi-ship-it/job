ALTER TABLE "Proposal" ADD COLUMN "sentences" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Proposal" ADD COLUMN "userConfirmed" BOOLEAN NOT NULL DEFAULT false;
-- Pre-evidence approvals have no citations and must be reviewed again.
UPDATE "Proposal" SET "reviewStatus" = 'pending', "profileHash" = '';

-- Preserve legacy wording as unverified AI text, never silently relabel it user-authored.
UPDATE "Proposal" p SET "sentences" = (
 SELECT COALESCE(jsonb_agg(jsonb_build_object('text',btrim(line),'factIds','[]'::jsonb,'origin','ai') ORDER BY ord),'[]'::jsonb)
 FROM regexp_split_to_table(p."draft", E'\n') WITH ORDINALITY AS lines(line,ord)
 WHERE btrim(line) <> ''
);
