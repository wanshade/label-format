CREATE TABLE "label_setups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"label_length_mm" numeric,
	"label_height_mm" numeric,
	"label_thickness_mm" numeric,
	"label_colour_background" text,
	"text_colour" text,
	"label_quantity" integer,
	"style" text,
	"no_of_holes" integer,
	"hole_size_mm" numeric,
	"hole_distance_mm" numeric,
	"lines" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "label_setups" ADD CONSTRAINT "label_setups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;