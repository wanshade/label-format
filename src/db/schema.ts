import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table - each user can have multiple projects
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const labelSetups = pgTable("label_setups", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  name: text("name"), // Optional name for the label setup

  labelLengthMm: numeric("label_length_mm"),
  labelHeightMm: numeric("label_height_mm"),
  labelThicknessMm: numeric("label_thickness_mm"),
  labelColourBackground: text("label_colour_background"),
  textColour: text("text_colour"),
  labelQuantity: integer("label_quantity"),
  style: text("style"),
  noOfHoles: integer("no_of_holes"),
  holeSizeMm: numeric("hole_size_mm"),
  holeDistanceMm: numeric("hole_distance_mm"),

  lines: jsonb("lines").$type<{
    text: string;
    textSizeMm: number;
    spacingTopMm: string | number;
    spacingLeftMm: string | number;
  }[]>(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type LabelSetup = typeof labelSetups.$inferSelect;
export type NewLabelSetup = typeof labelSetups.$inferInsert;