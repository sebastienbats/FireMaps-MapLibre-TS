import { Router } from 'express';
import { saveExport, listExports, deleteExport } from '../controllers/exportController';
import { validateExport, validate } from '../middleware/validator';
const r = Router();
r.post('/', validateExport, validate, saveExport);
r.get('/', listExports);
r.delete('/:filename', deleteExport);
export default r;
