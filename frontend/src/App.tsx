import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UploadPage } from './pages/UploadPage';
import { MapDetailPage } from './pages/MapDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import { useAuthStore } from './context/authStore';
import apiClient from './services/apiClient';

function App() {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    const initializeUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token && !user) {
        try {
          const response = await apiClient.getProfile();
          setUser(response.data);
        } catch (err) {
          console.error('Failed to load user profile');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    };

    initializeUser();
  }, [user, setUser]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-950">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/map/:id" element={<MapDetailPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/user/:id" element={<UserProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
