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
      <div className="login-form">
        <h2>Iniciar sesión con OpenProject</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuario de OpenProject</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="usuario@ejemplo.com"
            />
          </div>
          
          <div className="form-group">
            <label>Token de API</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Ingresa tu token de API"
            />
            <div className="form-hint">
              <small>Usa tu token de API de OpenProject como contraseña</small>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="btn-login"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner"></span>
            ) : (
              'Iniciar sesión con OpenProject'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
