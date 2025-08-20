import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserListings } from "../../Services/userapi";
import type { Product } from "../../Services/productapi";
import { markProductAsSold, deleteProduct } from "../../Services/productapi";
import ConfirmationModal from "../../Components/ConfirmationModal";

export default function MyListings() {
  const [listings, setListings] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    confirmButtonColor?: string;
    type: 'danger' | 'warning' | 'success' | 'info';
    onConfirm: () => void;
  } | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      setError("");
      const currentUser = localStorage.getItem("currentUser");
      if (!currentUser) {
        throw new Error("User not logged in");
      }
      const listings = await fetchUserListings(JSON.parse(currentUser).user_id);
      setListings(listings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSold = (productId: number) => {
    setModalConfig({
      title: "Mark as Sold",
      message: "Are you sure you want to mark this product as sold? It will be moved to the Sold Items tab.",
      confirmText: "Mark as Sold",
      type: "success",
      onConfirm: async () => {
        setShowModal(false);
        try {
          const result = await markProductAsSold(productId.toString());
          
          if (result.detail.includes("backend restart required")) {
            setError(`${result.detail} - Please restart the backend service to use the full API functionality.`);
            setListings(listings.map(listing => 
              listing.product_id === productId 
                ? { ...listing, status: 'Sold' } 
                : listing
            ));
          } else {
            setError(""); // Clear any previous errors
            await fetchMyListings();
          }
        } catch (err) {
          console.error("Error marking product as sold:", err);
          setError(err instanceof Error ? err.message : "Failed to mark as sold");
        }
      }
    });
    setShowModal(true);
  };

  const handleDeleteProduct = async (productId: number) => {
    setModalConfig({
      title: "Delete Product",
      message: "Are you sure you want to delete this product? This action cannot be undone and the product will be permanently removed.",
      confirmText: "Delete",
      type: "danger",
      onConfirm: async () => {
        setShowModal(false);
        try {
          await deleteProduct(productId.toString());
          setListings(listings.filter(listing => listing.product_id !== productId));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to delete product");
        }
      }
    });
    setShowModal(true);
  };

  // Filter listings based on active tab
  const filteredListings = listings.filter(product => {
    if (activeTab === 'active') {
      return product.status !== 'Sold' && product.status !== 'Deleted';
    } else {
      return product.status === 'Sold';
    }
  });

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-[#3A1078]">My Listings</h1>
      
      {/* Tabs for Menu */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('active')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'active'
                  ? 'border-[#3A1078] text-[#3A1078]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Active Listings
            </button>
            <button
              onClick={() => setActiveTab('sold')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sold'
                  ? 'border-[#3A1078] text-[#3A1078]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sold Items
            </button>
          </nav>
        </div>
      </div>

      {error && <p className="text-center p-8 text-red-600">{error}</p>}
      {loading ? (
        <p className="text-center p-8 text-gray-600">Loading listings...</p>
      ) : filteredListings.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-600 mb-4">
            {activeTab === 'active' 
              ? "You have no active listings" 
              : "You have no sold items"
            }
          </p>
          {activeTab === 'active' && (
            <button
              onClick={() => navigate("/add-product")}
              className="py-2 px-4 bg-[#3A1078] text-white rounded hover:bg-[#2c0a5e] cursor-pointer"
            >
              Add Product
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredListings.map((product) => {
              const imageUrls = (product as any).image_urls || [];
              const hasImages =
                Array.isArray(imageUrls) && imageUrls.length > 0;
              return (
                <div
                  key={product.product_id}
                  className="border border-gray-200 rounded-lg shadow-sm"
                >
                  <div className="p-4">
                    <div className="flex gap-4">
                      {hasImages ? (
                        <img
                          src={imageUrls[0]}
                          alt={product.name}
                          className="w-20 h-20 rounded object-cover border"
                        />
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center bg-gray-100 text-gray-400 rounded border">
                          No Image
                        </div>
                      )}
                      <div className="flex flex-col justify-between flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{product.name}</p>
                          {activeTab === 'sold' ? (
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Sold
                            </div>
                          ) : product.approve_status && (
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.approve_status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : product.approve_status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {product.approve_status.charAt(0).toUpperCase() + product.approve_status.slice(1)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs">Product ID: {product.product_id}</p>
                        <div className="font-small mt-2">{product.description}</div>
                        {product.approve_status === 'rejected' && product.rejection_reason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <strong>Rejection Reason:</strong> {product.rejection_reason}
                          </div>
                        )}
                          <span className=" flex justify-end items-center mt-2 font-bold text-[#3A1078]">
                            €{product.price}
                          </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 border-t border-gray-100 flex gap-2">
                    <button
                      onClick={() => navigate(`/product/${product.product_id}`)}
                      className="flex-1 py-2 px-4 bg-[#3A1078] text-white rounded hover:bg-[#2c0a5e] cursor-pointer"
                    >
                      View Details
                    </button>
                    
                    {activeTab === 'active' && (
                      <>
                        <button
                          onClick={() =>
                            navigate(`/product/${product.product_id}/edit`)
                          }
                          className="flex-1 py-2 px-4 bg-[#3A1078] text-white rounded hover:bg-[#2c0a5e] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleMarkAsSold(product.product_id)}
                          disabled={product.approve_status !== 'approved'}
                          className={`flex-1 py-2 px-4 rounded ${
                            product.approve_status === 'approved'
                              ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          }`}
                          title={
                            product.approve_status === 'approved'
                              ? "Mark as sold"
                              : "Product must be approved before marking as sold"
                          }
                        >
                          Mark as Sold
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.product_id)}
                          className="flex-1 py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
                          title="Delete product permanently"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
      
      {/* Modal for buttons */}
      {modalConfig && (
        <ConfirmationModal
          isOpen={showModal}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
          confirmButtonColor={modalConfig.confirmButtonColor}
          type={modalConfig.type}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
