import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger';
import type { ExportRequest, ExportFileInfo } from '../types';

const DIR = path.join(__dirname, '../../exports');

export const saveExport = (req: Request, res: Response): void => {
  try {
    const { filename, data, format = 'geojson' } = req.body as ExportRequest;
    if (!filename || !data) { res.status(400).json({ error: 'Nom et données requis' }); return; }

    const safe = filename.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
    const ext = format === 'csv' ? '.csv' : '.geojson';
    const full = path.join(DIR, safe + ext);
    if (!full.startsWith(DIR)) { res.status(400).json({ error: 'Nom invalide' }); return; }

    const content = format === 'geojson' ? (typeof data === 'string' ? data : JSON.stringify(data, null, 2)) : String(data);
    if (Buffer.byteLength(content) > 10 * 1024 * 1024) { res.status(413).json({ error: 'Max 10 Mo' }); return; }

    fs.writeFileSync(full, content, 'utf8');
    logger.info(`[Export] ${safe}${ext}`);
    res.json({ success: true, file: `/exports/${safe}${ext}`, size: Buffer.byteLength(content) });
  } catch (e) {
    logger.error(`[Export] ${e instanceof Error ? e.message : e}`);
    res.status(500).json({ error: 'Erreur sauvegarde' });
  }
};

export const listExports = (_req: Request, res: Response): void => {
  try {
    const files: ExportFileInfo[] = fs.readdirSync(DIR)
      .filter(f => f.endsWith('.csv') || f.endsWith('.geojson'))
      .map(f => { const s = fs.statSync(path.join(DIR, f)); return { name: f, size: s.size, modified: s.mtime.toISOString() }; })
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
    res.json({ files });
  } catch { res.status(500).json({ error: 'Erreur liste' }); }
};

export const deleteExport = (req: Request, res: Response): void => {
  try {
    const safe = path.basename(req.params.filename);
    const fp = path.join(DIR, safe);
    if (!fp.startsWith(DIR) || !fs.existsSync(fp)) { res.status(404).json({ error: 'Non trouvé' }); return; }
    fs.unlinkSync(fp);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Erreur suppression' }); }
};
