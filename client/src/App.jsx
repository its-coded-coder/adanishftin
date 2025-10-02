import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ArticleView from './pages/ArticleView';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Bookmarks from './pages/Bookmarks';
import Purchases from './pages/Purchases';
import AdminDashboard from './pages/admin/Dashboard';
import AdminArticles from './pages/admin/Articles';
import AdminEditor from './pages/admin/Editor';
import AdminUsers from './pages/admin/Users';
import AdminNewsletter from './pages/admin/Newsletter';

const ProtectedRoute = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/" />;
  }

  return children;
};

function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article/:slug" element={<ArticleView />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
        <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/articles" element={<ProtectedRoute adminOnly><AdminArticles /></ProtectedRoute>} />
        <Route path="/admin/articles/new" element={<ProtectedRoute adminOnly><AdminEditor /></ProtectedRoute>} />
        <Route path="/admin/articles/edit/:id" element={<ProtectedRoute adminOnly><AdminEditor /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/newsletter" element={<ProtectedRoute adminOnly><AdminNewsletter /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}