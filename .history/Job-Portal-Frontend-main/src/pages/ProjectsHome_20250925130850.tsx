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