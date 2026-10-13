CREATE TYPE "public"."work_mode" AS ENUM('remote', 'hybrid', 'onsite');--> statement-breakpoint
CREATE TABLE "account" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "work_mode" "work_mode" DEFAULT 'onsite' NOT NULL;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_candidate_id_idx" ON "application" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "job_status_published_at_idx" ON "job" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "job_company_id_idx" ON "job" USING btree ("company_id");