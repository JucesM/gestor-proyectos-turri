import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FiLogOut, FiUsers, FiCheckCircle, FiClock, FiAlertCircle, 
  FiFolder, FiUser, FiCheckSquare, FiChevronRight, FiAlertTriangle,
  FiPlus, FiMoreVertical, FiMail, FiFileText, FiUpload, FiDownload,
  FiSettings, FiUserPlus
} from 'react-icons/fi';
import './OpenProjectDashboard.css';

// URL base de la API del backend
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

// Nota: Las rutas completas se construyen así:
// - Para autenticación: ${API_BASE_URL}/auth/login
// - Para proyectos: ${API_BASE_URL}/projects/projects

const OpenProjectDashboard = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState({
    projectDetails: false,
    members: false,
    tasks: false
  });

  // Función para manejar el cierre de sesión
  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    navigate('/login');
    toast.success('Sesión cerrada correctamente');
  };

  // Verificar autenticación y cargar detalles del proyecto al cargar el componente
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    console.log('Verificando autenticación. Token presente:', !!token);

    if (!token) {
      console.log('No se encontró token de autenticación, redirigiendo a login');
      toast.error('Por favor inicie sesión primero');
      navigate('/login');
      return;
    }

    if (projectId) {
      console.log('Cargando detalles del proyecto:', projectId);
      loadProjectDetails(projectId);
    }
  }, [navigate, projectId]);


  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Función para calcular el progreso
  const calculateProgress = () => {
    if (!tasks.length) return 0;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  // Cargar detalles del proyecto
  const loadProjectDetails = async (projectId) => {
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
        fetch(`${API_BASE_URL}/projects/projects/${projectId}/work-packages?filters=[]`, { headers })
      ]);

      // Verificar estado de autenticación
      if (projectRes.status === 401 || membersRes.status === 401 || tasksRes.status === 401) {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userData');
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
      // Si tu backend devuelve work packages en HAL, adapta aquí:
      const tasks = Array.isArray(tasksData?.data) ? tasksData.data
                  : Array.isArray(tasksData?._embedded?.elements) ? tasksData._embedded.elements
                  : [];

      setSelectedProject(project);
      setMembers(members);
      setTasks(tasks);

      // Calcular estadísticas básicas
      const totalTasks = tasks.length;
      const openTasks = tasks.filter(task => task.status !== 'Cerrado').length;
      const memberCount = members.length;

      setStats({
        totalTasks,
        openTasks,
        memberCount,
        completionPercentage: totalTasks > 0 ? Math.round(((totalTasks - openTasks) / totalTasks) * 100) : 0
      });

    } catch (error) {
      console.error('Error fetching project details:', error);
      console.error('Full error details:', error);
      toast.error('Error al cargar los detalles del proyecto. Por favor, intente nuevamente.');
      // Resetear estados en caso de error
      setSelectedProject(null);
      setMembers([]);
      setTasks([]);
      setStats(null);
    } finally {
      setLoading(prev => ({ ...prev, projectDetails: false }));
    }
  };

  // Mostrar indicador de carga
  if (loading.projectDetails) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Proyecto</h1>
          <button
            onClick={handleLogout}
            className="btn-logout flex items-center justify-center gap-2 hover:bg-red-600 transition-colors duration-200"
            title="Cerrar sesión"
          >
            <FiLogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>

        <div className="project-details details-skeleton">
          <div className="skeleton-header">
            <div>
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text" style={{ width: '30%' }}></div>
            </div>
            <div className="skeleton" style={{ width: '100px', height: '32px', borderRadius: '9999px' }}></div>
          </div>

          <div className="skeleton skeleton-description"></div>

          <div className="skeleton-stats">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-stat"></div>
            ))}
          </div>

          <div className="skeleton-section">
            <div className="skeleton skeleton-section-title"></div>
            <div className="skeleton-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>
          </div>

          <div className="skeleton-section">
            <div className="skeleton skeleton-section-title"></div>
            <div className="skeleton-grid">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton-card"></div>
              ))}
            </div>

          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="dashboard-container" style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      {/* Header */}
      <header className="dashboard-header" style={{
        height: '88px',
        backgroundColor: '#143568',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        color: 'white'
      }}>
        <div className="logo" style={{
          fontFamily: 'Pacifico, cursive',
          fontSize: '24px',
          fontWeight: '400'
        }}>
          Gestión de proyectos
        </div>

        <nav className="nav-tabs" style={{
          display: 'flex',
          gap: '32px'
        }}>
          <span style={{
            position: 'relative',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            Proyectos
            <div style={{
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60px',
              height: '2px',
              backgroundColor: '#E7B749'
            }}></div>
          </span>
          <span style={{ cursor: 'pointer', opacity: '0.7' }}>Colaboradores</span>
          <span style={{ cursor: 'pointer', opacity: '0.7' }}>Disponible</span>
        </nav>

        <div className="user-menu" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div className="avatar" style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#E9E8E6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#143568'
          }}>
            U
          </div>
          <span style={{ fontSize: '20px' }}>∨</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        padding: '32px',
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '72px',
        maxWidth: '1920px',
        margin: '0 auto'
      }}>
        {/* Left Column */}
        <div className="left-column">
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            color: '#000000',
            marginBottom: '32px',
            fontFamily: 'Inter, SF Pro, Poppins, sans-serif'
          }}>
            Actividades en proceso del equipo – {selectedProject?.name || 'Proyecto'}
          </h1>

          {/* Member Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 198px)',
            gap: '72px 72px',
            rowGap: '28px'
          }}>
            {members.slice(0, 5).map((member, index) => {
              // Get member's tasks
              const memberTasks = tasks.filter(task => {
                const assignee = task._links?.assignee;
                return assignee && assignee.title === member.user;
              }).filter(task => task.status !== 'Cerrado' && task.status !== 'Closed' && task.status !== 'completed');

              const currentTask = memberTasks[0]; // Show first active task

              return (
                <div key={member.id} style={{
                  backgroundColor: '#E9E8E6',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  {/* Photo placeholder */}
                  <div style={{
                    height: '120px',
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: '#143568'
                  }}>
                    {member.user?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  {/* Content */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#E9E8E6'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#000000',
                      marginBottom: '4px'
                    }}>
                      {member.user}
                    </h3>

                    <p style={{
                      fontSize: '14px',
                      color: '#666666',
                      marginBottom: '8px'
                    }}>
                      {member.roles?.join(', ') || 'Miembro'}
                    </p>

                    <p style={{
                      fontSize: '12px',
                      color: '#666666',
                      marginBottom: '8px'
                    }}>
                      Tarea en proceso
                    </p>

                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#000000',
                      marginBottom: '8px'
                    }}>
                      {currentTask ? `OVTHR-${currentTask.id}` : 'Sin tarea'}
                    </p>

                    <p style={{
                      fontSize: '12px',
                      color: '#666666',
                      marginBottom: '12px'
                    }}>
                      Descripción
                    </p>

                    <p style={{
                      fontSize: '14px',
                      color: '#000000',
                      marginBottom: '16px',
                      lineHeight: '1.4'
                    }}>
                      {currentTask?.subject || 'Sin descripción disponible'}
                    </p>

                    {/* Date range */}
                    <div style={{
                      fontSize: '12px',
                      color: index === 1 ? '#F04A4A' : '#1F4FBF', // Red for second card, blue for others
                      textAlign: 'center',
                      padding: '8px',
                      backgroundColor: 'rgba(255,255,255,0.5)',
                      borderRadius: '8px'
                    }}>
                      {currentTask?.dueDate
                        ? `${new Date().toLocaleDateString('es-ES')} – ${new Date(currentTask.dueDate).toLocaleDateString('es-ES')}`
                        : 'Sin fechas'
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="right-column">
          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            color: '#000000',
            marginBottom: '32px',
            fontFamily: 'Inter, SF Pro, Poppins, sans-serif'
          }}>
            Rendimiento del Equipo
          </h1>

          {/* Performance Panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Tasks Donut Chart */}
            <div style={{
              backgroundColor: '#F9F9FA',
              borderRadius: '24px',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#000000',
                marginBottom: '16px'
              }}>
                Tareas
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {/* Donut Chart Placeholder */}
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'conic-gradient(#000000 0% 52.1%, #92BFFF 52.1% 75%, #94E9B8 75% 89%, #D4E4FF 89% 100%)',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'white'
                  }}></div>
                </div>

                {/* Legend */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#666666' }}>Terminadas</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#000000' }}>52.1%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#666666' }}>En Proceso</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#000000' }}>22.8%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#666666' }}>En Pruebas</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#000000' }}>13.9%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: '#666666' }}>Canceladas</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#000000' }}>11.2%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div style={{
              backgroundColor: '#F9F9FA',
              borderRadius: '24px',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#000000',
                marginBottom: '16px'
              }}>
                Cantidad de tareas realizadas – Agosto
              </h3>

              <div style={{ display: 'flex', alignItems: 'end', gap: '16px', height: '200px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '40px',
                    height: '120px',
                    backgroundColor: '#94E9B8',
                    borderRadius: '8px 8px 0 0'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#666666' }}>Jorge</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '40px',
                    height: '88px',
                    backgroundColor: '#000000',
                    borderRadius: '8px 8px 0 0'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#666666' }}>Jhon</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '40px',
                    height: '124px',
                    backgroundColor: '#92BFFF',
                    borderRadius: '8px 8px 0 0'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#666666' }}>Nico</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '40px',
                    height: '52px',
                    backgroundColor: '#D4E4FF',
                    borderRadius: '8px 8px 0 0'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#666666' }}>Angie</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '40px',
                    height: '108px',
                    backgroundColor: '#94E9B8',
                    borderRadius: '8px 8px 0 0'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#666666' }}>Julio</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{
              backgroundColor: '#F9F9FA',
              borderRadius: '24px',
              padding: '24px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#000000',
                marginBottom: '16px'
              }}>
                Actividad reciente
              </h3>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1F4FBF',
                  borderBottom: '2px solid #1F4FBF',
                  paddingBottom: '4px'
                }}>
                  Resumen
                </span>
                <span style={{ fontSize: '14px', color: '#666666' }}>Asignado</span>
                <span style={{ fontSize: '14px', color: '#666666' }}>Creado</span>
              </div>

              {/* Activity List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  "Nicolás · [OVTHR-105] Pruebas — Link de ajustes redirige a página incorrecta (modal desconexión).",
                  "Nicolás · [OVTHR-133] En proceso — En group_list_page no se quitan usuarios bloqueados/reportados.",
                  "Nicolás · [REL] Actualizar relación: OVTHR-131 ↔ OVTHR-133 (marca relación desde 131 a 133).",
                  "Jhon · [OVTHR-131] En proceso — Error al retornar a mapa después de ser reportado.",
                  "Jhon · [OVTHR-131] Asignación — Añadir/confirmar asignado (jhonbg.turri) para el issue 131.",
                  "Julio · [OVTHR-82] Pruebas — Temporizador fijo de 15s para tooltip de eventos.",
                  "Julio · [OVTHR-134] Hecha — Al desbloquear contacto desde bloqueados se reactiva el registro de amistad…",
                ].map((activity, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '8px 0'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#E9E8E6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#143568',
                      flexShrink: 0
                    }}>
                      {activity.split(' · ')[0].charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '14px',
                        color: '#000000',
                        lineHeight: '1.4',
                        margin: 0
                      }}>
                        {activity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
          {loading.projectDetails ? (
            <div className="project-details details-skeleton">
              <div className="skeleton-header">
                <div>
                  <div className="skeleton skeleton-title"></div>
                  <div className="skeleton skeleton-text" style={{ width: '30%' }}></div>
                </div>
                
                <div className="skeleton" style={{ width: '100px', height: '32px', borderRadius: '9999px' }}></div>
              </div>
              
              <div className="skeleton skeleton-description"></div>
              
              <div className="skeleton-stats">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton skeleton-stat"></div>
                ))}
              </div>
              
              <div className="skeleton-section">
                <div className="skeleton skeleton-section-title"></div>
                <div className="skeleton-grid">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton-card"></div>
                  ))}
                </div>
                
              </div>
              
              <div className="skeleton-section">
                <div className="skeleton skeleton-section-title"></div>
                <div className="skeleton-grid">
                  {[1, 2].map((i) => (
                    <div key={i} className="skeleton-card"></div>
                  ))}
                </div>
                
              </div>
            </div>
          ) : selectedProject ? (
            <>
              <div className="project-card">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">{selectedProject.name}</h2>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>Cliente: </span>
                      <span className="font-medium text-gray-700 ml-1">{selectedProject.client}</span>
                    </div>
                
                  </div>
                
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                      {selectedProject.status || 'En progreso'}
                    </span>
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                      {selectedProject.tags?.join(', ') || 'Sin etiquetas'}
                    </span>
                  </div>
                
                </div>
                
                
                {/* Pestañas */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    {['overview', 'tasks', 'team', 'documents', 'settings'].map((tab) => {
                      const tabTitles = {
                        overview: 'Resumen',
                        tasks: 'Tareas',
                        team: 'Equipo',
                        documents: 'Documentos',
                        settings: 'Configuración'
                      };
                      
                      const tabIcons = {
                        overview: <FiFolder className="mr-2" />,
                        tasks: <FiCheckSquare className="mr-2" />,
                        team: <FiUsers className="mr-2" />,
                        documents: <FiFileText className="mr-2" />,
                        settings: <FiSettings className="mr-2" />
                      };
                      
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`${activeTab === tab
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                          {tabIcons[tab]}
                          {tabTitles[tab]}
                        </button>
                      );
                    })}
                  </nav>
                </div>
                
                
                {/* Contenido de las pestañas */}
                <div className="tab-content">
                  {activeTab === 'overview' && (
                    <>
                      {selectedProject.description && (
                        <div className="bg-blue-50 p-4 rounded-lg mb-6">
                          <h3 className="text-sm font-medium text-blue-800 mb-2">Descripción del Proyecto</h3>
                          <p className="text-gray-700">
                            {typeof selectedProject.description === 'object'
                              ? selectedProject.description.raw || selectedProject.description.html || JSON.stringify(selectedProject.description)
                              : selectedProject.description
                            }
                          </p>
                        </div>
                
                      )}
                      
                      {/* Estadísticas */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="stat-card bg-white p-4 rounded-lg border border-gray-200">
                          <div className="text-3xl font-bold text-blue-600 mb-1">{members.length}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <FiUsers className="mr-1" /> Miembros
                          </div>
                        </div>

                        <div className="stat-card bg-white p-4 rounded-lg border border-gray-200">
                          <div className="text-3xl font-bold text-green-500 mb-1">
                            {tasks.filter(task => task.status === 'completed' || task.status === 'Cerrado' || task.status === 'Closed').length}
                            <span className="text-sm font-normal text-gray-500">/{tasks.length}</span>
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <FiCheckCircle className="mr-1" /> Tareas completadas
                          </div>
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${calculateProgress()}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="stat-card bg-white p-4 rounded-lg border border-gray-200">
                          <div className="text-3xl font-bold text-yellow-500 mb-1">
                            {tasks.filter(task => task.status !== 'completed' && task.status !== 'Cerrado' && task.status !== 'Closed').length}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <FiClock className="mr-1" /> Tareas activas
                          </div>
                        </div>

                        <div className="stat-card bg-white p-4 rounded-lg border border-gray-200">
                          <div className="text-3xl font-bold text-purple-600 mb-1">
                            {tasks.filter(task => task._links?.assignee).length}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <FiUser className="mr-1" /> Tareas asignadas
                          </div>
                        </div>
                      </div>

                      {/* Resumen de actividades por miembro */}
                      {members.length > 0 && (
                        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Actividades por Miembro</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {members.map((member) => {
                              const memberTasks = tasks.filter(task => {
                                const assignee = task._links?.assignee;
                                return assignee && (
                                  assignee.title === member.user ||
                                  assignee.href === member.user ||
                                  assignee.href?.includes(`/users/${member.id}`)
                                );
                              });

                              const completedTasks = memberTasks.filter(task =>
                                task.status === 'Cerrado' || task.status === 'Closed' || task.status === 'completed'
                              );
                              const activeTasks = memberTasks.filter(task =>
                                task.status !== 'Cerrado' && task.status !== 'Closed' && task.status !== 'completed'
                              );

                              return (
                                <div key={member.id} className="bg-gray-50 p-4 rounded-lg">
                                  <div className="flex items-center mb-2">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm mr-2">
                                      {member.user?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{member.user}</p>
                                      <p className="text-xs text-gray-500">{member.roles?.join(', ') || 'Miembro'}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Total asignadas:</span>
                                      <span className="font-medium">{memberTasks.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-green-600">Completadas:</span>
                                      <span className="font-medium text-green-600">{completedTasks.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-blue-600">Activas:</span>
                                      <span className="font-medium text-blue-600">{activeTasks.length}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                
                      
                      {/* Fechas y presupuesto */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Fechas del Proyecto</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Inicio:</span>
                              <span className="text-sm font-medium">{formatDate(selectedProject.startDate)}</span>
                            </div>
                
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Fecha límite:</span>
                              <span className="text-sm font-medium">{formatDate(selectedProject.endDate)}</span>
                            </div>
                
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Duración:</span>
                              <span className="text-sm font-medium">
                                {Math.ceil((new Date(selectedProject.endDate) - new Date(selectedProject.startDate)) / (1000 * 60 * 60 * 24))} días
                              </span>
                            </div>
                
                          </div>
                
                        </div>
                
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h3 className="text-sm font-medium text-gray-700 mb-3">Presupuesto</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Presupuesto total:</span>
                              <span className="text-sm font-medium">${selectedProject.budget?.toLocaleString() || '0'}</span>
                            </div>
                
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Gastado:</span>
                              <span className="text-sm font-medium">${selectedProject.spent?.toLocaleString() || '0'}</span>
                            </div>
                
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Restante:</span>
                              <span className="text-sm font-medium">
                                ${(selectedProject.budget - selectedProject.spent)?.toLocaleString() || '0'}
                                <span className="text-xs text-gray-500 ml-1">
                                  (${Math.round((selectedProject.spent / selectedProject.budget) * 100)}% usado)
                                </span>
                              </span>
                            </div>
                
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${Math.min(100, Math.round((selectedProject.spent / selectedProject.budget) * 100))}%` }}
                              ></div>
                            </div>
                
                          </div>
                
                        </div>
                
                      </div>
                
                    </>
                  )}
                  
                  {activeTab === 'tasks' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Tareas del Proyecto</h3>
                        <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <FiPlus className="mr-1" /> Nueva Tarea
                        </button>
                      </div>
                
                      
                      <div className="overflow-hidden bg-white shadow sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {tasks.map((task) => {
                            const isCompleted = task.status === 'completed';
                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
                            
                            return (
                              <li key={task.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={isCompleted}
                                      onChange={() => {}}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <div className="ml-3">
                                      <div className={`flex items-center ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                        {task.title}
                                        {isOverdue && (
                                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Vencida
                                          </span>
                                        )}
                                      </div>
                
                                      <div className="text-sm text-gray-500 mt-1">
                                        <span className="mr-3">Asignada a: {task.assignee?.name}</span>
                                        <span>Vence: {formatDate(task.dueDate)}</span>
                                      </div>
                
                                    </div>
                
                                  </div>
                
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      isCompleted 
                                        ? 'bg-green-100 text-green-800' 
                                        : isOverdue
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {isCompleted ? 'Completada' : isOverdue ? 'Atrasada' : 'En progreso'}
                                    </span>
                                    <button className="text-gray-400 hover:text-gray-500">
                                      <FiMoreVertical />
                                    </button>
                                  </div>
                
                                </div>
                
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                
                    </div>
                
                  )}
                  
                  {activeTab === 'team' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Miembros del Equipo y sus Actividades</h3>
                        <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <FiUserPlus className="mr-1" /> Agregar miembro
                        </button>
                      </div>


                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {members.map((member) => {
                            // Find tasks assigned to this member
                            const memberTasks = tasks.filter(task => {
                              const assignee = task._links?.assignee;
                              const assigneeName = assignee?.title;
                              const memberName = member.user;
                              // Try exact match first, then case-insensitive
                              return assigneeName && (
                                assigneeName === memberName ||
                                assigneeName.toLowerCase() === memberName.toLowerCase()
                              );
                            });

                            const completedTasks = memberTasks.filter(task => task.status === 'Cerrado' || task.status === 'Closed');
                            const inProgressTasks = memberTasks.filter(task =>
                              task.status !== 'Cerrado' && task.status !== 'Closed' && task.status !== 'completed'
                            );

                            return (
                              <li key={member.id}>
                                <div className="px-4 py-6 sm:px-6">
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                                        {member.user?.charAt(0).toUpperCase() || 'U'}
                                      </div>
                                    </div>

                                    <div className="min-w-0 flex-1 ml-4">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm font-medium text-blue-600">{member.user}</p>
                                          <p className="mt-1 flex items-center text-sm text-gray-500">
                                            {member.roles?.join(', ') || 'Miembro del equipo'}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm text-gray-900 font-medium">
                                            {memberTasks.length} tareas asignadas
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {completedTasks.length} completadas • {inProgressTasks.length} en progreso
                                          </div>
                                        </div>
                                      </div>

                                      {/* Tasks assigned to this member */}
                                      {memberTasks.length > 0 && (
                                        <div className="mt-4">
                                          <h4 className="text-sm font-medium text-gray-900 mb-2">Actividades asignadas:</h4>
                                          <div className="space-y-2">
                                            {memberTasks.slice(0, 3).map((task) => {
                                              const isCompleted = task.status === 'Cerrado' || task.status === 'Closed' || task.status === 'completed';
                                              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;

                                              return (
                                                <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                                  <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                                      {task.subject}
                                                    </p>
                                                    <div className="flex items-center mt-1">
                                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        isCompleted
                                                          ? 'bg-green-100 text-green-800'
                                                          : isOverdue
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                      }`}>
                                                        {isCompleted ? 'Completada' : isOverdue ? 'Atrasada' : 'En progreso'}
                                                      </span>
                                                      {task.dueDate && (
                                                        <span className="ml-2 text-xs text-gray-500">
                                                          Vence: {formatDate(task.dueDate)}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                            {memberTasks.length > 3 && (
                                              <p className="text-xs text-gray-500 mt-2">
                                                +{memberTasks.length - 3} tareas más...
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {memberTasks.length === 0 && (
                                        <div className="mt-4 text-sm text-gray-500 italic">
                                          No hay tareas asignadas actualmente
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                    </div>

                  )}
                  
                  {activeTab === 'documents' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Documentos del Proyecto</h3>
                        <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <FiUpload className="mr-1" /> Subir documento
                        </button>
                      </div>
                
                      
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {selectedProject.attachments?.length > 0 ? (
                            selectedProject.attachments.map((file) => (
                              <li key={file.id}>
                                <div className="px-4 py-4 flex items-center sm:px-6 hover:bg-gray-50">
                                  <div className="min-w-0 flex-1 flex items-center">
                                    <div className="flex-shrink-0">
                                      <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                                        <FiFileText className="h-5 w-5 text-gray-400" />
                                      </div>
                
                                    </div>
                
                                    <div className="min-w-0 flex-1 px-4">
                                      <div>
                                        <p className="text-sm font-medium text-blue-600 truncate">{file.name}</p>
                                        <p className="mt-1 text-sm text-gray-500">{file.size}</p>
                                      </div>
                
                                    </div>
                
                                  </div>
                
                                  <div>
                                    <button className="text-gray-400 hover:text-gray-500">
                                      <FiDownload className="h-5 w-5" />
                                    </button>
                                  </div>
                
                                </div>
                
                              </li>
                            ))
                          ) : (
                            <div className="px-4 py-12 text-center sm:px-6">
                              <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay archivos</h3>
                              <p className="text-gray-500 text-sm">
                                Sube archivos para compartirlos con tu equipo.
                              </p>
                              <div className="mt-6">
                                <button
                                  type="button"
                                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <FiUpload className="-ml-1 mr-2 h-5 w-5" />
                                  Subir archivo
                                </button>
                              </div>
                
                            </div>
                
                          )}
                        </ul>
                      </div>
                
                    </div>
                
                  )}
                  
                  {activeTab === 'settings' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-6">Configuración del Proyecto</h3>
                        
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                          <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Información del Proyecto</h3>
                          </div>
                
                          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                              <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Nombre del Proyecto</dt>
                                <dd className="mt-1 text-sm text-gray-900">{selectedProject.name}</dd>
                              </div>
                
                              <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Cliente</dt>
                                <dd className="mt-1 text-sm text-gray-900">{selectedProject.client || 'No especificado'}</dd>
                              </div>
                
                              <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Fecha de inicio</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedProject.startDate)}</dd>
                              </div>
                
                              <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Fecha de finalización</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedProject.endDate)}</dd>
                              </div>
                
                              <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Descripción</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                  {selectedProject.description
                                    ? (typeof selectedProject.description === 'object'
                                        ? selectedProject.description.raw || selectedProject.description.html || JSON.stringify(selectedProject.description)
                                        : selectedProject.description
                                      )
                                    : 'Sin descripción'
                                  }
                                </dd>
                              </div>
                            </dl>
                          </div>
                
                          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                            <button
                              type="button"
                              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Editar Proyecto
                            </button>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Miembros del Equipo</h3>
                          {members.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {members.map((member, index) => {
                                const colors = [
                                  'bg-blue-100 text-blue-800',
                                  'bg-green-100 text-green-800',
                                  'bg-purple-100 text-purple-800',
                                  'bg-pink-100 text-pink-800',
                                  'bg-yellow-100 text-yellow-800'
                                ][index % 5];
                                
                                return (
                                  <div key={member.id} className="flex items-center p-4 bg-white rounded-lg border border-gray-200">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colors} font-medium flex-shrink-0`}>
                                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </div>
                                    <div className="ml-4 flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                                      <p className="text-sm text-gray-500">{member.role || 'Miembro del equipo'}</p>
                                    </div>
                                    {member.email && (
                                      <a 
                                        href={`mailto:${member.email}`} 
                                        className="ml-2 p-2 text-gray-400 hover:text-gray-500"
                                        title={`Enviar correo a ${member.email}`}
                                      >
                                        <FiMail className="h-5 w-5" />
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                              <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay miembros</h3>
                              <p className="mt-1 text-sm text-gray-500">Aún no se han agregado miembros a este proyecto.</p>
                              <div className="mt-4">
                                <button
                                  type="button"
                                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <FiUserPlus className="-ml-1 mr-2 h-5 w-5" />
                                  Agregar Miembro
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                          <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Zona de peligro</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                              Acciones que no se pueden deshacer. Tenga cuidado.
                            </p>
                          </div>
                
                          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">Eliminar este proyecto</h4>
                                <p className="text-sm text-gray-500 mt-1">
                                  Una vez que elimines un proyecto, no hay vuelta atrás. Por favor, ten cuidado.
                                </p>
                              </div>
                
                              <button
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Eliminar Proyecto
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'overview' && (
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Tareas Recientes</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                          Ver todas <FiChevronRight className="inline ml-1" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                    {tasks.length > 0 ? (
                      tasks.slice(0, 5).map((task) => {
                        const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
                        const isCompleted = task.status === 'completed';
                        
                        return (
                          <div key={task.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors duration-200">
                            <div className="flex items-start">
                              <button className={`mt-1 mr-3 rounded-full p-1 ${isCompleted 
                                ? 'text-green-500 bg-green-50' 
                                : isOverdue 
                                  ? 'text-red-500 bg-red-50' 
                                  : 'text-blue-500 bg-blue-50'}`}>
                                {isCompleted ? (
                                  <FiCheckCircle size={20} />
                                ) : isOverdue ? (
                                  <FiAlertCircle size={20} />
                                ) : (
                                  <FiClock size={20} />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                  {task.title}
                                </h4>
                                <div className="flex items-center mt-1 text-sm text-gray-500">
                                  <span 
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      isCompleted 
                                        ? 'bg-green-100 text-green-800' 
                                        : isOverdue 
                                          ? 'bg-red-100 text-red-800' 
                                          : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {isCompleted ? 'Completada' : isOverdue ? 'Atrasada' : 'En progreso'}
                                  </span>
                                  {task.dueDate && (
                                    <span className="ml-2">
                                      Vence: {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                
                                {task.assignee && (
                                  <div className="mt-2 flex items-center">
                                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                                      {task.assignee.name.charAt(0).toUpperCase()}
                                    </div>
                
                                    <span className="ml-2 text-sm text-gray-600">
                                      {task.assignee.name}
                                    </span>
                                  </div>
                
                                )}
                              </div>
                
                            </div>
                
                          </div>
                
                        );
                      })
                    ) : (
                      <div className="empty-state">
                        <FiCheckSquare className="text-4xl mb-2 text-gray-400" />
                        <h3 className="text-gray-600 font-medium">No hay tareas</h3>
                        <p className="text-gray-500 text-sm">Aún no se han creado tareas en este proyecto</p>
                      </div>
                    )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="bg-blue-100 p-4 rounded-full mb-4 inline-block">
                <FiFolder className="text-blue-600 text-4xl" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">Selecciona un proyecto</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Haz clic en un proyecto de la lista para ver sus detalles, miembros y tareas asociadas.
              </p>
            </div>
          )}
        </div>
    </div>
  );
};

export default OpenProjectDashboard;
