import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Heart, Image } from 'lucide-react';

interface Product {
  product_id: number;
  name: string;
  description: string;
  price: number;
  condition: string;
  image_urls: string[];
  location: string;
  category_name: string;
}

const Favorites = () => {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Debug: Add console logs to track component lifecycle
  console.log('Favorites component rendered', { favorites, loading, userId, error });

  // Get user data from localStorage
  useEffect(() => {
    console.log('User effect running');
    const currentUser = localStorage.getItem('currentUser');
    console.log('Current user from localStorage:', currentUser);
    
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        console.log('Parsed user data:', userData);
        
        if (userData?.user_id) {
          setUserId(userData.user_id);
          console.log('User ID set to:', userData.user_id);
        } else {
          console.log('No user_id found, redirecting to login');
          navigate('/login');
        }
      } catch (err) {
        console.error('Error parsing currentUser:', err);
        setError('Failed to parse user data');
        navigate('/login');
      }
    } else {
      console.log('No currentUser in localStorage, redirecting to login');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    console.log('Favorites fetch effect running, userId:', userId);
    if (userId) {
      fetchFavorites();
    }
  }, [userId]);

  const fetchFavorites = async () => {
    console.log('Fetching favorites for user:', userId);
    setLoading(true);
    setError(null);
    
    try {
      const url = `${API_BASE_URL}/users/favourites/${userId}`;
      console.log('Fetching from URL:', url);
      
      const res = await fetch(url);
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch favorites: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Favorites data received:', data);
      console.log('Data type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      
      // Handle different response formats
      let favoritesArray: Product[] = [];
      
      if (Array.isArray(data)) {
        favoritesArray = data;
      } else if (data && typeof data === 'object') {
        // Check if data has a favorites property
        if (Array.isArray(data.favorites)) {
          favoritesArray = data.favorites;
        } else if (Array.isArray(data.data)) {
          favoritesArray = data.data;
        } else if (Array.isArray(data.results)) {
          favoritesArray = data.results;
        } else if (Array.isArray(data.products)) {
          // Your API returns products array
          favoritesArray = data.products;
        } else {
          console.error('Unexpected data format:', data);
          throw new Error('Invalid data format received from API');
        }
      } else {
        console.error('Data is not an object or array:', data);
        throw new Error('Invalid response format');
      }
      
      console.log('Final favorites array:', favoritesArray);
      setFavorites(favoritesArray);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (productId: number) => {
    console.log('Removing favorite:', productId);
    
    try {
      if (!userId) {
        console.error('No userId available');
        return;
      }
      
      const url = `${API_BASE_URL}/users/favourites/${userId}/${productId}`;
      console.log('DELETE request to:', url);
      
      const res = await fetch(url, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error(`Failed to remove favorite: ${res.status} ${res.statusText}`);
      }
      
      setFavorites(prev => prev.filter(p => p.product_id !== productId));
      console.log('Favorite removed successfully');
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove favorite');
    }
  };

  // Show error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Error: {error}</p>
          <button 
            onClick={() => {
              setError(null);
              if (userId) fetchFavorites();
            }}
            className="mt-4 px-4 py-2 bg-[#3A1078] text-white rounded-lg hover:bg-[#4c1a9a] transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-gray-600" />
          <span className="ml-2 text-gray-600">Loading favorites...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Favourites</h1>
      
      {!Array.isArray(favorites) || favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">
            {!Array.isArray(favorites) 
              ? "Error loading favorites - invalid data format" 
              : "You haven't added any favorites yet"
            }
          </p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-[#3A1078] text-white rounded-lg hover:bg-[#4c1a9a] transition"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.isArray(favorites) && favorites.map(product => (
            <div 
              key={product.product_id} 
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 hover:border-blue-200"
            >
              <div className="flex">
                <div className="w-36 h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-l-xl flex items-center justify-center overflow-hidden">
                  {product.image_urls?.[0] ? (
                    <>
                      <img 
                        src={product.image_urls[0]} 
                        alt={product.name} 
                        className="w-full h-full object-cover rounded-l-xl"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                      <Image className="w-16 h-16 text-gray-400 hidden" style={{ display: 'none' }} />
                    </>
                  ) : (
                    <Image className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 p-6">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[#004AAD] mb-2 hover:text-[#003380] transition">
                        <Link to={`/product/${product.product_id}`}>
                          {product.name} 
                        </Link>
                      </h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex gap-3 text-sm items-center flex-wrap">
                        {product.category_name && (
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                            {product.category_name}
                          </span>
                        )}
                        {product.condition && (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                            {product.condition}
                          </span>
                        )}
                        {product.location && (
                          <span className="text-gray-500 flex items-center gap-1">
                            📍 {product.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <span className="text-3xl font-bold text-[#F4A300]">€{product.price}</span>
                      <button 
                        onClick={() => removeFavorite(product.product_id)}
                        className="mt-4 flex items-center text-red-600 hover:text-red-800 font-medium"
                      >
                        <Heart className="w-5 h-5 fill-red-500 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
   
    </div>
  );
};

export default Favorites;