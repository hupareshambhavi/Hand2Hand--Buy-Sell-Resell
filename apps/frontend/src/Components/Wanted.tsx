import ProductForm from "../Pages/User/ProductForm";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import type { ProductAPIIn } from "../product";

export default function PostWantedPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (data: ProductAPIIn) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to post wanted item");
      }

      showToast("Wanted item posted successfully!", "success");
      navigate("/search-wanted");
    } catch (error) {
      console.error("Error posting wanted item:", error);
      showToast("Failed to post wanted item. Please try again.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <Search className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Post a Wanted Item
              </h1>
              <p className="text-gray-600">
                Describe what you're looking for and let sellers find you
              </p>
            </div>
            <ProductForm mode="wanted" onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
}