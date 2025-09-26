import jwt from 'jsonwebtoken';

const SECRET = process.env.SESSION_SECRET || 'tu_clave_secreta_muy_segura_aqui';

export function verifyToken(req, res, next) {
  console.log('=== VERIFY TOKEN MIDDLEWARE ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Auth header:', req.headers.authorization);

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No token provided or invalid format');
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token extracted:', token ? 'Present' : 'Empty');

  try {
    const decoded = jwt.verify(token, SECRET);
    console.log('Token decoded successfully:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
}