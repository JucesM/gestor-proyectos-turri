import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiLogOut, FiUser, FiEdit } from 'react-icons/fi';
import ProfileEdit from '../ProfileEdit';

// URL base de la API del backend
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

const OpenProjectDashboard = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const [selectedProject, setSelectedProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState({
    projectDetails: false,
    members: false,
    tasks: false,
    profile: false
  });

  // Función para manejar el cierre de sesión
  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    navigate('/login');
    toast.success('Sesión cerrada correctamente');
  };

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
  const handleProfileUpdate = (updatedUser) => {
    setUserProfile(updatedUser);
  };

  // Manejar clic en el lápiz para editar miembro
  const handleEditMember = async (member) => {
    console.log('Editing member:', member);
    try {
      // Buscar información del usuario en la base de datos local por openproject_id
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/users/by-openproject/${member.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const userData = await response.json();
        console.log('User found in DB:', userData.user);
        setSelectedMember(userData.user);
        setShowProfileEdit(true);
      } else if (response.status === 404) {
        // Si no existe en BD local, crear con datos básicos de OpenProject
        console.log('User not found in DB, creating basic user');
        const basicUser = {
          openproject_id: member.id,
          name: member.user || '',
          email: member.email || '',
          roles: member.roles || []
        };
        console.log('Basic user data:', basicUser);
        setSelectedMember(basicUser);
        setShowProfileEdit(true);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(`Error al buscar usuario: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      // Crear con datos básicos si hay error
      const basicUser = {
        openproject_id: member.id,
        name: member.user || '',
        email: member.email || '',
        roles: member.roles || []
      };
      console.log('Fallback basic user data:', basicUser);
      setSelectedMember(basicUser);
      setShowProfileEdit(true);
    }
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
        fetch(`${API_BASE_URL}/projects/projects/${projectId}/work-packages?filters=[{"status_id":{"operator":"=","values":["7"]}}]`, { headers })
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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#FFFFFF'
      }}>
        <div>Cargando proyecto...</div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        height: '88px',
        backgroundColor: '#143568',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        color: 'white'
      }}>
        <div style={{
          fontFamily: 'Pacifico, cursive',
          fontSize: '24px',
          fontWeight: '400'
        }}>
          Gestión de proyectos
        </div>

        <nav style={{
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

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            ∨
          </button>
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
        <div>
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
            {members
              .sort((a, b) => {
                // Function to get role priority (lower number = higher priority)
                const getRolePriority = (member) => {
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
                <div key={member.id} style={{
                  backgroundColor: '#E9E8E6',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
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

                  <div style={{
                    padding: '20px',
                    backgroundColor: '#E9E8E6'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#000000',
                        margin: 0
                      }}>
                        {member.user}
                      </h3>
                      <button
                        onClick={() => handleEditMember(member)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          color: '#666666',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.1)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        title="Editar miembro"
                      >
                        <FiEdit size={16} />
                      </button>
                    </div>

                    <p style={{
                      fontSize: '14px',
                      color: '#666666',
                      marginBottom: '4px'
                    }}>
                      {member.roles?.join(', ') || 'Miembro'}
                    </p>

                    {member.email && (
                      <p style={{
                        fontSize: '12px',
                        color: '#888888',
                        marginBottom: '8px'
                      }}>
                        {member.email}
                      </p>
                    )}

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
                      {currentTask ? `#${currentTask.id}` : 'Sin tarea'}
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

                    <div style={{
                      fontSize: '12px',
                      color: index === 1 ? '#F04A4A' : '#1F4FBF',
                      textAlign: 'center',
                      padding: '8px',
                      backgroundColor: 'rgba(255,255,255,0.5)',
                      borderRadius: '8px'
                    }}>
                      {currentTask?.startDate && currentTask?.dueDate
                        ? `${currentTask.startDate} – ${currentTask.dueDate}`
                        : currentTask?.dueDate
                        ? `– ${currentTask.dueDate}`
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
        <div>
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
                {[
                  { name: 'Jorge', height: 120, color: '#94E9B8' },
                  { name: 'Jhon', height: 88, color: '#000000' },
                  { name: 'Nico', height: 124, color: '#92BFFF' },
                  { name: 'Angie', height: 52, color: '#D4E4FF' },
                  { name: 'Julio', height: 108, color: '#94E9B8' }
                ].map((person) => (
                  <div key={person.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '40px',
                      height: `${person.height}px`,
                      backgroundColor: person.color,
                      borderRadius: '8px 8px 0 0'
                    }}></div>
                    <span style={{ fontSize: '12px', color: '#666666' }}>{person.name}</span>
                  </div>
                ))}
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

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <ProfileEdit
          user={selectedMember}
          onUpdate={handleProfileUpdate}
          onClose={() => setShowProfileEdit(false)}
        />
      )}
    </div>
  );
};

export default OpenProjectDashboard;
