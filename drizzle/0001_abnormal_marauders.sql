ALTER TABLE "opportunities" ALTER COLUMN "type" SET DATA TYPE text USING "type"::text;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "status" SET DATA TYPE text USING "status"::text;--> statement-breakpoint
ALTER TABLE "opportunities" ALTER COLUMN "status" SET DEFAULT 'Not contacted';--> statement-breakpoint
DROP TYPE "public"."opportunity_status";--> statement-breakpoint
DROP TYPE "public"."opportunity_type";
