import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './components/common/UserContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </BrowserRouter>
  );
}
