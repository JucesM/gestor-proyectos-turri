import express from 'express';
import { loginWithOpenProject } from '../controllers/authController.js';

const router = express.Router();

// Ruta para autenticación con OpenProject
router.post('/openproject', loginWithOpenProject);

export default router;
