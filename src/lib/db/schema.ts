import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

/** Project type enum */
export const projectTypeEnum = ["SITE", "SAAS"] as const;
export type ProjectType = (typeof projectTypeEnum)[number];

/** Category type enum */
export const categoryTypeEnum = ["COMMUNICATION", "CONTEXT", "TECHNICAL"] as const;
export type CategoryType = (typeof categoryTypeEnum)[number];

/** Category format enum */
export const categoryFormatEnum = [
  "IMAGE_GRID",
  "TEXT_MARKDOWN",
  "EXTERNAL_LINK",
] as const;
export type CategoryFormat = (typeof categoryFormatEnum)[number];

/** Client table */
export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** Project table */
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: projectTypeEnum }).notNull(),
  vercelUrl: text("vercel_url"),
  githubUrl: text("github_url"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** Category (livrable) table */
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: categoryTypeEnum }).notNull(),
  format: text("format", { enum: categoryFormatEnum }).notNull(),
  contentText: text("content_text"),
  contentUrl: text("content_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** Category image (for IMAGE_GRID format) */
export const categoryImages = sqliteTable("category_images", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** Relations for Drizzle query API */
export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients),
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  project: one(projects),
  images: many(categoryImages),
}));

export const categoryImagesRelations = relations(categoryImages, ({ one }) => ({
  category: one(categories),
}));

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type CategoryImage = typeof categoryImages.$inferSelect;
export type NewCategoryImage = typeof categoryImages.$inferInsert;
