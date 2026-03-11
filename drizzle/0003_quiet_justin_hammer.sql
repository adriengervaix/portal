PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'PRODUCTION_WORKING' NOT NULL,
	`devis_reference` text,
	`projected_amount_ht` integer,
	`vercel_url` text,
	`github_url` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_projects`("id", "client_id", "name", "type", "status", "devis_reference", "projected_amount_ht", "vercel_url", "github_url", "created_at") SELECT "id", "client_id", "name", "type", CASE WHEN "status" = 'IN_PROGRESS' THEN 'PRODUCTION_WORKING' ELSE "status" END, NULL, NULL, "vercel_url", "github_url", "created_at" FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
PRAGMA foreign_keys=ON;