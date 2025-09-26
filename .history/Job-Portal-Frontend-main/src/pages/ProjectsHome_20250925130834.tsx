import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Header from '../components/shared/Header';
import './ProjectsHome.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

interface Member {
  id: number;
  name: string;
  role: string;
  avatar: string;
  task: {
    issue: string;
    description: string;
    startDate?: string;
    endDate?: string;
  };
}

interface ActivityItem {
  id: number;
  user: {
    name: string;
    avatar: string;
  };
  issue: string;
  status: string;
  message: string;
}

const ProjectsHome: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('projects');
  const [activityTab, setActivityTab] = useState<string>('summary');

  useEffect(() => {
    // Check authentication
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      toast.error('Por favor inicie sesión primero');
      navigate('/login');
      return;
    }

    // Load mock data for dashboard
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = (): void => {
    // Mock data for the dashboard
    const mockMembers: Member[] = [
      {
        id: 1,
        name: 'Jorge Martínez',
        role: 'Desarrollador Frontend',
        avatar: '/api/placeholder/150/150',
        task: {
          issue: 'OVTHR-188',
          description: 'Implementar el sistema de autenticación de usuarios con integración OAuth2 y manejo de sesiones seguras.',
          startDate: '2024-09-15',
          endDate: '2024-09-30'
        }
      },
      {
        id: 2,
        name: 'Jhon López',
        role: 'Desarrollador Backend',
        avatar: '/api/placeholder/150/150',
        task: {
          issue: 'OVTHR-156',
          description: 'Optimizar las consultas a la base de datos y implementar índices para mejorar el rendimiento.',
          startDate: '2024-09-10',
          endDate: '2024-09-25'
        }
      },
      {
        id: 3,
        name: 'Nico Ramírez',
        role: 'Diseñador UX/UI',
        avatar: '/api/placeholder/150/150',
        task: {
          issue: 'OVTHR-201',
          description: 'Rediseñar la interfaz de usuario del dashboard principal con enfoque en usabilidad.',
          startDate: '2024-09-20',
          endDate: '2024-10-05'
        }
      },
      {
        id: 4,
        name: 'Angie Julio',
        role: 'QA Tester',
        avatar: '/api/placeholder/150/150',
        task: {
          issue: 'OVTHR-134',
          description: 'Crear suite de pruebas automatizadas para la funcionalidad de reportes.',
          startDate: '2024-09-12',
          endDate: '2024-09-28'
        }
      }
    ];

    const mockActivities: ActivityItem[] = [
      {
        id: 1,
        user: { name: 'Jorge Martínez', avatar: '/api/placeholder/32/32' },
        issue: 'OVTHR-105',
        status: 'Pruebas',
        message: 'Actualizó el estado de la tarea a "En pruebas"'
      },
      {
        id: 2,
        user: { name: 'Jhon López', avatar: '/api/placeholder/32/32' },
        issue: 'OVTHR-98',
        status: 'En proceso',
        message: 'Comentó en la tarea'
      },
      {
        id: 3,
        user: { name: 'Nico Ramírez', avatar: '/api/placeholder/32/32' },
        issue: 'OVTHR-112',
        status: 'Hecha',
        message: 'Marcó la tarea como completada'
      }
    ];

    setMembers(mockMembers);
    setActivities(mockActivities);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="projects-home">
        <Header activeTab={activeTab} />
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