import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import './Login.css';

const Login = () => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Autenticación con OpenProject
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          apiToken: password // El campo password contiene el token de API
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      // Verificamos diferentes formatos de respuesta exitosa
      if (response.data?.success || response.data?.ok || response.data?.token) {
        toast.success("¡Inicio de sesión exitoso!");
        
        // Extraer token y datos de usuario de la respuesta
        const token = response.data.token || response.data.data?.token;
        const user = response.data.user || response.data.data?.user || { username };
        
        // Almacenar token y datos de usuario
        if (token) {
          sessionStorage.setItem('authToken', token);
        }
        
        sessionStorage.setItem('userData', JSON.stringify({
          isLoggedIn: true,
          userData: user
        }));
        
        // Redirigir al dashboard de OpenProject
        navigate('/openproject');
      } else {
        // Si la respuesta no tiene el formato esperado
        console.error('Formato de respuesta inesperado:', response.data);
        toast.error(response.data?.message || "Error en la autenticación");
      }
    } catch (error) {
      console.error("Error during login:", error);
      const errorMessage = error.response?.data?.message || 
                         "Error al conectar con el servidor. Por favor, intente nuevamente.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-content">
          <h1 className="login-title">
            Gestor de<br />
            Proyectos<br />
            Turrisystem
          </h1>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="login-input"
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="login-input"
              />
            </div>

            <button
              type="submit"
              className="btn-entrar"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner"></span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="login-right">
        <div className="logo-container">
          <img src="../assets/images/LogoTurri.png" alt="Logo Turri" className="logo-image" />
        </div>
      </div>
    </div>
  );
};

export default Login;
