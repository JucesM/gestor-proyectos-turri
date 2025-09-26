
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiSearch, FiX, FiChevronDown } from 'react-icons/fi';
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
    // Apply filters and search
    let filtered = collaborators.filter(collab =>
      collab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collab.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collab.email.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [collaborators, searchTerm, filters, sortBy]);

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
