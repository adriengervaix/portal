CREATE TABLE `counterparty_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`counterparty_name` text NOT NULL,
	`client_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tax_declarations` (
	`id` text PRIMARY KEY NOT NULL,
	`month_key` text NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tax_declarations_month_key_unique` ON `tax_declarations` (`month_key`);--> statement-breakpoint
CREATE TABLE `tax_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`declaration_id` text NOT NULL,
	`supplier_name` text NOT NULL,
	`amount_ttc` integer NOT NULL,
	`amount_ht` integer NOT NULL,
	`vat_amount` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`declaration_id`) REFERENCES `tax_declarations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `tax_revenues` (
	`id` text PRIMARY KEY NOT NULL,
	`declaration_id` text NOT NULL,
	`counterparty_name` text NOT NULL,
	`amount_ttc` integer NOT NULL,
	`amount_ht` integer NOT NULL,
	`client_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`declaration_id`) REFERENCES `tax_declarations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `status` text DEFAULT 'IN_PROGRESS' NOT NULL;