import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, MessageSquare, Heart, Check, X, Eye } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface Product {
  product_id: number;
  name: string;
  description: string;
  price: number;
  condition: string;
  image_urls: string[];
  location: string;
  category_name: string;
  category_id?: number;
  seller_id?: number;
  created_at?: string;
}

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [moderatorLoading, setModeratorLoading] = useState(false);
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [showAcceptPopup, setShowAcceptPopup] = useState(false);
  const [showRejectSuccessPopup, setShowRejectSuccessPopup] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { showToast } = useToast();

  // Check if user came from listings page (for moderator actions)
  // Only show Accept/Reject buttons when moderator comes from the listings page
  const fromListings = location.state?.fromListings === true;
  
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        if (userData && userData.user_id) {
          setUserId(userData.user_id);
          setUserType(userData.user_type);
        }
      } catch (err) {
        console.error('Error parsing currentUser:', err);
      }
    }
  }, []);

  const isLoggedIn = !!userId;
  const isModerator = userType === "moderator";
  const isRegularUser = userType === "user";

  useEffect(() => {
    if (showAcceptPopup) {
      const timer = setTimeout(() => {
        setShowAcceptPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showAcceptPopup]);

  useEffect(() => {
    if (showRejectSuccessPopup) {
      const timer = setTimeout(() => {
        setShowRejectSuccessPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showRejectSuccessPopup]);

  const checkFavoriteStatus = async () => {
    if (!userId || !id) return;
    
    try {
      const favRes = await fetch(`${API_BASE_URL}/users/favourites/${userId}`);
      if (favRes.ok) {
        const favoritesData = await favRes.json();
        let favoritesArray = [];
        if (Array.isArray(favoritesData)) {
          favoritesArray = favoritesData;
        } else if (favoritesData && Array.isArray(favoritesData.products)) {
          favoritesArray = favoritesData.products;
        }
        
        const isCurrentlyFavorite = favoritesArray.some((fav: any) => 
          fav.product_id === parseInt(id!)
        );
        setIsFavorite(isCurrentlyFavorite);
      }
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  };

  const fetchSimilarProducts = async (productId: number) => {
    setSimilarLoading(true);
    setSimilarError(null);
    try {
      console.log(`Fetching similar products for product ID: ${productId}`);
      
      const res = await fetch(`${API_BASE_URL}/products/${productId}/similar`);
      
      if (!res.ok) {
        if (res.status === 404) {
          console.log('Product not found for similar products');
          setSimilarProducts([]);
          return;
        }
        const errorText = await res.text();
        console.error(`Failed to fetch similar products: ${res.status} ${res.statusText}`, errorText);
        throw new Error(`Failed to fetch similar products: ${res.status}`);
      }
      
      const data = await res.json();
      console.log(`Received ${data.length} similar products:`, data);
      if (Array.isArray(data)) {
        setSimilarProducts(data);
      } else {
        console.warn('Similar products response is not an array:', data);
        setSimilarProducts([]);
      }
    } catch (err) {
      console.error('Error fetching similar products:', err);
      setSimilarError('Failed to load similar products');
      setSimilarProducts([]);
    } finally {
      setSimilarLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        console.log(`Fetching product details for ID: ${id}`);
        const res = await fetch(`${API_BASE_URL}/products/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Product not found');
          }
          throw new Error('Failed to fetch product');
        }
        
        const data = await res.json();
        console.log('Product data received:', data);
        
        setProduct(data);
        if (data.image_urls?.length) {
          setSelectedImage(data.image_urls[0]);
        }
        
        if (isRegularUser) {
          await fetchSimilarProducts(data.product_id);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        showToast((err as Error).message, 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isRegularUser, API_BASE_URL, showToast]);

  useEffect(() => {
    if (userId && id) {
      checkFavoriteStatus();
    }
  }, [userId, id]);

  const toggleFavorite = async () => {
    if (!userId || !id) {
      navigate('/login');
      return;
    }
    const originalFavoriteState = isFavorite;
    setIsFavorite(!originalFavoriteState); 
    setFavoriteLoading(true);
    try {
      if (originalFavoriteState) {
        const res = await fetch(`${API_BASE_URL}/users/favourites/${userId}/${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to remove favorite');
        showToast('Removed from favorites', 'success');
      } else {
        const res = await fetch(`${API_BASE_URL}/users/favourites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            product_id: id
          })
        });
        if (!res.ok) throw new Error('Failed to add favorite');
        showToast('Added to favorites', 'success');
      }
    } catch (error) {
      console.error('Favorite action failed:', error);
      setIsFavorite(originalFavoriteState);
      showToast(`Operation failed: ${(error as Error).message}`, 'error');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleMessageOwner = async () => {
    if (!userId || !product?.seller_id) {
      navigate('/login');
      return;
    }
    if (userId === product.seller_id) {
      showToast("You cannot message yourself!", 'error');
      return;
    }
    setMessageLoading(true);
    try {
      const sortedUserIds = [userId, product.seller_id].sort((a, b) => a - b);
      const roomName = `product_${id}_${sortedUserIds[0]}_${sortedUserIds[1]}`;
      navigate(`/chat/${roomName}`, {
        state: {
          productId: id,
          productName: product.name,
          sellerId: product.seller_id,
          buyerId: userId,
          isNewChat: true
        }
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      showToast('Failed to start conversation. Please try again.', 'error');
    } finally {
      setMessageLoading(false);
    }
  };
  
  const handleReportProduct = () => {
    if (!userId || !id) {
      navigate('/login');
      return;
    }
    if (product?.seller_id && userId === product.seller_id) {
      showToast("You cannot report your own product!", 'error');
      return;
    }
    setShowReportPopup(true);
  };

  const confirmReportProduct = async () => {
    if (!reportReason.trim()) {
      showToast("Please provide a reason for reporting", 'error');
      return;
    }

    setReportLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/reports/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          product_id: parseInt(id!),
          reason: reportReason.trim()
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.detail || errorData.message || 'Failed to report product';
        throw new Error(errorMessage);
      }

      setShowReportPopup(false);
      setReportReason("");
      showToast('Product has been reported successfully!', 'success');
    } catch (error) {
      console.error('Error reporting product:', error);
      showToast((error as Error).message, 'error');
    } finally {
      setReportLoading(false);
    }
  };

  const handleAcceptProduct = async () => {
    if (!id) return;
    setModeratorLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/moderator/approve-listings/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moderator_id: userId,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to accept product");
      setShowAcceptPopup(true);
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      console.error('Error accepting product:', error);
      showToast(`Failed to accept product: ${(error as Error).message}`, 'error');
    } finally {
      setModeratorLoading(false);
    }
  };

  const handleRejectProduct = async () => {
    if (!id || !rejectReason.trim()) {
      showToast('Please provide a reason for rejection.', 'error');
      return;
    }
    setModeratorLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/moderator/reject-listings/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moderator_id: userId,
            reason: rejectReason.trim(),
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to reject product");
      setShowRejectPopup(false);
      setRejectReason("");
      setShowRejectSuccessPopup(true);
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      console.error("Error rejecting product:", error);
      showToast(`Failed to reject product: ${(error as Error).message}`, "error");
    } finally {
      setModeratorLoading(false);
    }
  };

  const handleSimilarProductClick = (productId: number) => {

    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(`/product/${productId}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getConditionColor = (condition: string) => {
    const colors = {
      'new': 'bg-green-100 text-green-800',
      'like-new': 'bg-blue-100 text-blue-800',
      'good': 'bg-yellow-100 text-yellow-800',
      'fair': 'bg-orange-100 text-orange-800',
      'poor': 'bg-red-100 text-red-800',
    };
    return colors[condition?.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return <p className="p-6 text-red-600 font-semibold">Product not found.</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 relative">
      <div className="absolute top-4 right-4 flex gap-3 z-10">
        {isRegularUser && (
          <button
            onClick={toggleFavorite}
            className={`p-2 rounded-full transition-all ${
              !isLoggedIn 
                ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                : 'hover:bg-gray-100 hover:scale-110'
            }`}
            disabled={!isLoggedIn || favoriteLoading || (product?.seller_id === userId)}
            title={!isLoggedIn ? 'Login to add favorites' : isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {favoriteLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
            ) : (
              <Heart 
                className={`w-6 h-6 transition-colors ${
                  isFavorite 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-gray-600 hover:text-red-500'
                }`} 
              />
            )}
          </button>
        )}
        {isRegularUser && (
          <button
            onClick={handleReportProduct}
            disabled={!isLoggedIn || (product?.seller_id ? userId === product.seller_id : false)}
            className={`text-white px-3 py-1 rounded-lg text-sm transition ${
              !isLoggedIn || (product?.seller_id ? userId === product.seller_id : false)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
            title={
              !isLoggedIn 
                ? 'Login to report product' 
                : (product?.seller_id ? userId === product.seller_id : false)
                  ? 'You cannot report your own product'
                  : 'Report this product'
            }
          >
            Report
          </button>
        )}
      </div>

      {showReportPopup && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Report Product</h3>
            <p className="text-sm text-gray-600 mb-3">Please provide the reason for reporting this product:</p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Enter your reason here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={confirmReportProduct}
                disabled={reportLoading || !reportReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center"
              >
                {reportLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Submit Report'}
              </button>
              <button
                onClick={() => {
                  setShowReportPopup(false);
                  setReportReason('');
                }}
                disabled={reportLoading}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectPopup && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Reason for Rejection</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this product..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleRejectProduct}
                disabled={moderatorLoading || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {moderatorLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
              <button
                onClick={() => {
                  setShowRejectPopup(false);
                  setRejectReason('');
                }}
                disabled={moderatorLoading}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="w-full h-96 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center mb-4">
            {selectedImage ? (
              <img src={selectedImage} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <div className="text-gray-400">No Image</div>
            )}
          </div>
          {product.image_urls && product.image_urls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.image_urls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  onClick={() => setSelectedImage(url)}
                  className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 transition ${
                    selectedImage === url ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-700 mb-4">{product.description}</p>
            <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-6">
              <span className="bg-gray-100 px-3 py-1 rounded-full">Category: {product.category_name}</span>
              <span className={`px-3 py-1 rounded-full ${getConditionColor(product.condition)}`}>
                Condition: {product.condition}
              </span>
              {product.created_at && (
                <span className="bg-gray-100 px-3 py-1 rounded-full">
                  Date Posted: {new Date(product.created_at).toLocaleDateString()}
                </span>
              )}
              <span className="bg-gray-100 px-3 py-1 rounded-full">📍 {product.location}</span>
            </div>
            <p className="text-4xl font-bold text-orange-500 mb-4">{formatPrice(product.price)}</p>
          </div>
          {isRegularUser && product.seller_id && (
            <button
              onClick={handleMessageOwner}
              disabled={!isLoggedIn || messageLoading || userId === product.seller_id}
              className={`w-full p-3 rounded-lg flex items-center justify-center gap-2 transition ${
                !isLoggedIn
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : userId === product.seller_id
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : messageLoading
                  ? 'bg-gray-400 text-gray-600'
                  : 'bg-[#3A1078] text-white hover:opacity-85'
              }`}
            >
              {messageLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
              {!isLoggedIn 
                ? 'Login to Message Seller' 
                : userId === product.seller_id
                ? 'This is Your Product'
                : messageLoading
                ? 'Starting Chat...'
                : 'Message the Seller'
              }
            </button>
          )}
        </div>
      </div>

      {isRegularUser && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Products</h2>
          {similarLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
            </div>
          ) : similarError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{similarError}</p>
              <button 
                onClick={() => product && fetchSimilarProducts(product.product_id)}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : similarProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((similarProduct) => (
                <div
                  key={similarProduct.product_id}
                  onClick={() => handleSimilarProductClick(similarProduct.product_id)}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {similarProduct.image_urls && similarProduct.image_urls.length > 0 ? (
                      <img
                        src={similarProduct.image_urls[0]}
                        alt={similarProduct.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement?.appendChild(
                            Object.assign(document.createElement('div'), {
                              className: 'w-full h-full flex items-center justify-center',
                              innerHTML: '<div class="text-gray-400 text-sm flex flex-col items-center"><svg class="w-12 h-12 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 9a3 3 0 000 6 3 3 0 000-6z"/><path d="M12 1l.27.28L15 2l.28.27L16 5l.27.28L19 6l.28.27L20 9l.27.28L23 10l.28.27L24 13l-.27.28L23 14l-.28.27L20 15l-.27.28L19 18l-.28.27L16 19l-.27.28L15 22l-.28.27L12 23l-.27-.28L9 22l-.28-.27L8 19l-.27-.28L5 18l-.28-.27L4 15l-.27-.28L1 14l-.28-.27L0 11l.27-.28L1 10l.28-.27L4 9l.27-.28L5 6l.28-.27L8 5l.27-.28L9 2l.28-.27L12 1z"/></svg>No Image</div>'
                            })
                          );
                        }}
                      />
                    ) : (
                      <div className="text-gray-400 text-sm flex flex-col items-center">
                        <Eye className="w-12 h-12 mb-2" />
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {similarProduct.name}
                    </h3>
                    <p className="text-orange-500 font-bold text-lg mb-2">
                      {formatPrice(similarProduct.price)}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded text-xs ${getConditionColor(similarProduct.condition)}`}>
                        {similarProduct.condition}
                      </span>
                      <span>📍 {similarProduct.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">No similar products found in this category.</p>
            </div>
          )}
        </div>
      )}

      {isModerator && fromListings && (
        <div className="mt-8 p-4 border border-indigo-200 rounded-lg" style={{ backgroundColor: '#E0E7FF' }}>
          <h3 className="font-semibold text-indigo-800 mb-3">Moderator Actions</h3>
          <div className="flex gap-3">
            <button
              onClick={handleAcceptProduct}
              disabled={moderatorLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {moderatorLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Accept
            </button>
            <button
              onClick={() => setShowRejectPopup(true)}
              disabled={moderatorLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>
      )}


      {!isLoggedIn && (
        <div className="mt-8 p-6 border border-blue-200 bg-blue-50 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-700">Login or register to save favorites and message sellers.</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="ml-6 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            Login / Register
          </button>
        </div>
      )}

      {/* Success popups */}
      {showAcceptPopup && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <span className="text-lg">✓</span>
            <span>Product accepted successfully! It will now appear on the homepage.</span>
          </div>
        </div>
      )}
      {showRejectSuccessPopup && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <span className="text-lg">✗</span>
            <span>Product rejected successfully! Redirecting to homepage...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;