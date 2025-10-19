import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { 
  ShoppingCart, 
  Heart, 
  User, 
  Search, 
  Menu, 
  X,
  LogOut,
  Settings,
  Package,
  BarChart3,
  Shield
} from 'lucide-react';
import { aiAPI, productsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const [aiBusy, setAiBusy] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuth();
  const { getCartItemCount, getWishlistCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getNavLinks = () => {
    if (!isAuthenticated) {
      return [
        { name: 'Home', path: '/' },
        { name: 'Products', path: '/products' }
      ];
    }

    const baseLinks = [
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' }
    ];

    if (user?.role === 'seller' || user?.role === 'admin') {
      baseLinks.push(
        { name: 'Dashboard', path: '/seller/dashboard', icon: BarChart3 },
        { name: 'Orders', path: '/seller/orders', icon: Package }
      );
    }

    if (user?.role === 'admin') {
      baseLinks.push(
        { name: 'Admin', path: '/admin/dashboard', icon: Shield }
      );
    }

    return baseLinks;
  };

  return (
    <nav className="bg-white shadow-soft sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-gradient">CraftKart</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {getNavLinks().map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8" ref={suggestBoxRef}>
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for handmade crafts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <button
                  type="button"
                  title="Search by image"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                >
                  {/* simple camera icon using SVG to avoid new deps */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h3l2-2h8l2 2h3v12H3V7z" />
                    <circle cx="12" cy="13" r="3" strokeWidth="2"></circle>
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Image too large. Please upload under 5MB.');
                      e.target.value = '';
                      return;
                    }
                    try {
                      setAiBusy(true);
                      const fd = new FormData();
                      fd.append('image', file);
                      const res = await aiAPI.analyzeImage(fd);
                      const data = res?.data || {};
                      const tags = data.tags || data.labels || data.suggestions || [];
                      const list = Array.isArray(tags) ? tags.map(String).filter(Boolean) : [];
                      const similar = Array.isArray(data.similarProducts) ? data.similarProducts : [];
                      if (similar.length > 0) {
                        const q = list[0] || '';
                        setSearchQuery(q);
                        setSuggestions(list.slice(0, 8));
                        setShowSuggestions(false);
                        navigate('/products', { state: { similarProducts: similar, fromImage: true, q } });
                      } else if (list.length > 0) {
                        setSearchQuery(list[0]);
                        setSuggestions(list.slice(0, 8));
                        setShowSuggestions(true);
                        navigate(`/products?search=${encodeURIComponent(list[0])}`);
                      } else {
                        // Try a basic fallback: search by filename (without extension)
                        const fallback = (file.name || '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
                        if (fallback) {
                          setSearchQuery(fallback);
                          navigate(`/products?search=${encodeURIComponent(fallback)}`);
                        }
                      }
                    } catch (err) {
                      const msg = err?.response?.data?.message || 'Image analysis failed';
                      toast.error(msg);
                    } finally {
                      setAiBusy(false);
                      e.target.value = '';
                    }
                  }}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-medium overflow-hidden">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSearchQuery(s);
                          setSuggestions([]);
                          setShowSuggestions(false);
                          navigate(`/products?search=${encodeURIComponent(s)}`);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {s}
                      </button>
                    ))}
                    {aiBusy && (
                      <div className="px-3 py-2 text-xs text-gray-500">Analyzing image…</div>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              <ShoppingCart className="w-6 h-6" />
              {isAuthenticated && getCartItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              <Heart className="w-6 h-6" />
              {isAuthenticated && getWishlistCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getWishlistCount()}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
                >
                  <User className="w-6 h-6" />
                  <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-medium border border-gray-200 py-1 z-50">
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Package className="w-4 h-4" />
                      <span>My Orders</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-outline">Login</Link>
                <Link to="/register" className="btn-primary">Register</Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4" ref={suggestBoxRef}>
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for handmade crafts..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-medium overflow-hidden">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSearchQuery(s);
                        setSuggestions([]);
                        setShowSuggestions(false);
                        navigate(`/products?search=${encodeURIComponent(s)}`);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {getNavLinks().map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive(link.path)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Debounce suggestions fetching
export function useAISuggestions(query, setSuggestions, setShowSuggestions) {
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let active = true;
    const t = setTimeout(async () => {
      try {
        // Try AI suggestions first
        const res = await aiAPI.searchSuggest(query.trim(), 5);
        if (!active) return;
        const list = res?.data?.suggestions || [];
        if (list.length > 0) {
          setSuggestions(list);
        } else {
          // Fallback to product titles if AI returns empty
          const fres = await productsAPI.getProducts({ search: query.trim(), limit: 5 });
          if (!active) return;
          const items = fres?.data?.products || fres?.data?.items || [];
          const names = items.map((p) => p.name).filter(Boolean).slice(0, 5);
          setSuggestions(names);
        }
      } catch (_) {
        // On AI error, fallback to product titles
        try {
          const fres = await productsAPI.getProducts({ search: query.trim(), limit: 5 });
          if (!active) return;
          const items = fres?.data?.products || fres?.data?.items || [];
          const names = items.map((p) => p.name).filter(Boolean).slice(0, 5);
          setSuggestions(names);
        } catch {
          if (active) setSuggestions([]);
        }
      }
    }, 300);
    return () => { active = false; clearTimeout(t); };
  }, [query, setSuggestions, setShowSuggestions]);
}

// Close suggestions when clicking outside
export function useClickAway(ref, onAway) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onAway();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onAway]);
}

// Hook up effects inside component
Navbar.defaultProps = {};
function EffectsBinder({ query, setSuggestions, setShowSuggestions, boxRef }) {
  useAISuggestions(query, setSuggestions, setShowSuggestions);
  useClickAway(boxRef, () => setShowSuggestions(false));
  return null;
}

export default Navbar;
