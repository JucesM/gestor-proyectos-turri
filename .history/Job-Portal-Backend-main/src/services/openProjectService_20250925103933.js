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

export function makeClient(token) {
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

/** Verifica identidad con el token proporcionado */
export async function whoAmIServer(token) {
  const client = makeClient(token);
  const { data } = await client.get('/users/me');   // baseURL ya incluye /api/v3
  return data;                                  // objeto User
}

/** Lista proyectos con el token proporcionado */
export async function listProjectsServer(token) {
  const client = makeClient(token);
  const { data } = await client.get('/projects');
  return data?._embedded?.elements ?? [];
}

/** Lista proyectos con el token del usuario */
export async function listProjectsUser(userToken) {
  const client = makeClient(userToken);
  const allProjects = [];
  let page = 1;
  const pageSize = 100; // Request larger pages to minimize requests

  while (true) {
    const { data } = await client.get(`/projects?pageSize=${pageSize}&offset=${(page - 1) * pageSize}`);
    console.log('=== PROJECTS DATA (USER TOKEN) ===');
    console.log('Projects response:', JSON.stringify(data, null, 2));

    const projects = data?._embedded?.elements ?? [];

    if (projects.length === 0) break;

    allProjects.push(...projects);

    // Check if there are more pages
    const total = data?.total || 0;
    if (allProjects.length >= total) break;

    page++;
  }

  console.log('=== ALL USER PROJECTS ===');
  console.log('Total projects found:', allProjects.length);

  return allProjects;
}

/** Obtener detalles de usuario incluyendo email */
export async function getUserDetails(userId, token) {
  try {
    const client = makeClient(token);
    const { data } = await client.get(`/users/${userId}`);
    console.log(`=== USER DETAILS FOR ID ${userId} ===`);
    console.log('User data:', JSON.stringify(data, null, 2));
    console.log('Email:', data.email);

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      status: data.status
    };
  } catch (error) {
    console.error(`Error fetching user details for ID ${userId}:`, error.message);
    return null;
  }
}

/** Miembros por proyecto (vía memberships con filtro por project) */
export async function listMembersServer(projectId) {
  const filters = encodeURIComponent(
    JSON.stringify([{ project: { operator: '=', values: [String(projectId)] } }])
  );
  const { data } = await op.get(`/memberships?filters=${filters}`);

  console.log('=== MEMBERSHIPS DATA ===');
  console.log('Raw memberships response:', JSON.stringify(data, null, 2));

  // Obtener detalles de cada usuario incluyendo email
  const membersWithDetails = await Promise.all(
    (data?._embedded?.elements ?? []).map(async (m) => {
      console.log('=== INDIVIDUAL MEMBERSHIP ===');
      console.log('Membership data:', JSON.stringify(m, null, 2));

      // Extraer userId del href del principal
      const userHref = m._links?.principal?.href;
      const userId = userHref ? userHref.split('/').pop() : null;
      console.log('User href:', userHref);
      console.log('Extracted userId:', userId);

      let userDetails = null;
      if (userId) {
        userDetails = await getUserDetails(userId);
      }

      return {
        id: m.id,
        user: m._links?.principal?.title,
        userId: userId,
        roles: (m._links?.roles || []).map(r => r.title),
        email: userDetails?.email || null
      };
    })
  );

  console.log('=== PROCESSED MEMBERS WITH EMAILS ===');
  console.log('Final members array:', JSON.stringify(membersWithDetails, null, 2));

  return membersWithDetails;
}

/** Work packages del proyecto (puedes pasar filters=[] para traer TODAS) */
export async function listWorkPackagesServer(projectId, filters = []) {
  const qs = encodeURIComponent(JSON.stringify(filters));
  const { data } = await op.get(`/projects/${projectId}/work_packages?filters=${qs}`);

  console.log('=== WORK PACKAGES DATA ===');
  console.log('Work packages response:', JSON.stringify(data, null, 2));
  console.log('Number of work packages:', data?._embedded?.elements?.length || 0);

  // Log assignee information for first few work packages
  if (data?._embedded?.elements) {
    data._embedded.elements.slice(0, 3).forEach((wp, index) => {
      console.log(`Work Package ${index + 1}:`, {
        id: wp.id,
        subject: wp.subject,
        assignee: wp._links?.assignee,
        status: wp._links?.status
      });
    });
  }

  return data; // trae _embedded.elements y total, etc.
}

/** Modo per-user: verifica un token enviado por el cliente */
export async function verifyUserToken(apiToken) {
  const client = makeClient(apiToken);
  const { data } = await client.get('/users/me'); // 200 si el token es válido

  console.log('=== USER AUTHENTICATION DATA ===');
  console.log('User /me response:', JSON.stringify(data, null, 2));
  console.log('Avatar field:', data.avatar);
  console.log('All user fields:', Object.keys(data));

  return data;
}
