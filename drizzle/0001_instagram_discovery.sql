CREATE TYPE "public"."ig_candidate_status" AS ENUM('pending', 'qualified', 'rejected', 'error');--> statement-breakpoint
CREATE TABLE "ig_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ig_candidates" (
	"handle" text PRIMARY KEY NOT NULL,
	"status" "ig_candidate_status" DEFAULT 'pending' NOT NULL,
	"reason" text,
	"source" text DEFAULT 'snowball' NOT NULL,
	"discovered_from" text,
	"depth" integer DEFAULT 0 NOT NULL,
	"checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "ig_user_id" text;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "ig_username" text;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "ig_token_enc" text;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "ig_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "ig_calls_per_hour" integer DEFAULT 150 NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "discovery_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "discovery_seeds" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "discovery_min_followers" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "discovery_max_followers" integer DEFAULT 500000 NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "discovery_min_reels" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "discovery_max_depth" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "discovery_lookups_per_run" integer DEFAULT 40 NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "discovery_link_hosts" text DEFAULT 'linktr.ee' NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD COLUMN "search_queries" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "source" text DEFAULT 'import' NOT NULL;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "discovered_from" text;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "ig_followers" integer;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "ig_website" text;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "ig_reels" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "ig_checked_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "ig_calls_at" ON "ig_calls" USING btree ("at");--> statement-breakpoint
CREATE INDEX "ig_candidates_status" ON "ig_candidates" USING btree ("status","created_at");