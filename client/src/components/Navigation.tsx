/**
 * Navigation component with auth-aware menu.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, Package, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavigationProps {
  cartItemCount?: number;
  onCartClick?: () => void;
}

export function Navigation({ cartItemCount = 0, onCartClick }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const displayName = user?.profile?.firstName || user?.email?.split('@')[0] || 'Account';

  return (
    <nav className="bg-[#FFFAF7] border-b border-[#F5E6E0] sticky top-0 z-50 shadow-sm backdrop-blur-sm">
      <div className="max-w-container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Left */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img
              src="/thithi_logo.jpg"
              alt="Thi Thi"
              className="h-16 w-16 object-contain rounded-full hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Cart Button - Center (Always visible on all screen sizes) */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 px-5 py-2.5 bg-[#FFFAF7] border-2 border-burmese-ruby text-burmese-ruby rounded-lg hover:bg-burmese-ruby hover:text-white transition-all duration-300 shadow-sm hover:shadow-md group"
            >
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-semibold hidden sm:inline">Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-golden-saffron text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full animate-pulse shadow-lg">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

          {/* Desktop Account Menu - Right */}
          <div className="hidden md:flex items-center gap-6">
            {/* Account Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-5 py-2.5 text-gray-700 hover:text-burmese-ruby transition-all duration-300 rounded-lg hover:bg-[#FFF0E8] group"
                >
                  <User className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-medium">{displayName}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <Link
                        to="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <Package className="w-4 h-4" />
                        My Orders
                      </Link>
                      {user?.role !== 'customer' && (
                        <Link
                          to="/seller"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                        >
                          <User className="w-4 h-4" />
                          Dashboard
                        </Link>
                      )}
                      <hr className="my-2 border-gray-200" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-5 py-2.5 text-gray-700 hover:text-burmese-ruby transition-all duration-300 rounded-lg hover:bg-[#FFF0E8] group"
              >
                <User className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium">Sign in</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button - Right */}
          <button
            className="md:hidden p-2 text-gray-700 hover:text-burmese-ruby transition-colors duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-fade-in">
            <div className="flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  >
                    <Package className="w-5 h-5" />
                    My Orders
                  </Link>
                  {user?.role !== 'customer' && (
                    <Link
                      to="/seller"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                    >
                      <User className="w-5 h-5" />
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                >
                  <User className="w-5 h-5" />
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
