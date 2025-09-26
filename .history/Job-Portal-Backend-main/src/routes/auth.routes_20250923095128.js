import express from 'express';
import { loginWithOpenProject } from '../controllers/authController.js';

const router = express.Router();

// Ruta para autenticación con OpenProject
router.post('/openproject', loginWithOpenProject);

// Placeholder routes for authentication
router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - placeholder' });
});

router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint - placeholder' });
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout endpoint - placeholder' });
});

export default router;
