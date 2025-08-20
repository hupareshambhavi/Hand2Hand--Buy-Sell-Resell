import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image, Loader2, AlertCircle, Eye, Clock, Package } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface PendingListing {
  id: number;
  product_id: number;
  name: string;
  description: string;
  price: string;
  image?: string;
  category?: string;
  condition?: string;
  location?: string;
  image_urls?: string[];
  created_at?: string;
  user_id?: number;
}

const Listings: React.FC = () => {
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    loadPendingListings();
  }, []);

  const loadPendingListings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/moderator/pending-listings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
          // 'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending listings');
      }

      const data = await response.json();
      setListings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pending listings';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId: number) => {
    // Navigate to ProductDetails page with state indicating it came from listings
    // This enables the Accept/Reject moderator actions on the product detail page
    navigate(`/product/${productId}`, {
      state: { fromListings: true }
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin w-8 h-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading pending listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Pending Listings</h1>
          </div>
          <p className="text-gray-600">
            Review and moderate product listings submitted by users. Click on any listing to view details and approve or reject.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 mb-6 text-red-600 bg-red-100 border border-red-200 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
            <button
              onClick={loadPendingListings}
              className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Listings Count */}
        {listings.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <p className="text-blue-800 font-semibold">
                {listings.length} pending listing{listings.length !== 1 ? 's' : ''} awaiting review
              </p>
            </div>
          </div>
        )}

        {/* Listings Grid */}
        {listings.length > 0 ? (
          <div className="space-y-6">
            {listings.map((listing) => (
              <div
                key={listing.product_id}
                onClick={() => handleProductClick(listing.product_id)}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-blue-200 cursor-pointer group"
              >
                <div className="flex">
                  {/* Product Image */}
                  <div className="w-48 h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-l-xl flex items-center justify-center overflow-hidden">
                    {listing.image_urls?.[0] ? (
                      <>
                        <img
                          src={listing.image_urls[0]}
                          alt={listing.name}
                          className="w-full h-full object-cover rounded-l-xl group-hover:scale-105 transition-transform duration-200"
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

                  {/* Product Details */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {listing.name}
                          </h3>
                          <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                            Pending Review
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {listing.description}
                        </p>

                        {/* Tags */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                          {listing.category && (
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                              {listing.category}
                            </span>
                          )}
                          {listing.condition && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                              {listing.condition}
                            </span>
                          )}
                          {listing.location && (
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                              📍 {listing.location}
                            </span>
                          )}
                        </div>

                        {/* Submission Info */}
                        <div className="text-sm text-gray-500">
                          <p>Submitted: {formatDate(listing.created_at)}</p>
                          {listing.user_id && <p>User ID: {listing.user_id}</p>}
                        </div>
                      </div>

                      {/* Price and Action */}
                      <div className="text-right ml-6">
                        <div className="text-3xl font-bold text-orange-500 mb-4">
                          €{listing.price}
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 group-hover:text-blue-700 transition-colors">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-medium">Click to Review</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Pending Listings</h3>
            <p className="text-gray-500">
              All product listings have been reviewed. New submissions will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Listings;