import { useState } from 'react';
import { aiService } from '../services/aiService';

export default function AIImageAnalyzer({ productId, onAnalysisComplete }) {
  const [imageUrl, setImageUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (saveToProduct = false) => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await aiService.analyzeImage(imageUrl, productId, saveToProduct);
      setAnalysis(result);

      if (onAnalysisComplete) onAnalysisComplete(result);
      if (saveToProduct && result.updatedProduct) {
        // eslint-disable-next-line no-alert
        alert('Product updated with AI-generated metadata!');
      }
    } catch (err) {
      setError(err?.message || 'Analysis failed');
      // eslint-disable-next-line no-console
      console.error('AI analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold mb-4">AI Product Analyzer</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Product Image URL
        </label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/product-image.jpg"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={() => handleAnalyze(false)}
          disabled={loading}
          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Analyzing...' : 'Analyze Only'}
        </button>

        {productId && (
          <button
            onClick={() => handleAnalyze(true)}
            disabled={loading}
            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Saving...' : 'Analyze & Save'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {analysis && (
        <div className="mt-6 space-y-4 border-t pt-4">
          <h3 className="text-xl font-semibold">Analysis Results</h3>

          <div>
            <strong className="text-gray-700">Tags:</strong>
            <div className="flex flex-wrap gap-2 mt-2">
              {analysis.analysis.tags.map((tag, idx) => (
                <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <strong className="text-gray-700">Colors:</strong>
            <div className="flex flex-wrap gap-2 mt-2">
              {analysis.analysis.colors.map((color, idx) => (
                <span key={idx} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                  {color}
                </span>
              ))}
            </div>
          </div>

          <div>
            <strong className="text-gray-700">Materials:</strong>
            <div className="flex flex-wrap gap-2 mt-2">
              {analysis.analysis.materials.map((m, idx) => (
                <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div>
            <strong className="text-gray-700">Style:</strong>
            <span className="ml-2 text-gray-600 capitalize">{analysis.analysis.style}</span>
          </div>

          <div>
            <strong className="text-gray-700">Description:</strong>
            <p className="text-gray-600 mt-1">{analysis.analysis.description}</p>
          </div>

          <div>
            <strong className="text-gray-700">Confidence:</strong>
            <span className="ml-2 text-gray-600">{(analysis.analysis.confidence * 100).toFixed(1)}%</span>
          </div>

          {analysis.similarProducts?.length > 0 && (
            <div>
              <strong className="text-gray-700">
                Similar Products Found: {analysis.similarProducts.length}
              </strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
