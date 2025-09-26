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
      const me = await whoAmIServer();
      res.json({ ok: true, me: { id: me.id, name: me.name, email: me.email } });
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
  
        // For now, using server token for members. Could be updated to use user token if needed
        const items = await listMembersServer(projectId);
        res.json({ ok: true, members: items });
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
        // For now, using server token for work packages. Could be updated to use user token if needed
        const data = await listWorkPackagesServer(projectId, filtersParam);
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
  