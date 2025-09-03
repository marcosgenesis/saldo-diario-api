CREATE TABLE "balance" (
	"id" text PRIMARY KEY NOT NULL,
	"amount" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"payment_date" timestamp NOT NULL,
	"created_at" timestamp,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense" (
	"id" text PRIMARY KEY NOT NULL,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"date" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	"balance_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income" (
	"id" text PRIMARY KEY NOT NULL,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"date" timestamp NOT NULL,
	"created_at" timestamp,
	"balance_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "balance" ADD CONSTRAINT "balance_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_balance_id_balance_id_fk" FOREIGN KEY ("balance_id") REFERENCES "public"."balance"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income" ADD CONSTRAINT "income_balance_id_balance_id_fk" FOREIGN KEY ("balance_id") REFERENCES "public"."balance"("id") ON DELETE cascade ON UPDATE no action;