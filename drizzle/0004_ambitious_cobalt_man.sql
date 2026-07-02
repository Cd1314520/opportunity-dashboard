ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_url_unique";--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_user_id_url_unique" UNIQUE("user_id","url");