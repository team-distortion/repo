import { Router, Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@utils/errors';

const router = Router();
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, { message: 'TODO: Users endpoint' }, 200);
  } catch (error) {
    next(error);
  }
});

export default router;
