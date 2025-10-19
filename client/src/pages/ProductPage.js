import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productsAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { 
  Search, 
  Grid, 
  List, 
  Star, 
  Heart, 
  ShoppingCart,
  SlidersHorizontal
} from 'lucide-react';

const ProductPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page')) || 1
  });

  const { data, isLoading, error } = useQuery(
    ['products', filters],
    () => productsAPI.getProducts(filters),
    {
      keepPreviousData: true
    }
  );

  const location = useLocation();
  const visualState = location.state || {};
  const visualProducts = Array.isArray(visualState.similarProducts) ? visualState.similarProducts : [];
  const isVisualMode = visualState.fromImage === true && visualProducts.length > 0;

  const products = isVisualMode ? visualProducts : (data?.data?.products || []);
  // Only render products that have essential fields to avoid blank cards
  const visibleProducts = products.filter((p) => {
    if (!p || typeof p !== 'object') return false;
    const hasName = typeof p.name === 'string' && p.name.trim().length > 0;
    const hasPrice = p.price !== undefined && p.price !== null;
    const imgUrl = p?.images?.[0]?.url;
    const hasImage = typeof imgUrl === 'string' && imgUrl.trim().length > 0;
    return hasName && hasPrice && hasImage;
  });
  const pagination = data?.data?.pagination || {};

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'jewelry', label: 'Jewelry' },
    { value: 'home-decor', label: 'Home Decor' },
    { value: 'art', label: 'Art' },
    { value: 'textiles', label: 'Textiles' },
    { value: 'pottery', label: 'Pottery' },
    { value: 'woodwork', label: 'Woodwork' },
    { value: 'metalwork', label: 'Metalwork' },
    { value: 'paper-crafts', label: 'Paper Crafts' },
    { value: 'candles', label: 'Candles' },
    { value: 'soaps', label: 'Soaps' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'other', label: 'Other' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' }
  ];



  // Category-specific fallback image pools to diversify visuals when product images are missing or repetitive
const CATEGORY_IMAGE_POOL = {
  'jewelry': [
    'https://images.unsplash.com/photo-1516637090014-cb1ab0d08fc7?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=800&auto=format&fit=crop'
  ],
  'home-decor': [
    'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800&auto=format&fit=crop',
    'https://tse1.mm.bing.net/th/id/OIP.MJtn5DvLvjcWurDLrPjQGQHaHM?cb=12&pid=ImgDet&w=200&h=193&c=7&dpr=1.6&o=7&rm=3'
  ],
  'art': [
    'https://images.unsplash.com/photo-1461344577544-4e5dc9487184?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504198266285-165a13a76c76?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=800&auto=format&fit=crop'
  ],
  'textiles': [
    'https://images.unsplash.com/photo-1530629013299-6cb10b0303f0?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=800&auto=format&fit=crop'
  ],
  'pottery': [
    'https://images.unsplash.com/photo-1602526432604-029a3f8b1eac?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519683109079-d5f539e15426?q=80&w=800&auto=format&fit=crop'
  ],
  'woodwork': [
    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516962215378-7fa2e137ae94?q=80&w=800&auto=format&fit=crop'
  ]
};

const getFallbackImage = (category, index = 0) => {
  const key = (category || '').toLowerCase();
  const pool = CATEGORY_IMAGE_POOL[key];
  if (!pool?.length) return undefined;
  return pool[index % pool.length];
};

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    handleFilterChange('page', page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      page: 1
    });
    setSearchParams({});
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">We couldn't load the products. Please try again.</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isVisualMode
              ? `Visual matches${visualState.q ? ` for "${visualState.q}"` : ''}`
              : (filters.search ? `Search results for "${filters.search}"` : 'All Products')}
          </h1>
          <p className="text-gray-600">
            {isVisualMode
              ? `${products.length} similar product(s) found`
              : (pagination.totalProducts ? `${pagination.totalProducts} products found` : 'Discover amazing handmade crafts')}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear All
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="input-field pl-10"
                    placeholder="Search products..."
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input-field"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="input-field"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="input-field"
                    placeholder="Max"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="input-field"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                </button>
                
                <div className="hidden sm:block text-sm text-gray-600">
                  Showing {((filters.page - 1) * 12) + 1} to {Math.min(filters.page * 12, pagination.totalProducts)} of {pagination.totalProducts} products
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Products Grid/List */}
            {isLoading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {[...Array(12)].map((_, index) => (
                  <div key={index} className="card p-4">
                    <div className="shimmer h-48 rounded-lg mb-4"></div>
                    <div className="shimmer h-4 rounded mb-2"></div>
                    <div className="shimmer h-4 w-2/3 rounded"></div>
                  </div>
                ))}
              </div>
            ) : visibleProducts.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {visibleProducts
                  .map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      viewMode={viewMode}
                    />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                <button onClick={clearFilters} className="btn-primary">
                  Clear Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {!isVisualMode && pagination.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const page = index + 1;
                  const isCurrentPage = page === filters.page;
                  
                  if (
                    page === 1 ||
                    page === pagination.totalPages ||
                    (page >= filters.page - 2 && page <= filters.page + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg ${
                          isCurrentPage
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === filters.page - 3 ||
                    page === filters.page + 3
                  ) {
                    return <span key={page} className="px-2 text-gray-400">...</span>;
                  }
                  return null;
                })}
                
                <button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;

// Product Card Component
const ProductCard = ({ product, viewMode }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const navigate = useNavigate();
  const liked = isInWishlist(product._id);

  if (!imgOk) return null;

  if (viewMode === 'list') {
    return (
      <div className="card p-6 flex items-center space-x-6">
        <div className="relative flex-shrink-0">
          <img
            src={product.images?.[0]?.url || ''}
            alt={product.name}
            className="w-32 h-32 object-cover rounded-lg"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={(e) => {
              e.currentTarget.onerror = null;
              setImgOk(false);
            }}
          />
          <button
            onClick={async () => {
              if (liked) {
                await removeFromWishlist(product._id);
              } else {
                await addToWishlist(product._id);
              }
              setIsLiked(!liked);
            }}
            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md"
          >
            <Heart className={`w-4 h-4 ${liked || isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
          </button>
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-gray-500">{product.category}</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">4.8</span>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
              <p className="text-gray-600 mb-3 line-clamp-2">{product.shortDescription}</p>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  by {product.seller?.name || 'Unknown Seller'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  await addToCart(product._id, 1);
                  navigate('/cart');
                }}
                className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
              <Link
                to={`/products/${product._id}`}
                state={{ product }}
                className="btn-primary"
              >
                Buy Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link to={`/products/${product._id}`} state={{ product }} className="card-hover group">
      <div className="relative">
        <img
          src={product.images?.[0]?.url || ''}
          alt={product.name}
          className="w-full h-48 object-cover rounded-t-lg"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={(e) => {
            e.currentTarget.onerror = null;
            setImgOk(false);
          }}
        />
        <button
          onClick={async (e) => {
            e.preventDefault();
            if (liked) {
              await removeFromWishlist(product._id);
            } else {
              await addToWishlist(product._id);
            }
            setIsLiked(!liked);
          }}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          <Heart className={`w-5 h-5 ${liked || isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
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
            <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={async (e) => {
                e.preventDefault();
                await addToCart(product._id, 1);
                navigate('/cart');
              }}
              className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors duration-200"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                navigate(`/products/${product._id}`, { state: { product } });
              }}
              className="btn-primary py-2 px-3 text-sm"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
