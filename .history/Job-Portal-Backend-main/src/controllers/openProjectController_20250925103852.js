// src/controllers/openProjectController.js
import {
    whoAmIServer,
    listProjectsServer,
    listProjectsUser,
    listMembersServer,
    listWorkPackagesServer,
    verifyUserToken,
    makeClient,
  } from '../services/openProjectService.js';
  
  export async function ping(req, res) {
    try {
      const userToken = req.user?.apiToken;
      if (!userToken) {
        return res.status(401).json({
          ok: false,
          message: 'Token de usuario no encontrado'
        });
      }
      const client = makeClient(userToken);
      const { data } = await client.get('/users/me');
      res.json({ ok: true, me: { id: data.id, name: data.name, email: data.email } });
    } catch (e) {
      res.status(e.response?.status || 500).json({
        ok: false,
        message: e.response?.data?.message || e.message,
        details: e.response?.data,
      });
    }
  }
  
  export async function project(req, res) {
    try {
      const { projectId } = req.params;
      const op = makeClient(process.env.OPENPROJECT_API_TOKEN);
      const { data } = await op.get(`/projects/${projectId}`);
      res.json({ ok: true, project: data });
    } catch (e) {
      res.status(e.response?.status || 500).json({
        ok: false,
        message: e.response?.data?.message || e.message,
        details: e.response?.data,
      });
    }
  }
  
  export async function projects(req, res) {
      try {
        // Use user's API token from JWT instead of server's token
        const userToken = req.user?.apiToken;
        if (!userToken) {
          return res.status(401).json({
            ok: false,
            message: 'Token de usuario no encontrado'
          });
        }
  
        const items = await listProjectsUser(userToken);
        res.json({ ok: true, projects: items });
      } catch (e) {
        res.status(e.response?.status || 500).json({
          ok: false,
          message: e.response?.data?.message || e.message,
          details: e.response?.data,
        });
      }
    }
  
  export async function projectMembers(req, res) {
      try {
        const { projectId } = req.params;
        const userToken = req.user?.apiToken;
        if (!userToken) {
          return res.status(401).json({
            ok: false,
            message: 'Token de usuario no encontrado'
          });
        }

        // Usar el token del usuario para obtener miembros
        const client = makeClient(userToken);
        const { data } = await client.get(`/projects/${projectId}/memberships`);
        const membersWithDetails = await Promise.all(
          (data?._embedded?.elements ?? []).map(async (m) => {
            const userHref = m._links?.principal?.href;
            const userId = userHref ? userHref.split('/').pop() : null;
            let userDetails = null;
            if (userId) {
              const { data: userData } = await client.get(`/users/${userId}`);
              userDetails = {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                status: userData.status
              };
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
        res.json({ ok: true, members: membersWithDetails });
      } catch (e) {
        res.status(e.response?.status || 500).json({
          ok: false,
          message: e.response?.data?.message || e.message,
          details: e.response?.data,
        });
      }
    }
  
  export async function workPackages(req, res) {
      try {
        const { projectId } = req.params;
        const userToken = req.user?.apiToken;
        if (!userToken) {
          return res.status(401).json({
            ok: false,
            message: 'Token de usuario no encontrado'
          });
        }

        const filtersParam = req.query.filters ? JSON.parse(req.query.filters) : [];
        // Usar el token del usuario para obtener work packages
        const client = makeClient(userToken);
        const qs = encodeURIComponent(JSON.stringify(filtersParam));
        const { data } = await client.get(`/projects/${projectId}/work_packages?filters=${qs}`);
        res.json({ ok: true, ...data });
      } catch (e) {
        res.status(e.response?.status || 500).json({
          ok: false,
          message: e.response?.data?.message || e.message,
          details: e.response?.data,
        });
      }
    }
  
  /** Endpoint opcional para “login” con token de OpenProject enviado por el frontend */
  export async function loginWithOpenProjectToken(req, res) {
    try {
      const { apiToken } = req.body;
      if (!apiToken) return res.status(400).json({ ok: false, message: 'Falta apiToken' });
      const me = await verifyUserToken(apiToken);
      res.json({ ok: true, user: { id: me.id, name: me.name, email: me.email } });
    } catch (e) {
      res.status(e.response?.status || 500).json({
        ok: false,
        message: e.response?.data?.message || e.message,
        details: e.response?.data,
      });
    }
  }
  