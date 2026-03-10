import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

/** Project type enum */
export const projectTypeEnum = ["SITE", "SAAS"] as const;
export type ProjectType = (typeof projectTypeEnum)[number];

/** Project status enum */
export const projectStatusEnum = ["IN_PROGRESS", "CLOSED"] as const;
export type ProjectStatus = (typeof projectStatusEnum)[number];

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

/** Client status enum */
export const clientStatusEnum = ["ACTIVE", "ARCHIVED"] as const;
export type ClientStatus = (typeof clientStatusEnum)[number];

/** Client table */
export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  status: text("status", { enum: clientStatusEnum })
    .notNull()
    .default("ACTIVE"),
  url: text("url"),
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
  status: text("status", { enum: projectStatusEnum })
    .notNull()
    .default("IN_PROGRESS"),
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
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  project: one(projects),
  images: many(categoryImages),
}));

export const categoryImagesRelations = relations(categoryImages, ({ one }) => ({
  category: one(categories),
}));

/** Tax declaration status enum */
export const taxDeclarationStatusEnum = ["OPEN", "CLOSED", "OVERDUE"] as const;
export type TaxDeclarationStatus = (typeof taxDeclarationStatusEnum)[number];

/** Tax declaration table — one per month */
export const taxDeclarations = sqliteTable("tax_declarations", {
  id: text("id").primaryKey(),
  monthKey: text("month_key").notNull().unique(), // e.g. "2026-02"
  status: text("status", { enum: taxDeclarationStatusEnum })
    .notNull()
    .default("OPEN"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** Tax revenue (encaissement client) */
export const taxRevenues = sqliteTable("tax_revenues", {
  id: text("id").primaryKey(),
  declarationId: text("declaration_id")
    .notNull()
    .references(() => taxDeclarations.id, { onDelete: "cascade" }),
  counterpartyName: text("counterparty_name").notNull(),
  amountTtc: integer("amount_ttc").notNull(), // cents
  amountHt: integer("amount_ht").notNull(), // cents
  clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** Tax expense (dépense) */
export const taxExpenses = sqliteTable("tax_expenses", {
  id: text("id").primaryKey(),
  declarationId: text("declaration_id")
    .notNull()
    .references(() => taxDeclarations.id, { onDelete: "cascade" }),
  supplierName: text("supplier_name").notNull(),
  amountTtc: integer("amount_ttc").notNull(), // cents
  amountHt: integer("amount_ht").notNull(), // cents
  vatAmount: integer("vat_amount").notNull(), // cents
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

/** Counterparty → Client mapping for auto-attribution */
export const counterpartyMappings = sqliteTable("counterparty_mappings", {
  id: text("id").primaryKey(),
  counterpartyName: text("counterparty_name").notNull(),
  clientId: text("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const taxDeclarationsRelations = relations(taxDeclarations, ({ many }) => ({
  revenues: many(taxRevenues),
  expenses: many(taxExpenses),
}));

export const taxRevenuesRelations = relations(taxRevenues, ({ one }) => ({
  declaration: one(taxDeclarations),
  client: one(clients),
}));

export const taxExpensesRelations = relations(taxExpenses, ({ one }) => ({
  declaration: one(taxDeclarations),
}));

export const counterpartyMappingsRelations = relations(counterpartyMappings, ({ one }) => ({
  client: one(clients),
}));

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type CategoryImage = typeof categoryImages.$inferSelect;
export type NewCategoryImage = typeof categoryImages.$inferInsert;
export type TaxDeclaration = typeof taxDeclarations.$inferSelect;
export type NewTaxDeclaration = typeof taxDeclarations.$inferInsert;
export type TaxRevenue = typeof taxRevenues.$inferSelect;
export type NewTaxRevenue = typeof taxRevenues.$inferInsert;
export type TaxExpense = typeof taxExpenses.$inferSelect;
export type NewTaxExpense = typeof taxExpenses.$inferInsert;
export type CounterpartyMapping = typeof counterpartyMappings.$inferSelect;
export type NewCounterpartyMapping = typeof counterpartyMappings.$inferInsert;
