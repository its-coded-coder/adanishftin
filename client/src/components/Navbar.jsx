import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Publishing Platform
            </Link>
            <div className="ml-10 flex space-x-4">
              <Link to="/" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Articles
              </Link>
              <Link to="/collections" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Collections
              </Link>
              {user && (
                <>
                  <Link to="/bookmarks" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                    Bookmarks
                  </Link>
                  <Link to="/purchases" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                    Purchases
                  </Link>
                </>
              )}
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/search" className="text-gray-700 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            {user ? (
              <>
                <NotificationCenter />
                <Link to="/profile" className="text-gray-700 hover:text-gray-900">
                  {user.name}
                </Link>
                <button
                  onClick={logout}
                  className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}