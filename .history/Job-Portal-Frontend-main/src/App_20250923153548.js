import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

// Lazy load components
const Login = lazy(() => import("./pages/Login"));
const ProjectsHome = lazy(() => import("./pages/ProjectsHome"));
const OpenProjectDashboard = lazy(() => import("./components/openproject/OpenProjectDashboard"));

const App = () => {
  return (
    <Router>
      <Suspense fallback={<div className="loading">Cargando...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/projects" element={<OpenProjectDashboard />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer 
        position="top-center" 
        autoClose={3000} 
        hideProgressBar={false} 
        closeOnClick
        theme="colored"
      />
    </Router>
  );
};

export default App;
