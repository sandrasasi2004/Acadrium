import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';

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

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Main App Workspace Routes wrapped in AppLayout (with AI panel visible) */}
      <Route 
        path="/dashboard" 
        element={
          <AppLayout showAiSidebar={true}>
            <Dashboard />
          </AppLayout>
        } 
      />
      <Route 
        path="/classrooms" 
        element={
          <AppLayout showAiSidebar={true}>
            <Classrooms />
          </AppLayout>
        } 
      />
      <Route 
        path="/classrooms/:id" 
        element={
          <AppLayout showAiSidebar={true}>
            <ClassroomDetails />
          </AppLayout>
        } 
      />
      <Route 
        path="/resources" 
        element={
          <AppLayout showAiSidebar={true}>
            <Resources />
          </AppLayout>
        } 
      />
      <Route 
        path="/announcements" 
        element={
          <AppLayout showAiSidebar={true}>
            <Announcements />
          </AppLayout>
        } 
      />

      {/* Full AI Assistant page layout (Right sidebar AI panel hidden since page is already a chat) */}
      <Route 
        path="/ai-assistant" 
        element={
          <AppLayout showAiSidebar={false}>
            <AIAssistant />
          </AppLayout>
        } 
      />

      {/* Workspace and Profile (Right sidebar AI panel visible) */}
      <Route 
        path="/workspace" 
        element={
          <AppLayout showAiSidebar={true}>
            <Workspace />
          </AppLayout>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <AppLayout showAiSidebar={true}>
            <Profile />
          </AppLayout>
        } 
      />

      {/* Default Redirection */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
