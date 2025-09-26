import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiSearch, FiChevronDown, FiLogOut } from 'react-icons/fi';

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
  const [userInitial, setUserInitial] = useState<string>('U');

  // No mock data - will fetch from API

  useEffect(() => {
    // Check authentication
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      toast.error('Por favor inicie sesión primero');
      navigate('/login');
      return;
    }

    // Get user initial
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserInitial(user.name ? user.name.charAt(0).toUpperCase() : 'U');
      } catch (e) {
        setUserInitial('U');
      }
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

  const handleLogout = (): void => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userData');
    navigate('/login');
    toast.success('Sesión cerrada correctamente');
  };

  const handleProjectClick = (projectId: string | number): void => {
    // Navigate to project detail page
    // OpenProject uses numeric IDs, so ensure we pass the correct ID
    navigate(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter">
        <div className="fixed top-0 left-0 right-0 h-18 bg-blue-900 flex items-center justify-between px-6 shadow-md z-50">
          <div className="font-pacifico text-xl text-white font-normal cursor-pointer" onClick={() => navigate('/projects')}>Gestión de proyectos</div>
          <div className="flex gap-8">
            <button className="bg-none border-none text-white/70 text-base font-semibold py-2 cursor-pointer relative transition-colors hover:text-white">Proyectos</button>
            <button className="bg-none border-none text-white/70 text-base font-semibold py-2 cursor-pointer relative transition-colors hover:text-white">Colaboradores</button>
            <button className="bg-none border-none text-white/70 text-base font-semibold py-2 cursor-pointer relative transition-colors hover:text-white">Disponible</button>
          </div>
          <div className="relative flex items-center gap-2 cursor-pointer">
            <div className="w-9 h-9 bg-yellow-500 rounded-full flex items-center justify-center text-white font-semibold text-base">{userInitial}</div>
            <FiChevronDown className="text-white text-base" />
          </div>
        </div>
        <div className="pt-24 px-6">
          <div className="mb-6">
            <div className="relative max-w-full">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Buscar..."
                value=""
                readOnly
                className="w-full h-13 pl-13 pr-5 border border-gray-300 rounded-xl text-base bg-white shadow-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-55 h-30 bg-gradient-to-br from-gray-200 to-gray-100 rounded-xl">
                <div className="h-6 w-18 bg-gray-300 rounded mb-3"></div>
                <div className="h-3.5 w-12 bg-gray-300 rounded mb-1"></div>
                <div className="h-3.5 w-10 bg-gray-300 rounded mb-1"></div>
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
        <div className="brand" style={{cursor: 'pointer'}} onClick={() => navigate('/projects')}>Gestión de proyectos</div>
        <nav className="nav-tabs" role="tablist">
          <button
            className={`nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => { setActiveTab('projects'); navigate('/projects'); }}
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
          <div className="avatar">{userInitial}</div>
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