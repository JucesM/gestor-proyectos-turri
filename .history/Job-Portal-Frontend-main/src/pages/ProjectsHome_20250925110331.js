import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiSearch, FiChevronDown, FiLogOut } from 'react-icons/fi';
import './ProjectsHome.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

const ProjectsHome = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');

  // No mock data - will fetch from API

  useEffect(() => {
    // Check authentication
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      toast.error('Por favor inicie sesión primero');
      navigate('/login');
      return;
    }

    // Fetch projects from API
    fetchProjects();
  }, [navigate]);

  const fetchProjects = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/projects/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        sessionStorage.removeItem('authToken');
        toast.error('Sesión expirada. Por favor inicie sesión nuevamente.');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle different response formats from backend
      let projectsData = [];
      if (data.ok && data.projects) {
        projectsData = data.projects;
      } else if (Array.isArray(data)) {
        projectsData = data;
      } else if (data._embedded && data._embedded.elements) {
        projectsData = data._embedded.elements;
      }

      // Map OpenProject project data to UI format
      const mappedProjects = projectsData.map(project => ({
        id: project.id || project.identifier,
        name: project.name || 'Sin nombre',
        leader: project.leader || project._links?.responsible?.title || 'Por asignar'
      }));

      setProjects(mappedProjects);

      if (mappedProjects.length === 0) {
        toast.info('No se encontraron proyectos disponibles');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error al cargar proyectos desde OpenProject');
      setProjects([]); // Set empty array instead of mock data
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.leader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userData');
    navigate('/login');
    toast.success('Sesión cerrada correctamente');
  };

  const handleProjectClick = (projectId) => {
    // Navigate to project detail page
    // OpenProject uses numeric IDs, so ensure we pass the correct ID
    navigate(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <div className="projects-home">
        <div className="navbar">
          <div className="brand" style={{cursor: 'pointer'}} onClick={() => navigate('/projects')}>Gestión de proyectos</div>
          <div className="nav-tabs">
            <button className="nav-tab active">Proyectos</button>
            <button className="nav-tab">Colaboradores</button>
            <button className="nav-tab">Disponible</button>
          </div>
          <div className="user-menu">
            <div className="avatar">U</div>
            <FiChevronDown className="chevron" />
          </div>
        </div>
        <div className="content">
          <div className="search-container">
            <div className="search-input">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar..."
                value=""
                readOnly
              />
            </div>
          </div>
          <div className="loading-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="project-card skeleton">
                <div className="skeleton-title"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-home">
      {/* Navbar */}
      <div className="navbar">
        <div className="brand">Gestión de proyectos</div>
        <nav className="nav-tabs" role="tablist">
          <button
            className={`nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
            role="tab"
            aria-selected={activeTab === 'projects'}
          >
            Proyectos
          </button>
          <button
            className={`nav-tab ${activeTab === 'collaborators' ? 'active' : ''}`}
            onClick={() => setActiveTab('collaborators')}
            role="tab"
            aria-selected={activeTab === 'collaborators'}
          >
            Colaboradores
          </button>
          <button
            className={`nav-tab ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
            role="tab"
            aria-selected={activeTab === 'available'}
          >
            Disponible
          </button>
        </nav>
        <div className="user-menu">
          <div className="avatar">U</div>
          <FiChevronDown className="chevron" />
          <div className="user-dropdown">
            <button onClick={handleLogout} className="logout-btn">
              <FiLogOut className="logout-icon" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content">
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-input">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar proyectos"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="project-card"
              onClick={() => handleProjectClick(project.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleProjectClick(project.id);
                }
              }}
              aria-label={`Proyecto ${project.name}, líder ${project.leader}`}
            >
              <h3 className="project-title">{project.name}</h3>
              <div className="project-info">
                <span className="project-label">Líder</span>
                <span className="project-leader">{project.leader}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectsHome;