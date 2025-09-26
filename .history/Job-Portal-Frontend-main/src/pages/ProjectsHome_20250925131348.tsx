import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiSearch } from 'react-icons/fi';
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
      <div className="dashboard">
        <Header activeTab={activeTab} />
        <div className="dashboard-content">
          <div className="loading-spinner">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header activeTab={activeTab} />

      {/* Page Title */}
      <div className="page-header">
        <h1 className="page-title">Actividades en proceso del equipo – Overthere</h1>
        <h1 className="page-subtitle">Rendimiento del Equipo</h1>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        <div className="dashboard-grid">
          {/* Left Column - Member Cards */}
          <div className="members-section">
            <div className="members-grid">
              {members.map((member) => (
                <div key={member.id} className="member-card">
                  <div className="member-avatar">
                    <img src={member.avatar} alt={member.name} />
                  </div>
                  <div className="member-info">
                    <h3 className="member-name">{member.name}</h3>
                    <p className="member-role">{member.role}</p>
                    <p className="task-label">Tarea en proceso</p>
                    <span className="task-badge">{member.task.issue}</span>
                    <div className="task-description">
                      <p className="description-label">Descripción</p>
                      <p className="description-text">{member.task.description}</p>
                    </div>
                    <div className="task-dates">
                      {member.task.startDate && member.task.endDate ? (
                        <span className="dates-text">
                          {member.task.startDate} - {member.task.endDate}
                        </span>
                      ) : (
                        <span className="no-dates">Sin fechas</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Performance Panel */}
          <div className="performance-section">
            <div className="performance-card">
              <h2 className="performance-title">Rendimiento del Equipo</h2>

              {/* Charts */}
              <div className="charts-container">
                {/* Pie Chart Card */}
                <div className="chart-card">
                  <h3 className="chart-title">Estado de Tareas</h3>
                  <div className="pie-chart-placeholder">
                    <div className="pie-chart"></div>
                    <div className="chart-legend">
                      <div className="legend-item">
                        <span className="legend-dot completed"></span>
                        <span>Terminadas 52.1%</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot in-progress"></span>
                        <span>En Proceso 22.8%</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot testing"></span>
                        <span>En Pruebas 13.9%</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot cancelled"></span>
                        <span>Canceladas 11.2%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bar Chart Card */}
                <div className="chart-card">
                  <h3 className="chart-title">Cantidad de tareas realizadas – Agosto</h3>
                  <div className="bar-chart-placeholder">
                    <div className="bar-chart">
                      <div className="bar-item">
                        <span className="bar-label">Jorge</span>
                        <div className="bar" style={{width: '85%'}}></div>
                      </div>
                      <div className="bar-item">
                        <span className="bar-label">Jhon</span>
                        <div className="bar" style={{width: '70%'}}></div>
                      </div>
                      <div className="bar-item">
                        <span className="bar-label">Nico</span>
                        <div className="bar" style={{width: '60%'}}></div>
                      </div>
                      <div className="bar-item">
                        <span className="bar-label">Angie</span>
                        <div className="bar" style={{width: '75%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="activity-card">
                <div className="activity-tabs">
                  <button
                    className={`activity-tab ${activityTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setActivityTab('summary')}
                  >
                    Resumen
                  </button>
                  <button
                    className={`activity-tab ${activityTab === 'assigned' ? 'active' : ''}`}
                    onClick={() => setActivityTab('assigned')}
                  >
                    Asignado
                  </button>
                  <button
                    className={`activity-tab ${activityTab === 'created' ? 'active' : ''}`}
                    onClick={() => setActivityTab('created')}
                  >
                    Creado
                  </button>
                </div>
                <div className="activity-list">
                  {activities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <img src={activity.user.avatar} alt={activity.user.name} className="activity-avatar" />
                      <div className="activity-content">
                        <span className="activity-user">{activity.user.name}</span>
                        <span className="activity-issue">[{activity.issue}]</span>
                        <span className={`activity-status ${activity.status.toLowerCase().replace(' ', '-')}`}>
                          {activity.status}
                        </span>
                        <p className="activity-message">{activity.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsHome;