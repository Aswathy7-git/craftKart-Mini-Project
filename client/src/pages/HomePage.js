import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import { productsAPI } from '../services/api';
import { 
  Search, 
  Star, 
  Heart, 
  ShoppingCart, 
  Sparkles,
  Users,
  Award,
  ArrowRight,
} from 'lucide-react';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
 
  const [trendingProducts, setTrendingProducts] = useState([]);
  const { isAuthenticated, user } = useAuth();


  

  // Fetch trending products
  const { isLoading: trendingLoading } = useQuery(
    'trending-products',
    () => productsAPI.getProducts({ trending: true, limit: 8 }),
    {
      onSuccess: (data) => setTrendingProducts(data.data.products)
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const categories = [
    {
      name: 'Jewelry',
      image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=800&auto=format&fit=crop',
      count: '1,234 items'
    },
    {
      name: 'Home Decor',
      image: 'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?q=80&w=800&auto=format&fit=crop',
      count: '2,156 items'
    },
    {
      name: 'Art',
      image: 'https://images.unsplash.com/photo-1461344577544-4e5dc9487184?q=80&w=800&auto=format&fit=crop',
      count: '3,421 items'
    },
    {
      name: 'Textiles',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSoVGdkN3qqS0eGv6uAN9FpApHSSLyoBO4PlQ&s',
      count: '1,876 items'
    },
    {
      name: 'Pottery',
      image: 'https://media.istockphoto.com/id/1490094933/photo/female-sculptor-making-clay-mug-in-a-home-workshop-hands-close-up-small-business.jpg?s=612x612&w=0&k=20&c=9cskpRm8Ci0W2XFAf4PO5IEoUU_1dsDIFWgUdp-5DtU=',
      count: '987 items'
    },
    {
      name: 'Woodwork',
      image: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=800&auto=format&fit=crop',
      count: '1,543 items'
    }
  ];



  const stats = [
    { label: 'Artisans', value: '10,000+', icon: Users },
    { label: 'Products', value: '50,000+', icon: Sparkles },
    { label: 'Happy Customers', value: '100,000+', icon: Heart },
    { label: 'Countries', value: '50+', icon: Award }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Discover Unique
              <span className="text-gradient block">Handmade Crafts</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with talented artisans from around the world. Every item tells a story of creativity, 
              passion, and exceptional craftsmanship.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for handmade crafts, jewelry, art..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pl-14 pr-32 text-lg border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-soft"
                />
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 btn-primary px-6 py-2"
                >
                  Search
                </button>
              </div>
            </form>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products" className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2">
                <span>Explore Products</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              {isAuthenticated && (user?.role === 'seller' || user?.role === 'admin') && (
                <Link to="/seller/products/add" className="btn-outline text-lg px-8 py-4">
                  Start Selling
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover amazing handmade products across different categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                to={`/products?category=${category.name.toLowerCase().replace(' ', '-')}`}
                className="group card-hover p-6 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden bg-gray-100">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    width="80"
                    height="80"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/placeholder-product.jpg';
                    }}
                  />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* Trending Products Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Trending Now
              </h2>
              <p className="text-xl text-gray-600">
                Popular items that everyone's loving right now
              </p>
            </div>
            <Link
              to="/login"
              className="btn-outline flex items-center space-x-2"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {trendingLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="card p-4">
                  <div className="shimmer h-48 rounded-lg mb-4"></div>
                  <div className="shimmer h-4 rounded mb-2"></div>
                  <div className="shimmer h-4 w-2/3 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {trendingProducts
                .filter((p) => p?.images?.[0]?.url)
                .map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
            </div>
          )}
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-secondary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of artisans and customers who are already part of our community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-white text-primary-600 hover:bg-gray-50 font-medium py-3 px-8 rounded-lg transition-colors duration-200">
              Start Shopping
            </Link>
            <Link to="/register?role=seller" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-colors duration-200">
              Become a Seller
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product }) => {
  const [isLiked, setIsLiked] = useState(false);
  const navigate = useNavigate();
  const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n) || 0);

  return (
    <div
      className="card-hover group cursor-pointer"
      onClick={() => navigate('/login')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/login'); } }}
    >
      <div className="relative">
        <img
          src={product.images[0].url}
          alt={product.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <button
          onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
        </button>
        {product.sustainability?.isEcoFriendly && (
          <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Eco-Friendly
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">{product.category}</span>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">4.8</span>
          </div>
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.shortDescription}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">{formatINR(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">{formatINR(product.originalPrice)}</span>
            )}
          </div>
          <button className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors duration-200">
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
