ALTER TABLE `clients` ADD `qonto_client_id` text;
ALTER TABLE `projects` ADD `qonto_quote_id` text;
ALTER TABLE `projects` ADD `quote_number` text;
ALTER TABLE `projects` ADD `quote_status` text;
ALTER TABLE `projects` ADD `quote_amount_ht` integer;
ALTER TABLE `projects` ADD `quote_annotation` text;
