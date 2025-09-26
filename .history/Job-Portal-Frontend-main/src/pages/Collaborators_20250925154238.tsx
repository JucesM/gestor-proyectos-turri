import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiSearch, FiX, FiChevronDown, FiMessageSquare, FiUserPlus, FiMoreHorizontal } from 'react-icons/fi';
import Header from '../components/shared/Header';
import './Collaborators.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

interface Collaborator {
  id: string;
  name: string;
  role: string;
  email: string;
  team: string;
  seniority: string;
  availability: 'Disponible' | 'Ocupado';
  status: 'Activo' | 'Inactivo';
  photo: string;
}

const Collaborators: React.FC = () => {
  const navigate = useNavigate();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [filteredCollaborators, setFilteredCollaborators] = useState<Collaborator[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<{
    role: string;
    seniority: string;
    team: string;
    availability: string;
    status: string;
  }>({
    role: '',
    seniority: '',
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
      collab.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    if (filters.role) filtered = filtered.filter(c => c.role === filters.role);
    if (filters.seniority) filtered = filtered.filter(c => c.seniority === filters.seniority);
    if (filters.team) filtered = filtered.filter(c => c.team === filters.team);
    if (filters.availability) filtered = filtered.filter(c => c.availability === filters.availability);
    if (filters.status) filtered = filtered.filter(c => c.status === filters.status);

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'es');
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name, 'es');
      if (sortBy === 'recent') return 0; // Assuming no date field
      return 0;
    });

    setFilteredCollaborators(filtered);
  }, [collaborators, debouncedSearchTerm, filters, sortBy]);

  const fetchCollaborators = async (): Promise<void> => {
    try {
      // Mock data since no backend endpoint
      const mockCollaborators: Collaborator[] = [
        {
          id: '1',
          name: 'Ana García',
          role: 'Desarrollador Frontend',
          email: 'ana.garcia@empresa.com',
          team: 'Overthere',
          seniority: 'Senior',
          availability: 'Disponible',
          status: 'Activo',
          photo: 'https://via.placeholder.com/300x200?text=Ana',
        },
        {
          id: '2',
          name: 'Carlos López',
          role: 'Desarrollador Backend',
          email: 'carlos.lopez@empresa.com',
          team: 'Overthere',
          seniority: 'Mid',
          availability: 'Ocupado',
          status: 'Activo',
          photo: 'https://via.placeholder.com/300x200?text=Carlos',
        },
        {
          id: '3',
          name: 'María Rodríguez',
          role: 'UX Designer',
          email: 'maria.rodriguez@empresa.com',
          team: 'Overthere',
          seniority: 'Senior',
          availability: 'Disponible',
          status: 'Activo',
          photo: 'https://via.placeholder.com/300x200?text=María',
        },
        {
          id: '4',
          name: 'Juan Pérez',
          role: 'Project Manager',
          email: 'juan.perez@empresa.com',
          team: 'Overthere',
          seniority: 'Lead',
          availability: 'Disponible',
          status: 'Inactivo',
          photo: 'https://via.placeholder.com/300x200?text=Juan',
        },
      ];

      setCollaborators(mockCollaborators);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      toast.error('Error al cargar colaboradores');
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
      seniority: '',
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
            >
              <option value="">Filtrar por</option>
              <optgroup label="Rol">
                {uniqueValues('role').map(role => (
                  <option key={role} value={`role:${role}`}>{role}</option>
                ))}
              </optgroup>
              <optgroup label="Seniority">
                {uniqueValues('seniority').map(sen => (
                  <option key={sen} value={`seniority:${sen}`}>{sen}</option>
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
            >
              <option value="name-asc">A→Z</option>
              <option value="name-desc">Z→A</option>
              <option value="recent">Recientes</option>
            </select>
            <span className="counter">{filteredCollaborators.length} colaboradores</span>
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