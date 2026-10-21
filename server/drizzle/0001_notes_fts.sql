-- Busca de texto completo nas notas (SQLite FTS5). Isolada aqui e em notesRepository.
-- remove_diacritics 2: a busca ignora acentos ("habito" encontra "hábito").
CREATE VIRTUAL TABLE `notes_fts` USING fts5(
  `note_id` UNINDEXED,
  `title`,
  `content`,
  `tags`,
  tokenize = 'unicode61 remove_diacritics 2'
);
--> statement-breakpoint
CREATE TRIGGER `notes_fts_insert` AFTER INSERT ON `notes` BEGIN
  INSERT INTO `notes_fts` (`note_id`, `title`, `content`, `tags`) VALUES (new.`id`, new.`title`, new.`content`, new.`tags`);
END;
--> statement-breakpoint
CREATE TRIGGER `notes_fts_update` AFTER UPDATE ON `notes` BEGIN
  DELETE FROM `notes_fts` WHERE `note_id` = old.`id`;
  INSERT INTO `notes_fts` (`note_id`, `title`, `content`, `tags`) VALUES (new.`id`, new.`title`, new.`content`, new.`tags`);
END;
--> statement-breakpoint
CREATE TRIGGER `notes_fts_delete` AFTER DELETE ON `notes` BEGIN
  DELETE FROM `notes_fts` WHERE `note_id` = old.`id`;
END;
