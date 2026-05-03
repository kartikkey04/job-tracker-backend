import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { createJobSchema, updateJobSchema } from './jobs.schema';
import * as jobsController from './jobs.controller';

const router = Router();

// All jobs routes require authentication
router.use(authenticate);

router.get('/stats', jobsController.getStats);
router.get('/', jobsController.listJobs);
router.post('/', validate(createJobSchema), jobsController.createJob);
router.get('/:id', jobsController.getJob);
router.put('/:id', validate(updateJobSchema), jobsController.updateJob);
router.delete('/:id', jobsController.deleteJob);

export default router;
