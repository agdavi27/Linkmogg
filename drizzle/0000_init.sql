CREATE TYPE "public"."outreach_channel" AS ENUM('email', 'dm');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."prospect_status" AS ENUM('discovered', 'preview_built', 'contacted', 'opened', 'clicked', 'claimed', 'trial', 'paid', 'unsubscribed', 'removed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."suppression_kind" AS ENUM('email', 'handle');--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"daily_email_cap" integer DEFAULT 50 NOT NULL,
	"per_run_email_cap" integer DEFAULT 10 NOT NULL,
	"daily_dm_cap" integer DEFAULT 30 NOT NULL,
	"fetch_delay_ms" integer DEFAULT 1500 NOT NULL,
	"physical_address" text DEFAULT '' NOT NULL,
	"sender_name" text DEFAULT 'Linkmogg' NOT NULL,
	"default_preview_theme" text DEFAULT 'random' NOT NULL,
	"email_subject" text DEFAULT 'I made you a new link-in-bio page' NOT NULL,
	"email_template" text DEFAULT 'Hey {name}, saw you have a link-in-bio page, so I made you a more fun one: {preview_link}

It''s yours free for 14 days, and $10/mo after that if you want to edit it or switch themes.

Not interested? {remove_link}' NOT NULL,
	"dm_template" text DEFAULT 'Hey {name}! Saw your link-in-bio, so I made you a more fun one: {preview_link} It''s free for 14 days. Not into it? {remove_link}' NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"next" text,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "login_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "outreach_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid NOT NULL,
	"channel" "outreach_channel" NOT NULL,
	"status" "message_status" DEFAULT 'queued' NOT NULL,
	"to_address" text,
	"subject" text,
	"body" text NOT NULL,
	"resend_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"username" text NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"theme_id" text DEFAULT 'classic' NOT NULL,
	"theme_options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pages_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "pages_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "prospect_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid NOT NULL,
	"type" text NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text DEFAULT 'instagram' NOT NULL,
	"handle" text NOT NULL,
	"source_url" text,
	"display_name" text,
	"bio" text,
	"avatar_url" text,
	"email" text,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"socials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"theme_id" text,
	"claim_token" text NOT NULL,
	"status" "prospect_status" DEFAULT 'discovered' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"last_error" text,
	"claimed_user_id" uuid,
	"import_batch_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prospects_claim_token_unique" UNIQUE("claim_token")
);
--> statement-breakpoint
CREATE TABLE "social_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'none' NOT NULL,
	"current_period_end" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "suppressions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "suppression_kind" NOT NULL,
	"value_hash" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppressions_value_hash_unique" UNIQUE("value_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outreach_messages" ADD CONSTRAINT "outreach_messages_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_events" ADD CONSTRAINT "prospect_events_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_claimed_user_id_users_id_fk" FOREIGN KEY ("claimed_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_links" ADD CONSTRAINT "social_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "links_page_pos" ON "links" USING btree ("page_id","position");--> statement-breakpoint
CREATE INDEX "outreach_status" ON "outreach_messages" USING btree ("channel","status");--> statement-breakpoint
CREATE INDEX "prospect_events_type" ON "prospect_events" USING btree ("type","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "prospects_platform_handle" ON "prospects" USING btree ("platform","handle");--> statement-breakpoint
CREATE INDEX "socials_page_pos" ON "social_links" USING btree ("page_id","position");