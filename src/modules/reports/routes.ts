import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@utils/errors';
const router = Router();
router.get('/', (_req: Request, res: Response, _next: NextFunction) => { sendSuccess(res, { message: 'TODO' }, 200); });
export default router;
