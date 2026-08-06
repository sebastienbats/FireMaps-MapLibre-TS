import { Router } from 'express';
import { getAllSdis } from '../controllers/sdisController';
const r = Router();
r.get('/', getAllSdis);
export default r;
