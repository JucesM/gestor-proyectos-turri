import jwt from 'jsonwebtoken';
import { verifyUserToken } from '../services/openProjectService.js';
import { pool } from '../config/db.js';

const SECRET = process.env.SESSION_SECRET || 'tu_clave_secreta_muy_segura_aqui';

export async function loginWithOpenProject(req, res) {
  const { apiToken } = req.body;

  if (!apiToken) {
    return res.status(400).json({ ok: false, message: 'Falta apiToken' });
  }

  try {
    const user = await verifyUserToken(apiToken);
    console.log('OpenProject user data:', user);

    // Verificar si el usuario ya existe en la base de datos local
    let localUser = await pool.query(
      'SELECT * FROM users WHERE openproject_id = $1',
      [user.id]
    );

    if (localUser.rows.length === 0) {
      // Crear usuario en la base de datos local
      console.log('Creating user in local database...');
      const newUser = await pool.query(
        'INSERT INTO users (openproject_id, name, email, api_token, roles) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [user.id, user.name, user.email, apiToken, []]
      );
      localUser = newUser;
      console.log('User created:', newUser.rows[0]);
    } else {
      // Actualizar el api_token si ha cambiado
      console.log('User already exists, updating api_token...');
      await pool.query(
        'UPDATE users SET api_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [apiToken, localUser.rows[0].id]
      );
      console.log('User updated:', localUser.rows[0]);
    }

    const token = jwt.sign(
      {
        id: localUser.rows[0].id,
        name: user.name,
        email: user.email,
        openproject_id: user.id,
        apiToken: apiToken // Store user's API token in JWT
      },
      SECRET,
      { expiresIn: '24h' }
    );

    res.json({ ok: true, token, user: localUser.rows[0] });
  } catch (error) {
    console.error('Error verifying token:', error.response?.status, error.response?.data || error.message);
    res.status(401).json({
      ok: false,
      message: 'Token inválido o error en la autenticación',
      details: error.response?.data || error.message
    });
  }
}
