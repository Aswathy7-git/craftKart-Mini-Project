import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  adminLogin: (credentials) => api.post('/auth/admin/login', credentials),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Products API
export const productsAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getSimilarProducts: (id) => api.get(`/products/${id}/similar`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  uploadImages: (id, formData) => api.post(`/products/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getSellerProducts: (params) => api.get('/products/seller/my-products', { params }),
};

// Cart API
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (productId, quantity) => api.post('/cart/add', { productId, quantity }),
  updateCartItem: (itemId, quantity) => api.put(`/cart/update/${itemId}`, { quantity }),
  removeFromCart: (itemId) => api.delete(`/cart/remove/${itemId}`),
  clearCart: () => api.delete('/cart/clear'),
  addToWishlist: (productId) => api.post('/cart/wishlist/add', { productId }),
  removeFromWishlist: (productId) => api.delete(`/cart/wishlist/remove/${productId}`),
  addGiftItem: (productId, quantity, giftData) => api.post('/cart/gift/add', { productId, quantity, ...giftData }),
  removeGiftItem: (itemId) => api.delete(`/cart/gift/remove/${itemId}`),
};

// Orders API
export const ordersAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrders: (params) => api.get('/orders/my-orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, statusData) => api.put(`/orders/${id}/status`, statusData),
  cancelOrder: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  getSellerOrders: (params) => api.get('/orders/seller/orders', { params }),
};

// Reviews API
export const reviewsAPI = {
  createReview: (reviewData) => api.post('/reviews', reviewData),
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  getUserReviews: (params) => api.get('/reviews/my-reviews', { params }),
  updateReview: (id, reviewData) => api.put(`/reviews/${id}`, reviewData),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  respondToReview: (id, response) => api.post(`/reviews/${id}/respond`, { response }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getPendingSellers: () => api.get('/admin/sellers/pending'),
  approveSeller: (id, data) => api.put(`/admin/sellers/${id}/approve`, data),
  getProducts: (params) => api.get('/admin/products', { params }),
  approveProduct: (id, data) => api.put(`/admin/products/${id}/approve`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  cleanupProductsWithoutImage: () => api.delete('/admin/products/cleanup/no-image'),
  getOrders: (params) => api.get('/admin/orders', { params }),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  // Image approvals
  getPendingImages: () => api.get('/admin/images/pending'),
  approveImage: (id) => api.put(`/admin/images/${id}/approve`),
  rejectImage: (id, reason) => api.put(`/admin/images/${id}/reject`, { reason }),
};

// AI API
export const aiAPI = {
  analyzeImage: (imageData) => api.post('/ai/analyze-image', imageData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getRecommendations: (productId) => api.get(`/ai/recommendations/${productId}`),
  getPersonalizedRecommendations: (userId) => api.get(`/ai/personalized/${userId}`),
  searchSuggest: (q, max = 5) => api.post('/ai/search-suggest', { q, max }),
  searchByImage: (imageData) => api.post('/ai/search-by-image', imageData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Payments API
export const paymentsAPI = {
  createStripePaymentIntent: (orderId) => api.post('/payments/stripe/create-payment-intent', { orderId }),
  confirmStripePayment: (paymentData) => api.post('/payments/stripe/confirm-payment', paymentData),
  createRazorpayOrder: (orderId) => api.post('/payments/razorpay/create-order', { orderId }),
  verifyRazorpayPayment: (paymentData) => api.post('/payments/razorpay/verify-payment', paymentData),
  getRazorpayKey: () => api.get('/payments/razorpay/key'),
  processWalletPayment: (orderId) => api.post('/payments/wallet/pay', { orderId }),
  addToWallet: (amount, paymentMethod) => api.post('/payments/wallet/add', { amount, paymentMethod }),
  confirmWalletTopup: (topupData) => api.post('/payments/wallet/confirm-topup', topupData),
  getWalletBalance: () => api.get('/payments/wallet/balance'),
  // PayU
  createPayUOrder: (orderId) => api.post('/payments/payu/order', { orderId }),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getActivity: () => api.get('/users/activity'),
  updateBusinessInfo: (businessData) => api.put('/users/business-info', businessData),
  deactivateAccount: (password) => api.put('/users/deactivate', { password }),
  getUser: (id) => api.get(`/users/${id}`),
};

export default api;
