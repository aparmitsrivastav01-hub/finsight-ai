import { Routes, Route } from 'react-router-dom';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Landing from './pages/Landing';
import FinGPT from './pages/FinGPT';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminApp from './admin';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/fingpt"
        element={
          <ProtectedRoute>
            <FinGPT />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/*" element={<AdminApp />} />
    </Routes>
  );
}

export default App;
