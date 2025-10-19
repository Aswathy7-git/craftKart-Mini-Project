import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productsAPI } from '../../services/api';
import { 
  Upload, 
  X, 
  Plus, 
  Minus,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Tag,
  Package,
  DollarSign,
  FileText,
  Globe,
  Leaf
} from 'lucide-react';
import toast from 'react-hot-toast';
import AIImageAnalyzer from '../../components/AIImageAnalyzer';
const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: '',
    subcategory: '',
    price: '',
    originalPrice: '',
    stock: '',
    tags: [],
    materials: [],
    colors: [],
    dimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'cm'
    },
    weight: {
      value: '',
      unit: 'g'
    },
    sustainability: {
      isEcoFriendly: false,
      story: '',
      certifications: [],
      carbonFootprint: ''
    },
    shipping: {
      weight: '',
      dimensions: {
        length: '',
        width: '',
        height: ''
      },
      freeShipping: false,
      shippingCost: ''
    }
  });

  const [images, setImages] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newCertification, setNewCertification] = useState('');

  const { data: productData, isLoading } = useQuery(
    ['product', id],
    () => productsAPI.getProduct(id),
    {
      onSuccess: (data) => {
        const product = data.data.product;
        setFormData({
          name: product.name || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          category: product.category || '',
          subcategory: product.subcategory || '',
          price: product.price || '',
          originalPrice: product.originalPrice || '',
          stock: product.stock || '',
          tags: product.tags || [],
          materials: product.materials || [],
          colors: product.colors || [],
          dimensions: product.dimensions || { length: '', width: '', height: '', unit: 'cm' },
          weight: product.weight || { value: '', unit: 'g' },
          sustainability: product.sustainability || { isEcoFriendly: false, story: '', certifications: [], carbonFootprint: '' },
          shipping: product.shipping || { weight: '', dimensions: { length: '', width: '', height: '' }, freeShipping: false, shippingCost: '' }
        });
        
        if (product.images) {
          setImages(product.images.map((img, index) => ({
            id: `existing-${index}`,
            url: img.url,
            isExisting: true
          })));
        }
      }
    }
  );

  const categories = [
    { value: '', label: 'Select Category' },
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

  const updateProductMutation = useMutation(
    (productData) => productsAPI.updateProduct(id, productData),
    {
      onSuccess: (data) => {
        toast.success('Product updated successfully!');
        queryClient.invalidateQueries('seller-products');
        navigate('/seller/dashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update product');
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
      isExisting: false
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image && !image.isExisting) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addMaterial = () => {
    if (newMaterial.trim() && !formData.materials.includes(newMaterial.trim())) {
      setFormData(prev => ({
        ...prev,
        materials: [...prev.materials, newMaterial.trim()]
      }));
      setNewMaterial('');
    }
  };

  const removeMaterial = (material) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m !== material)
    }));
  };

  const addColor = () => {
    if (newColor.trim() && !formData.colors.includes(newColor.trim())) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, newColor.trim()]
      }));
      setNewColor('');
    }
  };

  const removeColor = (color) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== color)
    }));
  };

  const addCertification = () => {
    if (newCertification.trim() && !formData.sustainability.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        sustainability: {
          ...prev.sustainability,
          certifications: [...prev.sustainability.certifications, newCertification.trim()]
        }
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (certification) => {
    setFormData(prev => ({
      ...prev,
      sustainability: {
        ...prev.sustainability,
        certifications: prev.sustainability.certifications.filter(c => c !== certification)
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.description || !formData.category || !formData.price || !formData.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    updateProductMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="shimmer h-8 w-48 rounded"></div>
            <div className="card p-6">
              <div className="shimmer h-64 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
            <p className="text-gray-600 mb-8">The product you're trying to edit doesn't exist.</p>
            <button onClick={() => navigate('/seller/dashboard')} className="btn-primary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/seller/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-2">Update your product listing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Basic Information</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subcategory
                </label>
                <input
                  type="text"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Necklaces, Wall Art"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Brief description for product cards"
                  maxLength={200}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input-field"
                  rows={4}
                  placeholder="Detailed description of your product"
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Pricing & Inventory</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="input-field pl-8"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Price
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    className="input-field pl-8"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <ImageIcon className="w-5 h-5" />
              <span>Product Images</span>
            </h2>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Upload More Images</span>
                  <span className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</span>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.preview || image.url}
                        alt="Product preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {image.isExisting && (
                        <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Existing
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

                    {/* AI Assistant */}
                    <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">AI Assistant</h2>
            <AIImageAnalyzer
              productId={id}
              onAnalysisComplete={(result) => {
                const { analysis } = result || {};
                if (!analysis) return;
                setFormData((prev) => ({
                  ...prev,
                  tags: Array.from(new Set([...(prev.tags || []), ...(analysis.tags || [])])),
                  materials: Array.from(new Set([...(prev.materials || []), ...(analysis.materials || [])])),
                  colors: Array.from(new Set([...(prev.colors || []), ...(analysis.colors || [])])),
                  description: prev.description || analysis.description || prev.description
                }));
              }}
            />
          </div>

          {/* Tags & Attributes */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <Tag className="w-5 h-5" />
              <span>Tags & Attributes</span>
            </h2>
            
            <div className="space-y-6">
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="btn-secondary"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Materials */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Materials
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.materials.map((material) => (
                    <span
                      key={material}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                    >
                      {material}
                      <button
                        type="button"
                        onClick={() => removeMaterial(material)}
                        className="ml-2 text-gray-600 hover:text-gray-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Add a material"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                  />
                  <button
                    type="button"
                    onClick={addMaterial}
                    className="btn-secondary"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colors
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.colors.map((color) => (
                    <span
                      key={color}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => removeColor(color)}
                        className="ml-2 text-gray-600 hover:text-gray-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Add a color"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                  />
                  <button
                    type="button"
                    onClick={addColor}
                    className="btn-secondary"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sustainability */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <Leaf className="w-5 h-5" />
              <span>Sustainability</span>
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isEcoFriendly"
                  name="sustainability.isEcoFriendly"
                  checked={formData.sustainability.isEcoFriendly}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isEcoFriendly" className="ml-2 block text-sm text-gray-700">
                  This is an eco-friendly product
                </label>
              </div>

              {formData.sustainability.isEcoFriendly && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sustainability Story
                    </label>
                    <textarea
                      name="sustainability.story"
                      value={formData.sustainability.story}
                      onChange={handleInputChange}
                      className="input-field"
                      rows={3}
                      placeholder="Tell the story of how this product is eco-friendly"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certifications
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.sustainability.certifications.map((cert) => (
                        <span
                          key={cert}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                        >
                          {cert}
                          <button
                            type="button"
                            onClick={() => removeCertification(cert)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newCertification}
                        onChange={(e) => setNewCertification(e.target.value)}
                        className="input-field flex-1"
                        placeholder="Add a certification"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                      />
                      <button
                        type="button"
                        onClick={addCertification}
                        className="btn-secondary"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/seller/dashboard')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProductMutation.isLoading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateProductMutation.isLoading ? (
                <>
                  <div className="loading-spinner w-4 h-4"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductPage;
