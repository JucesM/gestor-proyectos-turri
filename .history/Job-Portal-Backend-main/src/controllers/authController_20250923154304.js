import jwt from 'jsonwebtoken';
import { verifyUserToken } from '../services/openProjectService.js';

const SECRET = process.env.SESSION_SECRET || 'tu_clave_secreta_muy_segura_aqui';

export async function loginWithOpenProject(req, res) {
  const { apiToken } = req.body;

  if (!apiToken) {
    return res.status(400).json({ ok: false, message: 'Falta apiToken' });
  }

  try {
    const user = await verifyUserToken(apiToken);
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        apiToken: apiToken // Store user's API token in JWT
      },
      SECRET,
      { expiresIn: '24h' }
    );

    res.json({ ok: true, token, user });
  } catch (error) {
    console.error('Error verifying token:', error.response?.status, error.response?.data || error.message);
    res.status(401).json({
      ok: false,
      message: 'Token inválido o error en la autenticación',
      details: error.response?.data || error.message
    });
  }
}