import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Image, Loader2, AlertCircle } from 'lucide-react';
import { fetchProducts, searchProductsAlt } from '../../Services/productapi.ts';
import { Link } from 'react-router-dom';
import { fetchCategories } from "../../Services/productapi";
import { useToast } from "../../context/ToastContext";

interface ListingItem {
  id : number,
  product_id: number;
  name: string;
  description: string;
  price: string;
  image?: string;
  category?: string;
  condition?: string;
  location?: string;
  image_urls?: string[];
}

interface SearchFilters {
  category: string;
  condition: string;
  min_price: string;
  max_price: string;
  location?: string;
}

const Hand2HandHomepage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const { showToast } = useToast();

  const [filters, setFilters] = useState<SearchFilters>({
    category: '',
    condition: '',
    min_price: '',
    max_price: ''
  });

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log('Filters enabled:'); 
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    const loadCategories = async () => {
        try {
            const cats = await fetchCategories();
            setCategories(cats);
        } catch {
            showToast("Failed to load categories.", "error");
        }
    };
    loadCategories();
    console.log('Categories loaded:', categories); // Debugging: check categories
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const products = await fetchProducts();
      console.log('Fetched products:', products); // Debugging: check product IDs
      setListings(products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      console.log(filters.category)
      setIsSearching(true);
      setError('');
      const searchParams: any = {};
      if (searchTerm.trim()) searchParams.name = searchTerm.trim();
      if (location.trim()) searchParams.location = location.trim();
      if (filters.category) searchParams.category = Number(filters.category);      if (filters.condition) searchParams.condition = filters.condition;
      if (filters.min_price.trim()) searchParams.min_price = parseFloat(filters.min_price);
      if (filters.max_price.trim()) searchParams.max_price = parseFloat(filters.max_price);

      if (Object.keys(searchParams).length === 0) {
        await loadProducts();
        return;
      }

      const results = await searchProductsAlt(searchParams);
      setListings(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocation('');
    setFilters({ category: '', condition: '', min_price: '', max_price: '' });
    loadProducts();
  };

  const hasActiveFilters = () =>
    searchTerm || location ||   Object.values(filters).some(
    value => (typeof value === 'string' ? value.trim() !== '' : value !== '')
  );

  return (
    <div className="min-h-screen">
      <section className="py-2">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white border border-blue-100 shadow-lg rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">What are you looking for?</h2>
            {/* Form Start */}
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter Pincode"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#1E3A8A] font-semibold rounded-lg px-8 py-4 transition shadow-md flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search
                  </>
                )}
              </button>
              {/* Advanced Filter Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className=" bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#1E3A8A] font-semibold rounded-lg px-6 py-4 flex items-center gap-2 shadow-md"
                >
                  Advanced Filters
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                {showFilters && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-orange-200 shadow-xl rounded-xl p-6 z-10 w-80">
                    {/* Filter form */}
                    <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">Advanced Filters</h3>
                    <div className="space-y-4 text-sm">
                      {/* Category */}
                      <div>
                        <label className="font-semibold text-gray-700 mb-2 block">Category</label>
                          <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                      </div>
                      {/* Condition */}
                      <div>
                        <label className="font-semibold text-gray-700 mb-2 block">Condition</label>
                        <select
                          value={filters.condition}
                          onChange={(e) => handleFilterChange('condition', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="">Any Condition</option>
                          <option value="New">New</option>
                          <option value="Used">Used</option>
                          <option value="Old">Old</option>
                        </select>
                      </div>
                      {/* Price */}
                      <div>
                        <label className="font-semibold text-gray-700 mb-2 block">Price Range</label>
                        <div className="flex gap-3">
                          <input
                            type="number"
                            placeholder="Min"
                            value={filters.min_price}
                            onChange={(e) => handleFilterChange('min_price', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:outline-none"
                          />
                          <input
                            type="number"
                            placeholder="Max"
                            value={filters.max_price}
                            onChange={(e) => handleFilterChange('max_price', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      {/* Buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={handleSearch}
                          disabled={isSearching}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-6 py-3 transition shadow-md"
                        >
                          {isSearching ? 'Applying...' : 'Apply'}
                        </button>
                        <button
                          type="button"
                          onClick={clearFilters}
                          disabled={isSearching}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg px-6 py-3 transition shadow-md"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
            {/* Form End */}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="flex items-center gap-2 mb-4 text-red-600 bg-red-100 border border-red-200 p-4 rounded-lg">
            <AlertCircle />
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center">
            <Loader2 className="animate-spin w-8 h-8 text-gray-600" />
          </div>
        )}

        {!loading && !isSearching && listings.length > 0 && (
          <>
            <div className="bg-green-50 p-2 border border-green-200 rounded-lg mb-2">
              <p className="text-blue-800 font-semibold">
                Found {listings.length} product{listings.length !== 1 ? 's' : ''}
                {hasActiveFilters() ? ' matching your search' : ''}
              </p>
            </div>
            <div className="space-y-8">
              {listings.map((item) => (
                <div
                  key={item.product_id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex">
                    <div className="w-36 h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-l-xl flex items-center justify-center overflow-hproduct_idden">
                      {item.image_urls?.[0] ? (
                        <>
                          <img
                            src={item.image_urls?.[0]}
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
                    <div className="flex-1 p-6">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-[#004AAD] mb-2 hover:text-[#003380] transition">
                            <Link to={`/product/${item.product_id}`}>
                              {item.name} 
                            </Link>
                          </h3>
                          <p className="text-gray-600 mb-3">{item.description}</p>
                          <div className="flex gap-3 text-sm items-center flex-wrap">
                            {item.category && (
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                {item.category}
                              </span>
                            )}
                            {item.condition && (
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                                {item.condition}
                              </span>
                            )}
                            {item.location && (
                              <span className="text-gray-500 flex items-center gap-1">
                                📍 {item.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-6">
                          <span className="text-3xl font-bold text-[#F4A300]">€{item.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && !isSearching && listings.length === 0 && (
          <p className="text-center text-gray-600">No products found.</p>
        )}
      </section>
    </div>
  );
};

export default Hand2HandHomepage;
