import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';

const WishlistPage = () => {
  const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n) || 0);
  const { cart, addToCart, removeFromWishlist } = useCart();
  const navigate = useNavigate();

  const wishlist = cart?.wishlist || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Heart className="w-6 h-6 text-red-500" />
            <span>My Wishlist</span>
          </h1>
          <Link to="/products" className="btn-secondary">Continue Shopping</Link>
        </div>

        {wishlist.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-600 mb-4">Your wishlist is empty.</p>
            <Link to="/products" className="btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <div key={item._id || item.product._id} className="card p-4">
                <img
                  src={item.product.images?.[0]?.url || '/placeholder-product.jpg'}
                  alt={item.product.name}
                  className="w-full h-40 object-cover rounded mb-4"
                />
                <h3 className="font-semibold text-gray-900 line-clamp-1">{item.product.name}</h3>
                <p className="text-gray-700 mt-1">{formatINR(item.product.price)}</p>

                <div className="mt-4 flex space-x-3">
                  <button
                    className="btn-primary flex items-center space-x-2"
                    onClick={async () => {
                      await addToCart(item.product._id, 1);
                      await removeFromWishlist(item.product._id);
                      navigate('/cart');
                    }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => removeFromWishlist(item.product._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
