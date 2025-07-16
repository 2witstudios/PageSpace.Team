CREATE TABLE IF NOT EXISTS "ai_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"timestamp" timestamp DEFAULT now(),
	"action" text NOT NULL,
	"details" jsonb
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_audit_log" ADD CONSTRAINT "ai_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
