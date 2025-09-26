import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiSearch, FiX, FiChevronDown, FiMessageSquare, FiUserPlus, FiMoreHorizontal } from 'react-icons/fi';
import Header from '../components/shared/Header';
import { generateAvatarUrl } from '../../utils/avatarUtils';
import './Collaborators.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

interface Collaborator {
  id: string;
  name: string;
  role: string;
  email?: string;
  team: string;
  seniority?: string;
  availability: 'Disponible' | 'Ocupado';
  status: 'Activo' | 'Inactivo';
  photo: string;
  userId: number;
}

const Collaborators: React.FC = () => {
  const navigate = useNavigate();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [filteredCollaborators, setFilteredCollaborators] = useState<Collaborator[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<{
    role: string;
    team: string;
    availability: string;
    status: string;
  }>({
    role: '',
    team: '',
    availability: '',
    status: '',
  });
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [groupByRole, setGroupByRole] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('colaboradores');

  useEffect(() => {
    // Check authentication
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      toast.error('Por favor inicie sesión primero');
      navigate('/login');
      return;
    }

    // Fetch collaborators
    fetchCollaborators();
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Apply filters and search
    let filtered = collaborators.filter(collab =>
      collab.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      collab.role.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (collab.email && collab.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    );

    if (filters.role) filtered = filtered.filter(c => c.role === filters.role);
    if (filters.team) filtered = filtered.filter(c => c.team === filters.team);
    if (filters.availability) filtered = filtered.filter(c => c.availability === filters.availability);
    if (filters.status) filtered = filtered.filter(c => c.status === filters.status);

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'es');
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name, 'es');
      if (sortBy === 'recent') return 0; // Assuming no date field
      if (sortBy === 'role') return a.role.localeCompare(b.role, 'es');
      return 0;
    });

    setFilteredCollaborators(filtered);
  }, [collaborators, debouncedSearchTerm, filters, sortBy]);

  const fetchCollaborators = async (): Promise<void> => {
    try {
      setError(false);
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/memberships?pageSize=1000`, {
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

      let memberships: any[] = [];
      if (data._embedded && data._embedded.elements) {
        memberships = data._embedded.elements;
      } else if (Array.isArray(data)) {
        memberships = data;
      }

      // Map to Collaborator
      const mappedCollaborators: Collaborator[] = memberships.map((membership: any) => {
        const userId = parseInt(membership._links.principal.href.split('/').pop());
        const name = membership._links.principal.title;
        const role = membership._links.roles && membership._links.roles.length > 0 ? membership._links.roles[0].title : 'Sin rol';
        const team = membership._links.project.title;
        const photo = getAvatarUrlSync(name.split(' ')[0] || name, 'robot');

        return {
          id: membership.id.toString(),
          name,
          role,
          team,
          availability: 'Disponible' as const, // Default
          status: 'Activo' as const, // Default
          photo,
          userId,
        };
      });

      setCollaborators(mappedCollaborators);

      if (mappedCollaborators.length === 0) {
        toast.info('No se encontraron colaboradores');
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      setError(true);
      setErrorMessage('Error al cargar colaboradores desde el servidor');
      setCollaborators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      team: '',
      availability: '',
      status: '',
    });
    setSearchTerm('');
  };

  const activeFilters = Object.values(filters).filter(v => v !== '');

  const uniqueValues = (key: keyof Collaborator) => {
    return Array.from(new Set(collaborators.map(c => c[key])));
  };

  if (loading) {
    return (
      <div className="collaborators-page">
        <Header activeTab={activeTab} />
        <div className="content">
          <div className="controls-bar">
            <div className="search-input">
              <FiSearch className="search-icon" />
              <input type="text" placeholder="Buscar por nombre, rol o correo…" readOnly />
            </div>
            <div className="filters-row">
              <select className="filter-select" disabled>
                <option>Filtrar por</option>
              </select>
              <select className="sort-select" disabled>
                <option>Ordenar</option>
              </select>
            </div>
          </div>
          <div className="collaborators-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="collaborator-card skeleton">
                <div className="card-photo"></div>
                <div className="card-content">
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text"></div>
                  <div className="skeleton-text"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="collaborators-page">
        <Header activeTab={activeTab} />
        <div className="content">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>{errorMessage}</h3>
            <button onClick={fetchCollaborators} className="retry-btn">Reintentar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="collaborators-page">
      <Header activeTab={activeTab} />

      <div className="content">
        <div className="controls-bar">
          <div className="search-input">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre, rol o correo…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar colaboradores"
            />
          </div>
          <div className="filters-row">
            <select
              className="filter-select"
              value=""
              onChange={(e) => {
                const [key, value] = e.target.value.split(':');
                if (key && value && !filters[key as keyof typeof filters]) {
                  handleFilterChange(key as keyof typeof filters, value);
                }
                (e.target as HTMLSelectElement).value = '';
              }}
              aria-label="Filtrar colaboradores"
            >
              <option value="">Filtrar por</option>
              <optgroup label="Rol">
                {uniqueValues('role').map(role => (
                  <option key={role} value={`role:${role}`}>{role}</option>
                ))}
              </optgroup>
              <optgroup label="Equipo">
                {uniqueValues('team').map(team => (
                  <option key={team} value={`team:${team}`}>{team}</option>
                ))}
              </optgroup>
              <optgroup label="Disponibilidad">
                {uniqueValues('availability').map(avail => (
                  <option key={avail} value={`availability:${avail}`}>{avail}</option>
                ))}
              </optgroup>
              <optgroup label="Estado">
                {uniqueValues('status').map(stat => (
                  <option key={stat} value={`status:${stat}`}>{stat}</option>
                ))}
              </optgroup>
            </select>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Ordenar colaboradores"
            >
              <option value="name-asc">A→Z</option>
              <option value="name-desc">Z→A</option>
              <option value="recent">Recientes</option>
              <option value="role">Rol</option>
            </select>
            <button
              className={`group-toggle ${groupByRole ? 'active' : ''}`}
              onClick={() => setGroupByRole(!groupByRole)}
            >
              {groupByRole ? 'Desagrupar' : 'Agrupar por rol'}
            </button>
            <span className="counter" style={{ marginLeft: 'auto' }}>{filteredCollaborators.length} colaboradores</span>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="active-filters">
            {activeFilters.map((filter, index) => (
              <span key={index} className="filter-chip">
                {filter}
                <FiX onClick={() => {
                  // Find which filter to clear
                  const filterKeys = Object.keys(filters) as (keyof typeof filters)[];
                  const keyToClear = filterKeys.find(key => filters[key] === filter);
                  if (keyToClear) handleFilterChange(keyToClear, '');
                }} />
              </span>
            ))}
            <button className="clear-filters-btn" onClick={clearFilters}>
              Limpiar filtros
            </button>
          </div>
        )}

        {filteredCollaborators.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No encontramos colaboradores con esos criterios</h3>
            <button onClick={clearFilters}>Limpiar filtros</button>
          </div>
        ) : groupByRole ? (
          <div className="grouped-collaborators">
            {Object.entries(
              filteredCollaborators.reduce((groups, collab) => {
                const role = collab.role;
                if (!groups[role]) groups[role] = [];
                groups[role].push(collab);
                return groups;
              }, {} as Record<string, Collaborator[]>)
            ).map(([role, collabs]) => (
              <div key={role} className="role-group">
                <h2 className="role-header">{role} ({collabs.length})</h2>
                <div className="collaborators-grid">
                  {collabs.map((collab) => (
                    <div key={collab.id} className="collaborator-card">
                      <div className="card-photo">
                        <img src={collab.photo} alt={collab.name} loading="lazy" />
                        <div className="card-overlay">
                          <span>Ver perfil</span>
                        </div>
                      </div>
                      <div className="card-content">
                        <h3 className="collaborator-name">{collab.name}</h3>
                        <p className="collaborator-role">{collab.role}</p>
                        <p className="collaborator-team">{collab.team}</p>
                        <div className="collaborator-status">
                          <span className={`status-badge ${collab.availability.toLowerCase()}`}>
                            {collab.availability}
                          </span>
                        </div>
                      </div>
                      <div className="card-actions">
                        <FiMessageSquare className="action-icon" />
                        <FiUserPlus className="action-icon" />
                        <FiMoreHorizontal className="action-icon" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="collaborators-grid">
            {filteredCollaborators.map((collab) => (
              <div key={collab.id} className="collaborator-card">
                <div className="card-photo">
                  <img src={collab.photo} alt={collab.name} loading="lazy" />
                  <div className="card-overlay">
                    <span>Ver perfil</span>
                  </div>
                </div>
                <div className="card-content">
                  <h3 className="collaborator-name">{collab.name}</h3>
                  <p className="collaborator-role">{collab.role}</p>
                  <p className="collaborator-team">{collab.team}</p>
                  <div className="collaborator-status">
                    <span className={`status-badge ${collab.availability.toLowerCase()}`}>
                      {collab.availability}
                    </span>
                  </div>
                </div>
                <div className="card-actions">
                  <FiMessageSquare className="action-icon" />
                  <FiUserPlus className="action-icon" />
                  <FiMoreHorizontal className="action-icon" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collaborators;