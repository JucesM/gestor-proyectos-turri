import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db.js';
import { verifyToken } from '../middleware/authMiddleware.js';

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
  }
});

// Obtener perfil de usuario
export async function getUserProfile(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT id, openproject_id, email, name, avatar_url, role, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Error al obtener perfil de usuario' });
  }
}

// Actualizar avatar de usuario
export async function uploadAvatar(req, res) {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No se proporcionó ningún archivo' });
    }

    // Generar URL del avatar
    const avatarUrl = `http://localhost:8081/avatars/${req.file.filename}`;

    // Actualizar en base de datos
    const result = await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [avatarUrl, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Avatar actualizado correctamente',
      avatarUrl,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    res.status(500).json({ message: 'Error al subir avatar' });
  }
}

// Actualizar perfil de usuario
export async function updateUserProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, email, role } = req.body;

    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, role = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, email, role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Perfil actualizado correctamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
}

// Sincronizar usuario con OpenProject
export async function syncUserWithOpenProject(req, res) {
  try {
    const userId = req.user.id;

    // Aquí podrías implementar lógica para sincronizar datos desde OpenProject
    // Por ahora, solo devolvemos el perfil actual
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      message: 'Usuario sincronizado',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ message: 'Error al sincronizar usuario' });
  }
}

export { upload };