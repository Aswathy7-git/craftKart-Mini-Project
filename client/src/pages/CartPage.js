import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Gift, 
  ArrowRight,
  CreditCard,
  Truck,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(n) || 0);

const CartPage = () => {
  const { 
    cart, 
    isLoading, 
    updateCartItem, 
    removeFromCart, 
    clearCart,
    getCartTotal,
    getGiftTotal 
  } = useCart();
  
  const [isUpdating, setIsUpdating] = useState({});

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(prev => ({ ...prev, [itemId]: true }));
    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      toast.error('Failed to update quantity');
    } finally {
      setIsUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeFromCart(itemId);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await clearCart();
        toast.success('Cart cleared');
      } catch (error) {
        toast.error('Failed to clear cart');
      }
    }
  };

  const cartItems = cart?.items || [];
  const giftItems = cart?.giftItems || [];
  const regularTotal = getCartTotal();
  const giftTotal = getGiftTotal();
  const subtotal = regularTotal + giftTotal;
  const shipping = subtotal > 100 ? 0 : 10;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="shimmer h-8 w-48 rounded"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="card p-6">
                    <div className="flex items-center space-x-4">
                      <div className="shimmer w-20 h-20 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="shimmer h-4 rounded"></div>
                        <div className="shimmer h-4 w-2/3 rounded"></div>
                        <div className="shimmer h-4 w-1/3 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="shimmer h-64 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && giftItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <Link to="/products" className="btn-primary">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">
            {cartItems.length + giftItems.length} item(s) in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Regular Items */}
            {cartItems.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Regular Items</h2>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <CartItem
                      key={item._id}
                      item={item}
                      isUpdating={isUpdating[item._id]}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Gift Items */}
            {giftItems.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Gift className="w-5 h-5 text-primary-600" />
                  <span>Gift Items</span>
                </h2>
                <div className="space-y-4">
                  {giftItems.map((item) => (
                    <GiftItem
                      key={item._id}
                      item={item}
                      isUpdating={isUpdating[item._id]}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Clear Cart Button */}
            {(cartItems.length > 0 || giftItems.length > 0) && (
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Cart</span>
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? 'Free' : formatINR(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatINR(tax)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatINR(total)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              {shipping > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <Truck className="w-4 h-4" />
                    <span className="text-sm font-medium">Free shipping on orders over {formatINR(100)}</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Add {formatINR(100 - subtotal)} more to qualify for free shipping
                  </p>
                </div>
              )}

              {/* Checkout Button */}
              <Link
                to="/checkout"
                className="w-full btn-primary flex items-center justify-center space-x-2 mb-4"
              >
                <CreditCard className="w-5 h-5" />
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Security Notice */}
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Secure checkout with SSL encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Cart Item Component
const CartItem = ({ item, isUpdating, onQuantityChange, onRemove }) => {
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = (newQuantity) => {
    setQuantity(newQuantity);
    onQuantityChange(item._id, newQuantity);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center space-x-4">
        <img
          src={item.product.images?.[0]?.url || '/placeholder-product.jpg'}
          alt={item.product.name}
          className="w-20 h-20 object-cover rounded-lg"
        />
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{item.product.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{item.product.shortDescription}</p>
          <p className="text-sm text-gray-500">by {item.seller.name}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={isUpdating || quantity <= 1}
              className="p-2 hover:bg-gray-50 disabled:opacity-50"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isUpdating || quantity >= item.product.stock}
              className="p-2 hover:bg-gray-50 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="text-right">
            <div className="font-semibold text-gray-900">
              {formatINR(item.price * quantity)}
            </div>
            <div className="text-sm text-gray-500">
              {formatINR(item.price)} each
            </div>
          </div>

          <button
            onClick={() => onRemove(item._id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Gift Item Component
const GiftItem = ({ item, isUpdating, onQuantityChange, onRemove }) => {
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = (newQuantity) => {
    setQuantity(newQuantity);
    onQuantityChange(item._id, newQuantity);
  };

  return (
    <div className="card p-6 border-l-4 border-primary-500">
      <div className="flex items-center space-x-4">
        <img
          src={item.product.images?.[0]?.url || '/placeholder-product.jpg'}
          alt={item.product.name}
          className="w-20 h-20 object-cover rounded-lg"
        />
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <Gift className="w-4 h-4 text-primary-600" />
            <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">{item.product.shortDescription}</p>
          <p className="text-sm text-gray-500 mb-2">by {item.seller.name}</p>
          
          {item.recipientName && (
            <div className="text-sm text-primary-600">
              Gift for: {item.recipientName}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={isUpdating || quantity <= 1}
              className="p-2 hover:bg-gray-50 disabled:opacity-50"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-4 py-2 border-x border-gray-300">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isUpdating || quantity >= item.product.stock}
              className="p-2 hover:bg-gray-50 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="text-right">
            <div className="font-semibold text-gray-900">
              ${(item.price * quantity).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">
              ${item.price} each
            </div>
          </div>

          <button
            onClick={() => onRemove(item._id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
