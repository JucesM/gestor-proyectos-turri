// src/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import openprojectRoutes from './routes/openproject.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import { checkConnection } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos de avatares
app.use('/avatars', express.static('uploads/avatars'));

// Verificar conexión a la base de datos
checkConnection().catch(err => {
  console.error('Error connecting to database:', err);
  process.exit(1);
});

// Monta las rutas
app.use('/api', openprojectRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

