import express from 'express';
import {
  getUserProfile,
  uploadAvatar,
  updateUserProfile,
  syncUserWithOpenProject,
  createUser,
  getUserByOpenProjectId,
  upload
} from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users/profile - Obtener perfil de usuario
router.get('/profile', verifyToken, getUserProfile);

// POST /api/users - Crear usuario
router.post('/', verifyToken, createUser);

// POST /api/users/avatar - Subir avatar
router.post('/avatar', verifyToken, upload.single('avatar'), uploadAvatar);

// PUT /api/users/profile - Actualizar perfil
router.put('/profile', verifyToken, updateUserProfile);

// POST /api/users/sync - Sincronizar con OpenProject
router.post('/sync', verifyToken, syncUserWithOpenProject);

// GET /api/users/by-openproject/:openprojectId - Obtener usuario por OpenProject ID
router.get('/by-openproject/:openprojectId', verifyToken, getUserByOpenProjectId);

export default router;