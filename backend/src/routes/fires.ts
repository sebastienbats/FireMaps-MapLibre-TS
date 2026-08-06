import { Router } from 'express';
import { getFires } from '../controllers/fireController';
const r = Router();
r.get('/', getFires);
export default r;
