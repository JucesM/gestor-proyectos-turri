import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/shared/Header';
import './ProjectsHome.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

interface Project {
  id: string | number;
  name: string;
  leader: string;
}

interface UserData {
  name: string;
}

const ProjectsHome: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('projects');

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

  const fetchProjects = async (): Promise<void> => {
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
      let projectsData: any[] = [];
      if (data.ok && data.projects) {
        projectsData = data.projects;
      } else if (Array.isArray(data)) {
        projectsData = data;
      } else if (data._embedded && data._embedded.elements) {
        projectsData = data._embedded.elements;
      }

      // Map OpenProject project data to UI format
      const mappedProjects: Project[] = projectsData.map((project: any) => ({
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

  const handleProjectClick = (projectId: string | number): void => {
    // Navigate to project detail page
    // OpenProject uses numeric IDs, so ensure we pass the correct ID
    navigate(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <div className="projects-home">
        <Header activeTab={activeTab} />
        <div className="content">
          <div className="search-container">
            <div className="search-input">
              <span className="search-icon">🔍</span>
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
              <div key={i} className="skeleton">
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
      <Header activeTab={activeTab} />

      {/* Main Content */}
      <div className="content">
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-input">
            <span className="search-icon">🔍</span>
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