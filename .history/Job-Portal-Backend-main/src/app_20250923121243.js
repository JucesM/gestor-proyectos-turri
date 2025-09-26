// src/app.js
import express from 'express';
import cors from 'cors';
import openprojectRoutes from './routes/openproject.routes.js';
// ... (tus otros imports y config)

const app = express();
app.use(cors());
app.use(express.json());

// monta las rutas
app.use('/api', openprojectRoutes);

// ... listen(...)
