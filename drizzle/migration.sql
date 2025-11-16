-- Add projects table
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint for projects.user_id -> users.id
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- Add project_id column to label_setups table
ALTER TABLE "label_setups" ADD COLUMN "project_id" uuid;

-- Add optional name column to label_setups table
ALTER TABLE "label_setups" ADD COLUMN "name" text;

-- Add foreign key constraint for label_setups.project_id -> projects.id
ALTER TABLE "label_setups" ADD CONSTRAINT "label_setups_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;

-- Create a default project for existing user and migrate existing label setups
INSERT INTO "projects" (id, user_id, name, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    user_id,
    'Default Project',
    'Migrated from old label setups',
    created_at,
    updated_at
FROM (SELECT DISTINCT user_id, MIN(created_at) as created_at, MIN(updated_at) as updated_at FROM label_setups GROUP BY user_id) as distinct_users;

-- Update existing label setups to reference their default project
UPDATE "label_setups"
SET "project_id" = (SELECT id FROM "projects" WHERE "projects".user_id = "label_setups".user_id AND "projects".name = 'Default Project' LIMIT 1)
WHERE "project_id" IS NULL;

-- Make project_id NOT NULL after setting values for existing records
ALTER TABLE "label_setups" ALTER COLUMN "project_id" SET NOT NULL;

-- Remove the old user_id column from label_setups (optional, for cleanup)
-- ALTER TABLE "label_setups" DROP COLUMN "user_id";