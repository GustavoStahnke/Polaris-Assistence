ALTER TABLE `exercises` ADD `modality` text DEFAULT 'academia' NOT NULL;--> statement-breakpoint
ALTER TABLE `exercises` ADD `measure` text DEFAULT 'reps' NOT NULL;--> statement-breakpoint
ALTER TABLE `workout_routines` ADD `modality` text DEFAULT 'academia' NOT NULL;--> statement-breakpoint
ALTER TABLE `workout_routines` ADD `session_type` text;--> statement-breakpoint
ALTER TABLE `workout_routines` ADD `target_minutes` integer;--> statement-breakpoint
ALTER TABLE `workout_routines` ADD `target_distance_km` real;--> statement-breakpoint
ALTER TABLE `workout_sessions` ADD `modality` text DEFAULT 'academia' NOT NULL;--> statement-breakpoint
ALTER TABLE `workout_sessions` ADD `session_type` text;--> statement-breakpoint
ALTER TABLE `workout_sessions` ADD `distance_km` real;--> statement-breakpoint
ALTER TABLE `workout_sessions` ADD `rounds` integer;--> statement-breakpoint
ALTER TABLE `workout_sessions` ADD `intensity` integer;--> statement-breakpoint
ALTER TABLE `workout_sessions` ADD `avg_heart_rate` integer;--> statement-breakpoint
CREATE INDEX `workout_sessions_modality_idx` ON `workout_sessions` (`modality`,`started_at`);