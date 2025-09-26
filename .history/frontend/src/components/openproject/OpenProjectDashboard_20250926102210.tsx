import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '../shared/Header';
import './OpenProjectDashboard.css';
import { getAvatarUrlSync, getAvatarAccessibilityAttrs } from '../../utils/avatarUtils';

// URL base de la API del backend
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

interface Project {
  id?: string | number;
  name?: string;
  identifier?: string;
  _links?: {
    responsible?: {
      title?: string;
    };
  };
}

interface Member {
  id: string | number;
  user: string;
  roles?: string[];
  email?: string;
}

interface Task {
  id: string | number;
  subject?: string;
  startDate?: string;
  dueDate?: string;
  _links?: {
    assignee?: {
      title?: string;
    };
    status?: {
      title?: string;
    };
  };
}

interface UserProfile {
  name?: string;
  // Add other user profile fields as needed
}

interface LoadingState {
  projectDetails: boolean;
  members: boolean;
  tasks: boolean;
  profile: boolean;
}

const OpenProjectDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams<{ id: string }>();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inProgressTasks, setInProgressTasks] = useState<Task[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<LoadingState>({
    projectDetails: false,
    members: false,
    tasks: false,
    profile: false
  });


  // Cargar perfil de usuario
  const loadUserProfile = async () => {
    setLoading(prev => ({ ...prev, profile: true }));
    try {
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  // Actualizar perfil de usuario
  const handleProfileUpdate = (updatedUser: UserProfile): void => {
    setUserProfile(updatedUser);
  };

  // Verificar autenticación y cargar detalles del proyecto al cargar el componente
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');

    if (!token) {
      toast.error('Por favor inicie sesión primero');
      navigate('/login');
      return;
    }


    if (projectId) {
      loadProjectDetails(projectId);
    }

    // Cargar perfil de usuario
    loadUserProfile();
  }, [navigate, projectId]);

  // Cargar detalles del proyecto
  const loadProjectDetails = async (projectId: string): Promise<void> => {
    if (!projectId) return;
    setLoading(prev => ({ ...prev, projectDetails: true }));
    const token = sessionStorage.getItem('authToken');

    if (!token) {
      toast.error('Sesión no válida. Por favor inicie sesión nuevamente.');
      navigate('/login');
      return;
    }

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Obtener detalles del proyecto, miembros y tareas en paralelo
      const [projectRes, membersRes, tasksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/projects/projects/${projectId}`, { headers }),
        fetch(`${API_BASE_URL}/projects/projects/${projectId}/members`, { headers }),
        fetch(`${API_BASE_URL}/projects/projects/${projectId}/work-packages`, { headers })
      ]);

      // Verificar estado de autenticación
      if (projectRes.status === 401 || membersRes.status === 401 || tasksRes.status === 401) {
        sessionStorage.removeItem('authToken');
        toast.error('Sesión expirada. Por favor inicie sesión nuevamente.');
        navigate('/login');
        return;
      }

      // Verificar que las respuestas sean exitosas
      if (!projectRes.ok || !membersRes.ok || !tasksRes.ok) {
        const errorText = await projectRes.text();
        console.error('Error en la respuesta:', errorText);
        throw new Error('Error al cargar los detalles del proyecto');
      }

      const projectData = await projectRes.json();
      const membersData = await membersRes.json();
      const tasksData = await tasksRes.json();

      const project = projectData?.data || projectData?.project || projectData || {};
      const members = Array.isArray(membersData?.data) ? membersData.data
                  : Array.isArray(membersData?.members) ? membersData.members
                  : [];
      console.log('Members data:', members);
      const tasks = Array.isArray(tasksData?.data) ? tasksData.data
                  : Array.isArray(tasksData?._embedded?.elements) ? tasksData._embedded.elements
                  : [];

      setSelectedProject(project);
      setMembers(members);
      setTasks(tasks);

    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Error al cargar los detalles del proyecto. Por favor, intente nuevamente.');
      setSelectedProject(null);
      setMembers([]);
      setTasks([]);
    } finally {
      setLoading(prev => ({ ...prev, projectDetails: false }));
    }
  };

  // Mostrar indicador de carga
  if (loading.projectDetails) {
    return (
      <div className="dashboard">
        <Header activeTab="projects" />
        <div className="dashboard-content">
          <div className="loading-spinner">Cargando proyecto...</div>
        </div>
      </div>
    );
  }

  // Calcular estadísticas para los gráficos
  const statusCounts = tasks.reduce((acc, task) => {
    const status = task._links?.status?.title || 'Desconocido';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalTasks = tasks.length;
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
    percentage: totalTasks > 0 ? ((value / totalTasks) * 100).toFixed(1) : '0'
  }));

  // Tareas completadas (asumiendo que 'Hecha' o 'Cerrada' indican completadas)
  const completedTasks = tasks.filter(task => {
    const status = task._links?.status?.title?.toLowerCase();
    return status?.includes('hecha') || status?.includes('cerrada') || status?.includes('closed');
  });

  const completedByMember = completedTasks.reduce((acc, task) => {
    const assignee = task._links?.assignee?.title;
    if (assignee) {
      acc[assignee] = (acc[assignee] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const barData = members.map(member => ({
    name: member.user,
    tasks: completedByMember[member.user] || 0
  }));

  return (
    <div className="dashboard">
      <Header activeTab="projects" />

      {/* Page Title */}
      <div className="page-header">
        <h1 className="page-title">Actividades en proceso del equipo – {selectedProject?.name || 'Overthere'}</h1>
        <h1 className="page-subtitle">Rendimiento del Equipo</h1>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        <div className="dashboard-grid">
          {/* Left Column - Member Cards */}
          <div className="members-section">
            <div className="members-grid">
              {members
                .sort((a, b) => {
                  // Function to get role priority (lower number = higher priority)
                  const getRolePriority = (member: Member): number => {
                    if (member.roles?.includes('Lider')) return 1;
                    if (member.roles?.includes('Desarrollador')) return 2;
                    return 3; // Everyone else
                  };

                  const aPriority = getRolePriority(a);
                  const bPriority = getRolePriority(b);

                  // Sort by priority first, then by name
                  if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                  }
                  return a.user.localeCompare(b.user);
                })
                .map((member, index) => {
                // Todas las tareas ya están filtradas como "En curso" en el backend
                // Solo necesitamos encontrar la primera tarea asignada a este miembro
                const currentTask = tasks.find(task => {
                  const assignee = task._links?.assignee;
                  return assignee &&
                         assignee.title &&
                         member.user &&
                         assignee.title.toLowerCase().trim() === member.user.toLowerCase().trim();
                });

                return (
                  <div key={member.id} className="member-card">
                    <div className="member-avatar">
                      <img
                        src={getAvatarUrlSync(member.user.split(' ')[0] || member.email || 'member', 'robot')}
                        {...getAvatarAccessibilityAttrs(member.user)}
                      />
                    </div>
                    <div className="member-info">
                      <div className="member-content">
                        <h3 className="member-name">{member.user}</h3>
                        <p className="member-role">{member.roles?.join(', ') || 'Miembro'}</p>
                        <p className="task-label">Tarea en proceso</p>
                        {currentTask ? (
                          <span className="task-badge">TareaID - {currentTask.id}</span>
                        ) : (
                          <span className="no-task">Sin tarea</span>
                        )}
                        <div className="task-description">
                          <p className="description-label">Descripción</p>
                          <p className="description-text">{currentTask?.subject || 'Sin descripción disponible'}</p>
                        </div>
                      </div>
                      <div className="task-dates">
                        {currentTask?.startDate && currentTask?.dueDate ? (
                          <span className="dates-text">
                            {currentTask.startDate} - {currentTask.dueDate}
                          </span>
                        ) : (
                          <span className="no-dates">Sin fechas</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="chart-legend">
                      {pieData.map((item, index) => (
                        <div key={index} className="legend-item">
                          <span className="legend-dot" style={{ backgroundColor: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4] }}></span>
                          <span>{item.name} {item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bar Chart Card */}
                <div className="chart-card">
                  <h3 className="chart-title">Cantidad de tareas realizadas</h3>
                  <div className="bar-chart-placeholder">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="tasks" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="activity-card">
                <div className="activity-tabs">
                  <button className="activity-tab active">Resumen</button>
                  <button className="activity-tab">Asignado</button>
                  <button className="activity-tab">Creado</button>
                </div>
                <div className="activity-list">
                  {[
                    {
                      user: 'Nicolás',
                      avatar: getAvatarUrlSync('Nicolás', 'robot'),
                      issue: 'TareaID -105',
                      status: 'pruebas',
                      message: 'Link de ajustes redirige a página incorrecta (modal desconexión).'
                    },
                    {
                      user: 'Nicolás',
                      avatar: getAvatarUrlSync('Nicolás', 'robot'),
                      issue: 'TareaID -133',
                      status: 'en-proceso',
                      message: 'En group_list_page no se quitan usuarios bloqueados/reportados.'
                    },
                    {
                      user: 'Nicolás',
                      avatar: getAvatarUrlSync('Nicolás', 'robot'),
                      issue: 'REL',
                      status: 'relacion',
                      message: 'Actualizar relación: TareaID -131 ↔ TareaID -133 (marca relación desde 131 a 133).'
                    },
                    {
                      user: 'Jhon',
                      avatar: getAvatarUrlSync('Jhon', 'robot'),
                      issue: 'TareaID -131',
                      status: 'en-proceso',
                      message: 'Error al retornar a mapa después de ser reportado.'
                    },
                    {
                      user: 'Jhon',
                      avatar: getAvatarUrlSync('Jhon', 'robot'),
                      issue: 'TareaID -131',
                      status: 'asignacion',
                      message: 'Añadir/confirmar asignado (jhonbg.turri) para el issue 131.'
                    },
                    {
                      user: 'Julio',
                      avatar: getAvatarUrlSync('Julio', 'robot'),
                      issue: 'TareaID -82',
                      status: 'pruebas',
                      message: 'Temporizador fijo de 15s para tooltip de eventos.'
                    },
                    {
                      user: 'Julio',
                      avatar: getAvatarUrlSync('Julio', 'robot'),
                      issue: 'TareaID -134',
                      status: 'hecha',
                      message: 'Al desbloquear contacto desde bloqueados se reactiva el registro de amistad.'
                    }
                  ].map((activity, index) => (
                    <div key={index} className="activity-item">
                      <img
                        src={getAvatarUrlSync(activity.user.split(' ')[0] || 'user', 'robot')}
                        {...getAvatarAccessibilityAttrs(activity.user || 'Usuario')}
                        className="activity-avatar"
                      />
                      <div className="activity-content">
                        <span className="activity-user">{activity.user}</span>
                        <span className="activity-issue">[{activity.issue}]</span>
                        <span className={`activity-status ${activity.status}`}>
                          {activity.status.replace('-', ' ')}
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

export default OpenProjectDashboard;
