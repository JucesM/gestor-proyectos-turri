import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown, FiLogOut } from 'react-icons/fi';
import { toast } from 'react-toastify';

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
    <header className="fixed top-0 left-0 right-0 h-18 bg-blue-900 flex items-center justify-between px-6 shadow-md z-50">
      <div className="font-pacifico text-xl text-white font-normal cursor-pointer" onClick={() => navigate('/projects')}>
        Gestión de proyectos
      </div>

      <nav className="flex gap-8">
        <button
          className={`bg-none border-none text-white/70 text-base font-semibold py-2 cursor-pointer relative transition-colors hover:text-white ${activeTab === 'projects' ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.75 after:bg-yellow-500 after:rounded-t' : ''}`}
          onClick={() => navigate('/projects')}
        >
          Proyectos
        </button>
        <button
          className={`bg-none border-none text-white/70 text-base font-semibold py-2 cursor-pointer relative transition-colors hover:text-white ${activeTab === 'collaborators' ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.75 after:bg-yellow-500 after:rounded-t' : ''}`}
        >
          Colaboradores
        </button>
        <button
          className={`bg-none border-none text-white/70 text-base font-semibold py-2 cursor-pointer relative transition-colors hover:text-white ${activeTab === 'available' ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.75 after:bg-yellow-500 after:rounded-t' : ''}`}
        >
          Disponible
        </button>
      </nav>

      <div className="relative flex items-center gap-2 cursor-pointer group">
        <div
          className="w-9 h-9 bg-yellow-500 rounded-full flex items-center justify-center text-white font-semibold text-base"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {userInitial}
        </div>
        <FiChevronDown
          className="text-white"
          onClick={() => setShowDropdown(!showDropdown)}
        />
        {showDropdown && (
          <div className="absolute top-full right-0 bg-white rounded-lg shadow-lg py-2 min-w-40 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transform -translate-y-2.5 group-hover:translate-y-0 transition-all duration-200">
            <button onClick={handleLogout} className="w-full px-4 py-3 bg-none border-none text-left text-blue-900 text-sm cursor-pointer flex items-center gap-2 hover:bg-gray-50">
              <FiLogOut className="text-base" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;