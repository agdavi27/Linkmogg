import {
  pgTable, uuid, text, timestamp, boolean, integer, jsonb, pgEnum, uniqueIndex, index,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(), // stored lowercased
  name: text("name"),
  role: roleEnum("role").notNull().default("user"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loginTokens = pgTable("login_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  next: text("next"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(), // stored lowercased
  displayName: text("display_name").notNull().default(""),
  bio: text("bio").notNull().default(""),
  avatarUrl: text("avatar_url"),
  themeId: text("theme_id").notNull().default("classic"),
  themeOptions: jsonb("theme_options").$type<Record<string, unknown>>().notNull().default({}),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const links = pgTable("links", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("links_page_pos").on(t.pageId, t.position)]);

export const socialLinks = pgTable("social_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id").notNull().references(() => pages.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
}, (t) => [index("socials_page_pos").on(t.pageId, t.position)]);

export const subscriptions = pgTable("subscriptions", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  status: text("status").notNull().default("none"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- Outreach ---------------- */

export const prospectStatusEnum = pgEnum("prospect_status", [
  "discovered", "preview_built", "contacted", "opened", "clicked",
  "claimed", "trial", "paid", "unsubscribed", "removed",
]);

export type ParsedLink = { title: string; url: string };
export type ParsedSocial = { platform: string; url: string };

export const importBatches = pgTable("import_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(), // csv | paste | manual
  rowCount: integer("row_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prospects = pgTable("prospects", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").notNull().default("instagram"),
  handle: text("handle").notNull(),
  sourceUrl: text("source_url"),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  email: text("email"),
  links: jsonb("links").$type<ParsedLink[]>().notNull().default([]),
  socials: jsonb("socials").$type<ParsedSocial[]>().notNull().default([]),
  themeId: text("theme_id"),
  claimToken: text("claim_token").notNull().unique(),
  status: prospectStatusEnum("status").notNull().default("discovered"),
  notes: text("notes").notNull().default(""),
  lastError: text("last_error"),
  claimedUserId: uuid("claimed_user_id").references(() => users.id, { onDelete: "set null" }),
  importBatchId: uuid("import_batch_id").references(() => importBatches.id, { onDelete: "set null" }),
  /** How we found them: import (a list), handle (typed in admin), snowball (mentioned by another creator), search. */
  source: text("source").notNull().default("import"),
  discoveredFrom: text("discovered_from"),
  igFollowers: integer("ig_followers"),
  igWebsite: text("ig_website"),
  /** Our own stored copies of their recent reels (Blob URLs), for the Reels preview. */
  igReels: jsonb("ig_reels").$type<string[]>().notNull().default([]),
  igCheckedAt: timestamp("ig_checked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("prospects_platform_handle").on(t.platform, t.handle)]);

export const prospectEvents = pgTable("prospect_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  prospectId: uuid("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("prospect_events_type").on(t.type, t.createdAt)]);

export const channelEnum = pgEnum("outreach_channel", ["email", "dm"]);
export const messageStatusEnum = pgEnum("message_status", [
  "queued", "sent", "delivered", "opened", "clicked", "bounced", "complained", "failed", "skipped",
]);

export const outreachMessages = pgTable("outreach_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  prospectId: uuid("prospect_id").notNull().references(() => prospects.id, { onDelete: "cascade" }),
  channel: channelEnum("channel").notNull(),
  status: messageStatusEnum("status").notNull().default("queued"),
  toAddress: text("to_address"),
  subject: text("subject"),
  body: text("body").notNull(),
  resendId: text("resend_id"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
}, (t) => [index("outreach_status").on(t.channel, t.status)]);

export const suppressionKindEnum = pgEnum("suppression_kind", ["email", "handle"]);

export const suppressions = pgTable("suppressions", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: suppressionKindEnum("kind").notNull(),
  valueHash: text("value_hash").notNull().unique(),
  reason: text("reason").notNull(), // unsubscribe | removed | bounce | complaint | manual
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminSettings = pgTable("admin_settings", {
  id: integer("id").primaryKey().default(1),
  dailyEmailCap: integer("daily_email_cap").notNull().default(50),
  perRunEmailCap: integer("per_run_email_cap").notNull().default(10),
  dailyDmCap: integer("daily_dm_cap").notNull().default(30),
  fetchDelayMs: integer("fetch_delay_ms").notNull().default(1500),
  physicalAddress: text("physical_address").notNull().default(""),
  senderName: text("sender_name").notNull().default("Linkmogg"),
  defaultPreviewTheme: text("default_preview_theme").notNull().default("random"),
  emailSubject: text("email_subject").notNull().default("I made you a new link-in-bio page"),
  emailTemplate: text("email_template").notNull().default(
    "Hey {name}, saw you have a link-in-bio page, so I made you a more fun one: {preview_link}\n\nIt's yours free for 14 days, and $10/mo after that if you want to edit it or switch themes.\n\nNot interested? {remove_link}",
  ),
  dmTemplate: text("dm_template").notNull().default(
    "Hey {name}! Saw your link-in-bio, so I made you a more fun one: {preview_link} It's free for 14 days. Not into it? {remove_link}",
  ),
  paused: boolean("paused").notNull().default(false),
  // Instagram (Business Discovery through Linkmogg's own connected account)
  igUserId: text("ig_user_id"),
  igUsername: text("ig_username"),
  /** Long-lived token, encrypted with a key derived from META_APP_SECRET. */
  igTokenEnc: text("ig_token_enc"),
  igTokenExpiresAt: timestamp("ig_token_expires_at", { withTimezone: true }),
  igCallsPerHour: integer("ig_calls_per_hour").notNull().default(150),
  discoveryEnabled: boolean("discovery_enabled").notNull().default(false),
  /** Starting accounts, one handle per line. */
  discoverySeeds: text("discovery_seeds").notNull().default(""),
  discoveryMinFollowers: integer("discovery_min_followers").notNull().default(1000),
  discoveryMaxFollowers: integer("discovery_max_followers").notNull().default(500000),
  discoveryMinReels: integer("discovery_min_reels").notNull().default(3),
  discoveryMaxDepth: integer("discovery_max_depth").notNull().default(3),
  discoveryLookupsPerRun: integer("discovery_lookups_per_run").notNull().default(40),
  /** Which bio links count, one host per line. */
  discoveryLinkHosts: text("discovery_link_hosts").notNull().default("linktr.ee"),
  /** Optional web-search queries for finding more starting accounts, one per line. */
  searchQueries: text("search_queries").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Instagram handles found by discovery, waiting for (or already given) a Business Discovery lookup. */
export const igCandidateStatusEnum = pgEnum("ig_candidate_status", ["pending", "qualified", "rejected", "error"]);
export const igCandidates = pgTable("ig_candidates", {
  handle: text("handle").primaryKey(),
  status: igCandidateStatusEnum("status").notNull().default("pending"),
  reason: text("reason"),
  source: text("source").notNull().default("snowball"),
  discoveredFrom: text("discovered_from"),
  /** Hops from a starting account: 0 for a seed, 1 for someone a seed mentioned, and so on. */
  depth: integer("depth").notNull().default(0),
  checkedAt: timestamp("checked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("ig_candidates_status").on(t.status, t.createdAt)]);

/** One row per Graph API call, so we stay under Meta's hourly limit. */
export const igCalls = pgTable("ig_calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("ig_calls_at").on(t.at)]);

export type User = typeof users.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Link = typeof links.$inferSelect;
export type SocialLink = typeof socialLinks.$inferSelect;
export type Prospect = typeof prospects.$inferSelect;
export type AdminSettings = typeof adminSettings.$inferSelect;
export type IgCandidate = typeof igCandidates.$inferSelect;
