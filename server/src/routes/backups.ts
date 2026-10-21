import { fileStamp } from '@polaris/shared';
import { Router } from 'express';
import { createBackup, exportData, getBackupPath, importData, listBackups } from '../services/backupService';

export const backupsRouter = Router();

backupsRouter.get('/', (_req, res) => {
  res.json(listBackups());
});

backupsRouter.post('/', async (_req, res) => {
  res.status(201).json(await createBackup('manual'));
});

backupsRouter.get('/export', (_req, res) => {
  res.setHeader('Content-Disposition', `attachment; filename="polaris-export-${fileStamp()}.json"`);
  res.json(exportData());
});

backupsRouter.post('/import', async (req, res) => {
  res.json(await importData(req.body));
});

backupsRouter.get('/:fileName/download', (req, res) => {
  res.download(getBackupPath(req.params.fileName));
});
