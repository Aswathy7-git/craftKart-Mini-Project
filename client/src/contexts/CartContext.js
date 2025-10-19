import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

const initialState = {
  cart: null,
  isLoading: false,
  error: null
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'CART_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'CART_SUCCESS':
      return {
        ...state,
        cart: action.payload,
        isLoading: false,
        error: null
      };
    case 'CART_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'CLEAR_CART':
      return {
        ...state,
        cart: { ...state.cart, items: [], giftItems: [] },
        isLoading: false,
        error: null
      };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Fetch cart on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    if (!isAuthenticated) return;
    try {
      dispatch({ type: 'CART_START' });
      const response = await cartAPI.getCart();
      dispatch({ type: 'CART_SUCCESS', payload: response.data.cart });
    } catch (error) {
      dispatch({ type: 'CART_FAILURE', payload: error.response?.data?.message || 'Failed to fetch cart' });
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      dispatch({ type: 'CART_START' });
      const response = await cartAPI.addToCart(productId, quantity);
      dispatch({ type: 'CART_SUCCESS', payload: response.data.cart });
      toast.success('Added to cart!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add to cart';
      dispatch({ type: 'CART_FAILURE', payload: message });
      toast.error(message);
      throw error;
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      dispatch({ type: 'CART_START' });
      const response = await cartAPI.updateCartItem(itemId, quantity);
      dispatch({ type: 'CART_SUCCESS', payload: response.data.cart });
      toast.success('Cart updated!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update cart';
      dispatch({ type: 'CART_FAILURE', payload: message });
      toast.error(message);
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      dispatch({ type: 'CART_START' });
      const response = await cartAPI.removeFromCart(itemId);
      dispatch({ type: 'CART_SUCCESS', payload: response.data.cart });
      toast.success('Removed from cart!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove from cart';
      dispatch({ type: 'CART_FAILURE', payload: message });
      toast.error(message);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      dispatch({ type: 'CART_START' });
      await cartAPI.clearCart();
      dispatch({ type: 'CLEAR_CART' });
      toast.success('Cart cleared!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to clear cart';
      dispatch({ type: 'CART_FAILURE', payload: message });
      toast.error(message);
      throw error;
    }
  };

  const addToWishlist = async (productId) => {
    try {
      dispatch({ type: 'CART_START' });
      const response = await cartAPI.addToWishlist(productId);
      dispatch({ type: 'CART_SUCCESS', payload: response.data.cart });
      toast.success('Added to wishlist!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add to wishlist';
      dispatch({ type: 'CART_FAILURE', payload: message });
      toast.error(message);
      throw error;
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      dispatch({ type: 'CART_START' });
      const response = await cartAPI.removeFromWishlist(productId);
      dispatch({ type: 'CART_SUCCESS', payload: response.data.cart });
      toast.success('Removed from wishlist!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove from wishlist';
      dispatch({ type: 'CART_FAILURE', payload: message });
      toast.error(message);
      throw error;
    }
  };

  const addGiftItem = async (productId, quantity, giftData) => {
    try {
      dispatch({ type: 'CART_START' });
      const response = await cartAPI.addGiftItem(productId, quantity, giftData);
      dispatch({ type: 'CART_SUCCESS', payload: response.data.cart });
      toast.success('Gift item added!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add gift item';
      dispatch({ type: 'CART_FAILURE', payload: message });
      toast.error(message);
      throw error;
    }
  };

  const removeGiftItem = async (itemId) => {
    try {
      dispatch({ type: 'CART_START' });
      const response = await cartAPI.removeGiftItem(itemId);
      dispatch({ type: 'CART_SUCCESS', payload: response.data.cart });
      toast.success('Gift item removed!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove gift item';
      dispatch({ type: 'CART_FAILURE', payload: message });
      toast.error(message);
      throw error;
    }
  };

  // Helper functions
  const getCartItemCount = () => {
    if (!state.cart) return 0;
    return state.cart.items?.length || 0;
  };

  const getWishlistCount = () => {
    if (!state.cart) return 0;
    return state.cart.wishlist?.length || 0;
  };

  const getGiftItemCount = () => {
    if (!state.cart) return 0;
    return state.cart.giftItems?.length || 0;
  };

  const getCartTotal = () => {
    if (!state.cart || !state.cart.items) return 0;
    return state.cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getGiftTotal = () => {
    if (!state.cart || !state.cart.giftItems) return 0;
    return state.cart.giftItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const isInCart = (productId) => {
    if (!state.cart || !state.cart.items) return false;
    return state.cart.items.some(item => item.product._id === productId);
  };

  const isInWishlist = (productId) => {
    if (!state.cart || !state.cart.wishlist) return false;
    return state.cart.wishlist.some(item => item.product._id === productId);
  };

  const value = {
    ...state,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    addToWishlist,
    removeFromWishlist,
    addGiftItem,
    removeGiftItem,
    fetchCart,
    getCartItemCount,
    getWishlistCount,
    getGiftItemCount,
    getCartTotal,
    getGiftTotal,
    isInCart,
    isInWishlist
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
