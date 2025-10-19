import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { productsAPI, reviewsAPI, ordersAPI } from '../services/api';
import DeliveryDetails from '../components/DeliveryDetails';
import ProductRecommendations from '../components/ProductRecommendations';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  Share2, 
  Truck, 
  Shield, 
  RotateCcw,
  Plus,
  Minus,
  Gift,
  
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const seededProduct = location.state?.product;
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isGiftMode, setIsGiftMode] = useState(false);
  const [giftData, setGiftData] = useState({
    recipientName: '',
    recipientEmail: '',
    giftMessage: ''
  });

  const { addToCart, addToWishlist, isInWishlist } = useCart();
  const { isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery(
    ['product', id],
    () => productsAPI.getProduct(id),
    {
      onSuccess: (data) => {
        if (data.data.product.images?.length > 0) {
          setSelectedImage(0);
        }
      }
    }
  );

  const { data: similarData } = useQuery(
    ['similar-products', id],
    () => productsAPI.getSimilarProducts(id),
    {
      enabled: !!id
    }
  );

  const product = data?.data?.product || seededProduct;
  const similarProducts = similarData?.data?.products || [];
  const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n) || 0);

  // Reviews state
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');

  // Load product reviews
  const { data: reviewsData, refetch: refetchReviews } = useQuery(
    ['product-reviews', id],
    () => reviewsAPI.getProductReviews(id, { page: 1, limit: 10 }),
    { enabled: !!id }
  );
  const reviews = reviewsData?.data?.reviews || [];
  const avgRating = reviewsData?.data?.averageRating || 0;

  // Load delivered orders to validate review eligibility
  const { data: myOrdersData } = useQuery(
    ['my-delivered-orders'],
    () => ordersAPI.getOrders({ status: 'delivered', page: 1, limit: 50 }),
    { staleTime: 60_000 }
  );
  const eligibleOrders = (myOrdersData?.data?.orders || []).filter(o =>
    o.items?.some(it => (it.product?._id || it.product) === id)
  );
  const firstEligible = eligibleOrders[0]?._id || '';
  
  // Ensure default selected order id
  useEffect(() => {
    if (!selectedOrderId && firstEligible) {
      setSelectedOrderId(firstEligible);
    }
  }, [firstEligible, selectedOrderId]);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      if (!selectedOrderId) {
        toast.error('Select a delivered order for this product');
        return;
      }
      await reviewsAPI.createReview({
        productId: id,
        orderId: selectedOrderId,
        rating,
        title: reviewTitle,
        comment: reviewComment
      });
      toast.success('Review submitted');
      setReviewTitle('');
      setReviewComment('');
      refetchReviews();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to submit review';
      toast.error(msg);
    }
  };

  const handleBuyNow = async () => {
    try {
      await addToCart(id, 1);
      navigate('/checkout');
    } catch (error) {
      toast.error('Failed to proceed to checkout');
    }
  };

  const handleAddToCart = async () => {
    try {
      if (isGiftMode) {
        await addToCart(id, quantity, {
          ...giftData,
          isGift: true
        });
        toast.success('Gift item added to cart!');
      } else {
        await addToCart(id, quantity);
        toast.success('Added to cart!');
      }
      // Redirect to cart after adding
      navigate('/cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleAddToWishlist = async () => {
    try {
      await addToWishlist(id);
    } catch (error) {
      toast.error('Failed to add to wishlist');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading && !seededProduct) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="shimmer h-96 rounded-lg"></div>
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="shimmer h-20 rounded-lg"></div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="shimmer h-8 rounded"></div>
              <div className="shimmer h-4 rounded w-2/3"></div>
              <div className="shimmer h-6 rounded w-1/3"></div>
              <div className="shimmer h-32 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if ((error && !seededProduct) || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
            <p className="text-gray-600 mb-4">The product you're looking for doesn't exist or has been removed.</p>
            <Link to="/products" className="btn-primary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-gray-700">Products</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`} className="hover:text-gray-700 capitalize">
            {product.category.replace('-', ' ')}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden">
              <img
                src={product.images?.[selectedImage]?.url || '/placeholder-product.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-product.jpg'; }}
              />
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-white rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-primary-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-product.jpg'; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 capitalize">{product.category.replace('-', ' ')}</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">4.8 (128 reviews)</span>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold text-gray-900">₹{product.price}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-lg text-gray-500 line-through">₹{product.originalPrice}</span>
                  )}
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Product Quality Information */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Quality</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Materials</div>
                  <div className="text-gray-800">{product.materials?.length ? product.materials.join(', ') : '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Craftsmanship</div>
                  <div className="text-gray-800">{product.sustainability?.story || 'Handcrafted with care by our artisans.'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Dimensions</div>
                  <div className="text-gray-800">
                    {product.dimensions?.length || product.dimensions?.width || product.dimensions?.height
                      ? `${product.dimensions.length || '-'} × ${product.dimensions.width || '-'} × ${product.dimensions.height || '-'} ${product.dimensions?.unit || 'cm'}`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Weight</div>
                  <div className="text-gray-800">
                    {product.weight?.value ? `${product.weight.value} ${product.weight?.unit || 'g'}` : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Sustainability Badge */}
            {product.sustainability?.isEcoFriendly && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">🌱</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Eco-Friendly Product</h4>
                    <p className="text-green-700 text-sm">{product.sustainability.story}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {product.stock} available
                </span>
              </div>

              {/* Gift Mode Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="gift-mode"
                  checked={isGiftMode}
                  onChange={(e) => setIsGiftMode(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="gift-mode" className="text-sm font-medium text-gray-700">
                  This is a gift
                </label>
              </div>

              {/* Gift Form */}
              {isGiftMode && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Gift className="w-5 h-5" />
                    <span>Gift Details</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Recipient's name"
                      value={giftData.recipientName}
                      onChange={(e) => setGiftData({...giftData, recipientName: e.target.value})}
                      className="input-field"
                    />
                    <input
                      type="email"
                      placeholder="Recipient's email"
                      value={giftData.recipientEmail}
                      onChange={(e) => setGiftData({...giftData, recipientEmail: e.target.value})}
                      className="input-field"
                    />
                  </div>
                  <textarea
                    placeholder="Gift message (optional)"
                    value={giftData.giftMessage}
                    onChange={(e) => setGiftData({...giftData, giftMessage: e.target.value})}
                    className="input-field"
                    rows={3}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isGiftMode ? 'Add Gift to Cart' : 'Add to Cart'}</span>
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 btn-outline"
                >
                  Buy Now
                </button>
                
                <button
                  onClick={handleAddToWishlist}
                  className={`p-3 border rounded-lg flex items-center justify-center space-x-2 ${
                    isInWishlist(id) 
                      ? 'border-red-300 bg-red-50 text-red-600' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isInWishlist(id) ? 'fill-current' : ''}`} />
                </button>
                
                <button
                  onClick={handleShare}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Delivery Details */}
            <DeliveryDetails />

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Free Shipping</div>
                  <div className="text-xs text-gray-500">On orders over ₹10000</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Easy Returns</div>
                  <div className="text-xs text-gray-500">30-day return policy</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Secure Payment</div>
                  <div className="text-xs text-gray-500">Protected by SSL</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Similar Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((product) => (
                <Link key={product._id} to={`/products/${product._id}`} className="card-hover group">
                  <div className="relative">
                    <img
                      src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder-product.jpg'; }}
                    />
                    <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Heart className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.shortDescription}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">₹{product.price}</span>
                      <button className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200 transition-colors duration-200">
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* AI-Powered Recommendations */}
        <ProductRecommendations productId={id} />

        {/* Reviews */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{avgRating.toFixed(1)} / 5</span>
            </div>
          </div>

          {reviews.length === 0 ? (
            <p className="text-gray-600">No reviews yet. Be the first to review this item!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r._id} className="card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className={`w-4 h-4 ${n <= r.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-sm text-gray-500">by {r.user?.name || 'User'}</span>
                  </div>
                  <h4 className="font-medium text-gray-900">{r.title}</h4>
                  <p className="text-gray-700 mt-1">{r.comment}</p>
                </div>
              ))}
            </div>
          )}

          <div className="card p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a review</h3>
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-600">Please login to write a review.</p>
                <button onClick={() => navigate('/login')} className="btn-primary">Login</button>
              </div>
            ) : eligibleOrders.length === 0 ? (
              <p className="text-sm text-gray-600">You can review after your order is delivered.</p>
            ) : (
              <form onSubmit={submitReview} className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-700">Rating:</label>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((n) => (
                      <button type="button" key={n} onClick={() => setRating(n)}>
                        <Star className={`w-5 h-5 ${n <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Title (min 5 characters)"
                    className="input-field"
                    required
                  />
                  <select
                    className="input-field"
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    required
                  >
                    {eligibleOrders.map((o) => (
                      <option key={o._id} value={o._id}>Order {o.orderNumber}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Your detailed review (min 10 characters)"
                  className="input-field"
                  rows={4}
                  required
                />
                <button type="submit" className="btn-primary">Submit Review</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
