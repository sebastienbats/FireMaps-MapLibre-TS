import { Router } from 'express';
import { getWindData } from '../controllers/meteoController';
const r = Router();
r.get('/wind', getWindData);
export default r;
