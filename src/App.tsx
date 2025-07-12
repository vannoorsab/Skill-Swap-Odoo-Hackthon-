import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/common/Header';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminProtectedRoute from './components/common/AdminProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import UserDetailPage from './pages/UserDetailPage';
import RequestPage from './pages/RequestPage';
import RequestsDashboard from './pages/RequestsDashboard';
import AdminPanel from './pages/AdminPanel';
import AdminLoginPage from './pages/AdminLoginPage';
import SavedProfilesPage from './pages/SavedProfilesPage';
import LeaderboardPage from './pages/LeaderboardPage';
import { collection, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from './firebase/config';

const USERS_PER_PAGE = 10;

function App() {
  let q = query(
    collection(db, 'users'),
    where('isPublic', '==', true),
    orderBy('createdAt', 'desc'),
    limit(USERS_PER_PAGE)
  );

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/user/:userId" element={<UserDetailPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/request/:userId"
              element={
                <ProtectedRoute>
                  <RequestPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <RequestsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <SavedProfilesPage />
                </ProtectedRoute>
              }
            />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route path="/admin" element={
              <AdminProtectedRoute>
                <AdminPanel />
              </AdminProtectedRoute>
            } />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;