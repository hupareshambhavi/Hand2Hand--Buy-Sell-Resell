import { useNavigate } from "react-router-dom";
import ProductForm from "../User/ProductForm";
import type { ProductAPIIn } from "../../product";
import { HOME } from "../../routes";
import { useToast } from "../../context/ToastContext";

export default function AddProduct() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (product: ProductAPIIn) => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      if (!res.ok) {
        const errorData = await res.json();
        showToast(
          errorData.message || "Failed to create product. Please try again.",
          "error"
        );
        return;
      }

      showToast("Product created successfully!", "success");
      navigate(HOME);
    } catch (error) {
      console.error("Error creating product:", error);
      showToast(
        "An unexpected error occurred. Please try again later.",
        "error"
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
            Add a Listing
          </h1>
          <ProductForm mode="add" onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
