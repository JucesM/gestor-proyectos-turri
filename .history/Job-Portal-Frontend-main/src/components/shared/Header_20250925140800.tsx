import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiLogOut } from 'react-icons/fi';
import { toast } from 'react-toastify';
import './Header.css';
import { getAvatarUrlSync, getAvatarAccessibilityAttrs } from '../../utils/avatarUtils';

interface HeaderProps {
  activeTab?: string;
  showProjectsLink?: boolean;
}

const Header: React.FC<HeaderProps> = ({ activeTab = 'projects', showProjectsLink = true }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [userInitial, setUserInitial] = useState<string>('U');

  React.useEffect(() => {
    const userData = sessionStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserInitial(user.name ? user.name.charAt(0).toUpperCase() : 'U');
      } catch (e) {
        setUserInitial('U');
      }
    }
  }, []);

  const handleLogout = (): void => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userData');
    navigate('/login');
    toast.success('Sesión cerrada correctamente');
  };

  return (
    <header className="navbar">
      <div className="brand" onClick={() => navigate('/projects')}>
        Gestión de proyectos
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => navigate('/projects')}
        >
          Proyectos
        </button>
        <button
          className={`nav-tab ${activeTab === 'collaborators' ? 'active' : ''}`}
          onClick={() => navigate('/collaborators')}
        >
          Colaboradores
        </button>
        <button
          className={`nav-tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => navigate('/available')}
        >
          Disponible
        </button>
      </nav>

      <div className="user-menu">
        <div
          className="avatar"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {userInitial}
        </div>
        <FiChevronDown
          className="chevron"
          onClick={() => setShowDropdown(!showDropdown)}
        />
        {showDropdown && (
          <div className="user-dropdown">
            <button onClick={handleLogout} className="logout-btn">
              <FiLogOut className="logout-icon" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;