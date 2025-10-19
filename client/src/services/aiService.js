import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const aiService = {
  analyzeImage: async (imageUrl, productId = null, saveToProduct = false) => {
    const response = await axios.post(
      `${API_BASE_URL}/ai/analyze-image`,
      { imageUrl, productId, saveToProduct },
      { headers: { ...getAuthHeader(), 'Content-Type': 'application/json' } }
    );
    return response.data;
  },

  getRecommendations: async (productId) => {
    const response = await axios.get(
      `${API_BASE_URL}/ai/recommendations/${productId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  getPersonalizedRecommendations: async (userId) => {
    const response = await axios.get(
      `${API_BASE_URL}/ai/personalized/${userId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  }
};
