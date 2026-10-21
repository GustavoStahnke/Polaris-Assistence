CREATE TABLE `ai_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT 'Nova conversa' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`model` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `ai_messages_conversation_idx` ON `ai_messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `body_measurements` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`weight_kg` real,
	`body_fat_percent` real,
	`chest_cm` real,
	`waist_cm` real,
	`hips_cm` real,
	`arm_cm` real,
	`thigh_cm` real,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`muscle_group` text NOT NULL,
	`equipment` text NOT NULL,
	`notes` text,
	`is_custom` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `personal_records` (
	`id` text PRIMARY KEY NOT NULL,
	`exercise_id` text NOT NULL,
	`type` text NOT NULL,
	`value` real NOT NULL,
	`weight` real NOT NULL,
	`reps` integer NOT NULL,
	`session_id` text,
	`achieved_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `personal_records_exercise_idx` ON `personal_records` (`exercise_id`,`type`);--> statement-breakpoint
CREATE TABLE `routine_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`target_sets` integer DEFAULT 3 NOT NULL,
	`target_reps` text DEFAULT '10' NOT NULL,
	`target_weight` real,
	`rest_seconds` integer DEFAULT 90 NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`routine_id`) REFERENCES `workout_routines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `routine_exercises_routine_idx` ON `routine_exercises` (`routine_id`);--> statement-breakpoint
CREATE TABLE `workout_routines` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`weekdays` text DEFAULT '[]' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text,
	`routine_name` text,
	`started_at` text NOT NULL,
	`finished_at` text,
	`duration_seconds` integer,
	`total_volume` real,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`routine_id`) REFERENCES `workout_routines`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `workout_sessions_started_idx` ON `workout_sessions` (`started_at`);--> statement-breakpoint
CREATE TABLE `workout_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`weight` real DEFAULT 0 NOT NULL,
	`reps` integer DEFAULT 0 NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_sets_session_idx` ON `workout_sets` (`session_id`);--> statement-breakpoint
CREATE INDEX `workout_sets_exercise_idx` ON `workout_sets` (`exercise_id`);--> statement-breakpoint
CREATE TABLE `book_idea_summaries` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`content` text NOT NULL,
	`model` text,
	`edited` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `book_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`type` text DEFAULT 'ideia' NOT NULL,
	`content` text NOT NULL,
	`chapter` text,
	`page` integer,
	`tags` text DEFAULT '[]' NOT NULL,
	`last_shown_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `book_notes_book_idx` ON `book_notes` (`book_id`);--> statement-breakpoint
CREATE TABLE `book_recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`authors` text DEFAULT '[]' NOT NULL,
	`open_library_key` text,
	`cover_url` text,
	`publish_year` integer,
	`page_count` integer,
	`subjects` text DEFAULT '[]' NOT NULL,
	`reason` text,
	`source` text DEFAULT 'openlibrary' NOT NULL,
	`score` real DEFAULT 0 NOT NULL,
	`dismissed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`authors` text DEFAULT '[]' NOT NULL,
	`isbn` text,
	`open_library_key` text,
	`cover_url` text,
	`cover_file` text,
	`page_count` integer,
	`subjects` text DEFAULT '[]' NOT NULL,
	`publish_year` integer,
	`description` text,
	`status` text DEFAULT 'quero_ler' NOT NULL,
	`current_page` integer DEFAULT 0 NOT NULL,
	`rating` integer,
	`started_at` text,
	`finished_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `books_status_idx` ON `books` (`status`);--> statement-breakpoint
CREATE TABLE `reading_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`target_books` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reading_goals_year_unique` ON `reading_goals` (`year`);--> statement-breakpoint
CREATE TABLE `reading_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`book_id` text NOT NULL,
	`date` text NOT NULL,
	`pages_read` integer NOT NULL,
	`from_page` integer,
	`to_page` integer,
	`minutes` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reading_sessions_date_idx` ON `reading_sessions` (`date`);--> statement-breakpoint
CREATE INDEX `reading_sessions_book_idx` ON `reading_sessions` (`book_id`);--> statement-breakpoint
CREATE TABLE `email_triage` (
	`id` text PRIMARY KEY NOT NULL,
	`message_id` text NOT NULL,
	`category` text NOT NULL,
	`source` text NOT NULL,
	`reason` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_triage_message_id_unique` ON `email_triage` (`message_id`);--> statement-breakpoint
CREATE TABLE `news_feeds` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`category` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`last_fetched_at` text,
	`last_error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_feeds_url_unique` ON `news_feeds` (`url`);--> statement-breakpoint
CREATE TABLE `read_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`link` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `read_articles_link_unique` ON `read_articles` (`link`);--> statement-breakpoint
CREATE TABLE `saved_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`link` text NOT NULL,
	`title` text NOT NULL,
	`source` text,
	`category` text,
	`image_url` text,
	`summary` text,
	`published_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `saved_articles_link_unique` ON `saved_articles` (`link`);--> statement-breakpoint
CREATE TABLE `vip_senders` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vip_senders_email_unique` ON `vip_senders` (`email`);--> statement-breakpoint
CREATE TABLE `habit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`habit_id` text NOT NULL,
	`date` text NOT NULL,
	`auto` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `habit_logs_habit_date_unique` ON `habit_logs` (`habit_id`,`date`);--> statement-breakpoint
CREATE TABLE `habits` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT 'Target' NOT NULL,
	`auto_key` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`book_id` text,
	`task_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`remind_at` text NOT NULL,
	`recurrence` text DEFAULT 'nenhuma' NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`last_fired_at` text,
	`task_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `reminders_remind_at_idx` ON `reminders` (`done`,`remind_at`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`priority` text DEFAULT 'media' NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`due_date` text,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tasks_status_idx` ON `tasks` (`status`,`due_date`);--> statement-breakpoint
CREATE TABLE `cache_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`fetched_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cache_entries_key_unique` ON `cache_entries` (`key`);--> statement-breakpoint
CREATE TABLE `integration_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`level` text NOT NULL,
	`action` text NOT NULL,
	`message` text NOT NULL,
	`details` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `integration_logs_integration_idx` ON `integration_logs` (`integration_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`integration_id` text NOT NULL,
	`enabled` integer DEFAULT false NOT NULL,
	`config_encrypted` text,
	`tokens_encrypted` text,
	`last_sync_at` text,
	`last_test_at` text,
	`last_success_at` text,
	`last_error` text,
	`last_error_at` text,
	`needs_reconnect` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `integrations_integration_id_unique` ON `integrations` (`integration_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);