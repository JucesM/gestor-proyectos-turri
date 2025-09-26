// src/services/openProjectService.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL  = process.env.OPENPROJECT_URL || '';
const API_TOKEN = process.env.OPENPROJECT_API_TOKEN || '';
const TIMEOUT   = Number(process.env.OPENPROJECT_TIMEOUT || 30000);

function normalizeBaseUrl(url) {
  let u = url || '';
  if (!/^https?:\/\//i.test(u)) u = 'http://' + u;
  u = u.replace(/\/+$/, '');
  if (!/\/api\/v3$/i.test(u)) u += '/api/v3';
  return u;
}

function buildAuthHeader(token) {
  return 'Basic ' + Buffer.from(`apikey:${token}`).toString('base64');
}

function makeClient(token) {
  const baseURL = normalizeBaseUrl(BASE_URL);
  if (!BASE_URL || !token) {
    throw new Error('[OpenProject] Falta OPENPROJECT_URL o token');
  }
  return axios.create({
    baseURL,                                // .../api/v3
    timeout: TIMEOUT,
    headers: {
      Accept: 'application/hal+json',
      'Content-Type': 'application/json',
      Authorization: buildAuthHeader(token),
    },
  });
}

/** Cliente del servidor (usa el token del .env) */
const op = makeClient(API_TOKEN);

/** Verifica identidad con el token del .env */
export async function whoAmIServer() {
  const { data } = await op.get('/users/me');   // baseURL ya incluye /api/v3
  return data;                                  // objeto User
}

/** Lista proyectos con el token del .env */
export async function listProjectsServer() {
  const { data } = await op.get('/projects');
  return data?._embedded?.elements ?? [];
}

/** Miembros por proyecto (vía memberships con filtro por project) */
export async function listMembersServer(projectId) {
  const filters = encodeURIComponent(
    JSON.stringify([{ project: { operator: '=', values: [String(projectId)] } }])
  );
  const { data } = await op.get(`/memberships?filters=${filters}`);
  return (data?._embedded?.elements ?? []).map(m => ({
    id: m.id,
    user: m._links?.principal?.title,
    roles: (m._links?.roles || []).map(r => r.title),
  }));
}

/** Work packages del proyecto (puedes pasar filters=[] para traer TODAS) */
export async function listWorkPackagesServer(projectId, filters = []) {
  const qs = encodeURIComponent(JSON.stringify(filters));
  const { data } = await op.get(`/projects/${projectId}/work_packages?filters=${qs}`);
  return data; // trae _embedded.elements y total, etc.
}

/** Modo per-user: verifica un token enviado por el cliente */
export async function verifyUserToken(apiToken) {
  const client = makeClient(apiToken);
  const { data } = await client.get('/users/me'); // 200 si el token es válido
  return data;
}
