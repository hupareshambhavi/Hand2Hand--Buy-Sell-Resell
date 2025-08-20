import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Search, MessageSquare, Filter, Image } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface WantedItem {
  product_id: number;
  name: string;
  description: string;
  price: number;
  location: string;
  category_name: string;
  category_id: number;
  seller_id: number;
  created_at: string;
  image_urls?: string[];
}

interface Category {
  id: number;
  name: string;
}

export default function SearchWantedPage() {
  const [wantedItems, setWantedItems] = useState<WantedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Search filters
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    location: '',
    maxPrice: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  const navigate = useNavigate();
  const { showToast } = useToast();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        setCurrentUser(parsedUserData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    const loadInitialData = async () => {
      await Promise.all([
        loadCategories(),
        loadWantedItems()
      ]);
      setLoading(false);
    };

    loadInitialData();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      
      const formattedCategories = data.map((cat: any) => ({
        id: cat.category_id || cat.id,
        name: cat.category_name || cat.name
      }));
      
      setCategories(formattedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadWantedItems = async (searchFilters = filters) => {
    try {
      setSearchLoading(true);
      
      const params = new URLSearchParams();
      if (searchFilters.search) params.append('name', searchFilters.search);
      if (searchFilters.category) params.append('category', searchFilters.category);
      if (searchFilters.location) params.append('location', searchFilters.location);
      if (searchFilters.maxPrice) params.append('max_price', searchFilters.maxPrice);
      
      const url = `${API_BASE_URL}/products/wanted${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('Fetching wanted items from:', url);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch wanted items');
      
      const data = await response.json();
      console.log('Wanted items received:', data);
      setWantedItems(data);
    } catch (error) {
      console.error('Error loading wanted items:', error);
      showToast('Failed to load wanted items', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = () => {
    loadWantedItems(filters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      category: '',
      location: '',
      maxPrice: ''
    };
    setFilters(emptyFilters);
    loadWantedItems(emptyFilters);
  };

  const handleContactSeller = (item: WantedItem) => {
    if (!currentUser?.user_id) {
      showToast('Please log in to contact sellers', 'error');
      navigate('/login');
      return;
    }

    if (currentUser.user_id === item.seller_id) {
      showToast("This is your own wanted item!", 'info');
      return;
    }

    const sortedUserIds = [currentUser.user_id, item.seller_id].sort((a, b) => a - b);
    const roomName = `product_${item.product_id}_${sortedUserIds[0]}_${sortedUserIds[1]}`;
    
    navigate(`/chat/${roomName}`, {
      state: {
        productId: item.product_id,
        productName: item.name,
        sellerId: item.seller_id,
        buyerId: currentUser.user_id,
        isNewChat: true,
        isWantedItem: true
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wanted Items</h1>
          <p className="text-gray-600">
            Browse items that other users are looking for. Contact them if you have what they need!
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search wanted items..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="px-6 py-2 bg-[#3A1078] text-white rounded-lg hover:bg-[#4A23A0] transition disabled:opacity-50 flex items-center gap-2"
            >
              {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="City or postal code"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget</label>
                <input
                  type="number"
                  placeholder="Maximum price"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-3 flex gap-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="max-w-6xl mx-auto">
          {searchLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
            </div>
          ) : wantedItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No wanted items found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or check back later.</p>
            </div>
          ) : (
            <>
              <div className="bg-green-50 p-2 border border-green-200 rounded-lg mb-2">
                <p className="text-blue-800 font-semibold">
                  Found {wantedItems.length} wanted item{wantedItems.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="space-y-8">
                {wantedItems.map((item) => (
                  <div
                    key={item.product_id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 hover:border-blue-200"
                  >
                    <div className="flex">
                      {/* Image Section */}
                      <div className="w-36 h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-l-xl flex items-center justify-center overflow-hidden">
                        {item.image_urls?.[0] ? (
                          <>
                            <img
                              src={item.image_urls[0]}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-l-xl"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling;
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                            <Image className="w-16 h-16 text-gray-400 hidden" />
                          </>
                        ) : (
                          <Image className="w-16 h-16 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Content Section */}
                      <div className="flex-1 p-6">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-[#004AAD] mb-2 hover:text-[#003380] transition">
                              <Link to={`/product/${item.product_id}`}>
                                {item.name}
                              </Link>
                            </h3>
                            {item.description && (
                              <p className="text-gray-600 mb-3">{item.description}</p>
                            )}
                            <div className="flex gap-3 text-sm items-center flex-wrap mb-3">
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                WANTED
                              </span>
                              {item.category_name && (
                                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium">
                                  {item.category_name}
                                </span>
                              )}
                              {item.location && (
                                <span className="text-gray-500 flex items-center gap-1">
                                  📍 {item.location}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Posted {new Date(item.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {/* Price and Actions Section */}
                          <div className="text-right ml-6 flex flex-col justify-between">
                            {item.price > 0 && (
                              <div className="mb-4">
                                <div className="text-sm text-gray-600 mb-1">Budget up to</div>
                                <span className="text-3xl font-bold text-[#F4A300]">€{item.price}</span>
                              </div>
                            )}
                            <button
                              onClick={() => handleContactSeller(item)}
                              disabled={!currentUser?.user_id || currentUser.user_id === item.seller_id}
                              className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition text-sm font-medium ${
                                !currentUser?.user_id
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : currentUser.user_id === item.seller_id
                                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                  : 'bg-[#3A1078] text-white hover:bg-[#4A23A0]'
                              }`}
                            >
                              <MessageSquare className="w-4 h-4" />
                              {!currentUser?.user_id
                                ? 'Login to Contact'
                                : currentUser.user_id === item.seller_id
                                ? 'Your Item'
                                : 'Contact Buyer'
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}