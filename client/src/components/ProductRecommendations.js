import { useEffect, useState } from 'react';
import { aiService } from '../services/aiService';
import { Link } from 'react-router-dom';

export default function ProductRecommendations({ productId }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await aiService.getRecommendations(productId);
        setRecommendations(data.recommendations);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load recommendations', e);
      } finally {
        setLoading(false);
      }
    };
    if (productId) load();
  }, [productId]);

  if (loading) return <div className="py-8 text-center">Loading recommendations...</div>;
  if (!recommendations) return null;

  const hasAny = (recommendations.similar?.length || 0) + (recommendations.trending?.length || 0) > 0;
  if (!hasAny) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-4">You May Also Like</h2>

      {recommendations.similar?.length > 0 && (
        <Section title="Similar Items" products={recommendations.similar} />
      )}

      {recommendations.trending?.length > 0 && (
        <Section title="Trending Now" products={recommendations.trending} />
      )}
    </div>
  );
}

function Section({ title, products }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <Link to={`/product/${product._id}`} className="border rounded-lg p-3 hover:shadow transition">
      <img
        src={product.images?.[0]?.url || '/placeholder.jpg'}
        alt={product.name}
        className="w-full h-32 object-cover rounded mb-2"
      />
      <div className="text-sm font-medium line-clamp-2">{product.name}</div>
      {product.price != null && (
        <div className="text-blue-600 font-semibold mt-1">${Number(product.price).toFixed(2)}</div>
      )}
    </Link>
  );
}
