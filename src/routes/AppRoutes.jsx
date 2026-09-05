import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { useUser } from '../components/common/UserContext';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Classrooms from '../pages/Classrooms';
import ClassroomDetails from '../pages/Classrooms/Details';
import Resources from '../pages/Resources';
import Announcements from '../pages/Announcements';
import AIAssistant from '../pages/AIAssistant';
import Workspace from '../pages/Workspace';
import Profile from '../pages/Profile';

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { token, currentUser, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-xs font-bold text-slate-500">Loading Acadrium Session...</p>
        </div>
      </div>
    );
  }

  if (!token && !currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Auth Route Guard (Redirects away from /login if already logged in)
function PublicOnlyRoute({ children }) {
  const { token, currentUser, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-xs font-bold text-slate-500">Loading Acadrium Session...</p>
        </div>
      </div>
    );
  }

  if (token && currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route 
        path="/login" 
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        } 
      />

      {/* Main Workspace Routes protected with ProtectedRoute */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <AppLayout showAiSidebar={true}>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/classrooms" 
        element={
          <ProtectedRoute>
            <AppLayout showAiSidebar={true}>
              <Classrooms />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/classrooms/:id" 
        element={
          <ProtectedRoute>
            <AppLayout showAiSidebar={true}>
              <ClassroomDetails />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/resources" 
        element={
          <ProtectedRoute>
            <AppLayout showAiSidebar={true}>
              <Resources />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/announcements" 
        element={
          <ProtectedRoute>
            <AppLayout showAiSidebar={true}>
              <Announcements />
            </AppLayout>
          </ProtectedRoute>
        } 
      />

      {/* Full AI Assistant page layout */}
      <Route 
        path="/ai-assistant" 
        element={
          <ProtectedRoute>
            <AppLayout showAiSidebar={false}>
              <AIAssistant />
            </AppLayout>
          </ProtectedRoute>
        } 
      />

      {/* Workspace and Profile */}
      <Route 
        path="/workspace" 
        element={
          <ProtectedRoute>
            <AppLayout showAiSidebar={true}>
              <Workspace />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <AppLayout showAiSidebar={true}>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        } 
      />

      {/* Default Redirection */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
