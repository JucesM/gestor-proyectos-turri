// src/routes/openproject.routes.js
import { Router } from 'express';
import {
  ping,
  projects,
  project,
  projectMembers,
  workPackages,
  loginWithOpenProjectToken,
} from '../controllers/openProjectController.js';

import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/projects/ping', verifyToken, ping);
router.get('/projects/projects', verifyToken, projects);
router.get('/projects/projects/:projectId', verifyToken, project);
router.get('/projects/projects/:projectId/members', verifyToken, projectMembers);
router.get('/projects/projects/:projectId/work-packages', verifyToken, workPackages);

// opcional: validar un token de OpenProject que te envíe el frontend
router.post('/projects/login', loginWithOpenProjectToken);

export default router;
