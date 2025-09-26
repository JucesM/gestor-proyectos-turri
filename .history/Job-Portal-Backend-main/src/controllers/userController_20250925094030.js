import { pool } from '../config/db.js';
import { verifyToken } from '../middleware/authMiddleware.js';

// Obtener perfil de usuario
export async function getUserProfile(req, res) {
  try {
    console.log('=== GET USER PROFILE ===');
    console.log('req.user:', req.user);
    const userId = req.user.id;
    console.log('userId from req.user.id:', userId);

    const result = await pool.query(
      'SELECT id, openproject_id, email, name, roles, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    console.log('Query result:', result.rows);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error getting user profile:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error al obtener perfil de usuario' });
  }
}


// Actualizar perfil de usuario
export async function updateUserProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, email, roles } = req.body;

    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, roles = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, email, roles, userId]
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
    const { openproject_id } = req.body;

    if (!openproject_id) {
      return res.status(400).json({ message: 'Se requiere openproject_id' });
    }

    console.log('Syncing user with OpenProject ID:', openproject_id);

    // Obtener datos del usuario desde OpenProject
    const userResponse = await fetch(`${process.env.OPENPROJECT_URL}/api/v3/users/${openproject_id}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`apikey:${process.env.OPENPROJECT_API_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user from OpenProject:', userResponse.status, userResponse.statusText);
      const errorText = await userResponse.text();
      console.error('OpenProject error response:', errorText);
      return res.status(404).json({ message: 'Usuario no encontrado en OpenProject' });
    }

    const userData = await userResponse.json();
    console.log('OpenProject user data:', userData);

    // Crear o actualizar usuario con datos de OpenProject
    // Usar email como clave única para evitar duplicados
    const result = await pool.query(
      `INSERT INTO users (openproject_id, name, email, avatar_url, roles, last_sync, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (email)
       DO UPDATE SET
         openproject_id = EXCLUDED.openproject_id,
         name = EXCLUDED.name,
         avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
         last_sync = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        openproject_id,
        userData.name,
        userData.email,
        userData.avatar,
        '' // roles por defecto
      ]
    );

    console.log('User synced/created successfully:', result.rows[0]);

    res.json({
      message: 'Usuario sincronizado con OpenProject',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error syncing user with OpenProject:', error);
    res.status(500).json({ message: 'Error al sincronizar usuario con OpenProject' });
  }
}

// Crear usuario
export async function createUser(req, res) {
  try {
    console.log('=== CREATE USER ENDPOINT CALLED ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', req.headers);
    console.log('Creating user with data:', req.body);
    const { openproject_id, name, email, roles } = req.body;

    if (!openproject_id || !name || !email) {
      console.log('Missing required fields:', { openproject_id, name, email });
      return res.status(400).json({ message: 'Faltan campos requeridos: openproject_id, name, email' });
    }

    console.log('Inserting user into database...');
    const result = await pool.query(
      'INSERT INTO users (openproject_id, name, email, roles) VALUES ($1, $2, $3, $4) RETURNING *',
      [openproject_id, name, email, roles || '']
    );

    console.log('User created successfully:', result.rows[0]);
    res.status(201).json({
      message: 'Usuario creado correctamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating user:', error);
    console.error('Error code:', error.code);
    console.error('Error details:', error.detail);
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({ message: 'Ya existe un usuario con ese openproject_id o email' });
    } else {
      res.status(500).json({ message: `Error al crear usuario: ${error.message}` });
    }
  }
}

// Obtener usuario por ID, Email o Nombre
export async function getUserByIdOrEmail(req, res) {
  try {
    const { identifier } = req.params; // Puede ser ID numérico, email o nombre

    let query;
    let param;

    // Verificar si es un número (ID)
    if (!isNaN(identifier)) {
      query = 'SELECT id, openproject_id, email, name, avatar_url, roles, created_at, updated_at FROM users WHERE id = $1';
      param = parseInt(identifier);
    } else if (identifier.includes('@')) {
      // Es email
      query = 'SELECT id, openproject_id, email, name, avatar_url, roles, created_at, updated_at FROM users WHERE email = $1';
      param = identifier;
    } else {
      // Es nombre
      query = 'SELECT id, openproject_id, email, name, avatar_url, roles, created_at, updated_at FROM users WHERE name ILIKE $1';
      param = `%${identifier}%`; // Búsqueda parcial case insensitive
    }

    const result = await pool.query(query, [param]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user by ID, Email or Name:', error);
    res.status(500).json({ message: 'Error al buscar usuario' });
  }
}

// Obtener usuario por OpenProject ID
export async function getUserByOpenProjectId(req, res) {
  try {
    const { openprojectId } = req.params;

    const result = await pool.query(
      'SELECT id, openproject_id, email, name, avatar_url, roles, created_at, updated_at FROM users WHERE openproject_id = $1',
      [openprojectId]
    );

    if (result.rows.length === 0) {
      console.log('User not found in local DB, this should not happen as sync creates users');
      return res.status(404).json({ message: 'Usuario no encontrado en base de datos local' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user by OpenProject ID:', error);
    res.status(500).json({ message: 'Error al buscar usuario' });
  }
}

export { upload };