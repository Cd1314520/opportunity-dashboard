CREATE TYPE "public"."opportunity_status" AS ENUM('not_contacted', 'contacted', 'in_progress', 'interested', 'rejected', 'accepted');--> statement-breakpoint
CREATE TYPE "public"."opportunity_type" AS ENUM('professor', 'internship', 'scholarship', 'job');--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "opportunity_type" NOT NULL,
	"name" text NOT NULL,
	"organization" text NOT NULL,
	"url" text,
	"contact_email" text,
	"status" "opportunity_status" DEFAULT 'not_contacted' NOT NULL,
	"notes" text,
	"last_contacted_at" timestamp with time zone,
	"follow_up_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
