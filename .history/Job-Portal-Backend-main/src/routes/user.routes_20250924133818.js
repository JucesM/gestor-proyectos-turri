import express from 'express';
import {
  getUserProfile,
  uploadAvatar,
  updateUserProfile,
  syncUserWithOpenProject,
  getUserByOpenProjectId,
  upload
} from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/users/profile - Obtener perfil de usuario
router.get('/profile', getUserProfile);

// POST /api/users/avatar - Subir avatar
router.post('/avatar', upload.single('avatar'), uploadAvatar);

// PUT /api/users/profile - Actualizar perfil
router.put('/profile', updateUserProfile);

// POST /api/users/sync - Sincronizar con OpenProject
router.post('/sync', syncUserWithOpenProject);

export default router;