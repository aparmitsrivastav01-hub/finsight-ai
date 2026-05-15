import { Routes, Route } from 'react-router-dom';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Landing from './pages/Landing';
import FinGPT from './pages/FinGPT';
import Login from './pages/Login';
import Register from './pages/Register';

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
    </Routes>
  );
}

export default App;
