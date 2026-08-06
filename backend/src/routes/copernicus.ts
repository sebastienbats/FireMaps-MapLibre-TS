import { Router } from 'express';
import { getBurnedAreas, getFireRisk } from '../controllers/copernicusController';
const r = Router();
r.get('/burned-areas', getBurnedAreas);
r.get('/fire-risk', getFireRisk);
export default r;
