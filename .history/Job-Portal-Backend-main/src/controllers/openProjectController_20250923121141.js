// src/controllers/openProjectController.js
import {
    whoAmIServer,
    listProjectsServer,
    listMembersServer,
    listWorkPackagesServer,
    verifyUserToken,
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
  
  export async function projects(req, res) {
    try {
      const items = await listProjectsServer();
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
      const filtersParam = req.query.filters ? JSON.parse(req.query.filters) : [];
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
  