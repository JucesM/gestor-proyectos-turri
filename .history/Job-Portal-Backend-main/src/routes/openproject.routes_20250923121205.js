// src/routes/openproject.routes.js
import { Router } from 'express';
import {
  ping,
  projects,
  projectMembers,
  workPackages,
  loginWithOpenProjectToken,
} from '../controllers/openProjectController.js';

// Si tienes middleware de auth propio (JWT), impórtalo y colócalo donde quieras proteger
// import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/openproject/ping', /*verifyToken,*/ ping);
router.get('/openproject/projects', /*verifyToken,*/ projects);
router.get('/openproject/projects/:projectId/members', /*verifyToken,*/ projectMembers);
router.get('/openproject/projects/:projectId/work-packages', /*verifyToken,*/ workPackages);

// opcional: validar un token de OpenProject que te envíe el frontend
router.post('/openproject/login', /*verifyToken,*/ loginWithOpenProjectToken);

export default router;
