import React, { useState, useRef, useEffect } from "react";
import type { ProductAPIIn } from "../../product";
import { useToast } from "../../context/ToastContext";
import {
  fetchCategories,
  fetchProductById,
  updateProduct,
} from "../../Services/productapi";
import { useParams, useNavigate } from "react-router-dom";

type Props = {
  onSubmit?: (product: ProductAPIIn) => void;
  mode: "add" | "edit" | "wanted";
};

export default function ProductForm({ mode = "add", onSubmit }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    condition: "Good",
    category_id: "",
    is_wanted: mode === "wanted",
    location: "",
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("currentUser");

    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        setCurrentUser(parsedUserData);
      } catch (error) {
        showToast("Error loading user data. Please log in again.", "error");
      }
    } else {
      showToast("Please log in to create a product.", "error");
    }

    const loadCategories = async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch {
        showToast("Failed to load categories.", "error");
      }
    };
    loadCategories();
  }, [showToast]);

  useEffect(() => {
    if (mode === "edit" && id) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          setError(null);
          const product = await fetchProductById(id);
          setFormData({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            condition: product.condition || "Good",
            category_id: product.category_id?.toString() || "",
            is_wanted: product.is_wanted ?? true,
            location: product.location || "",
          });
          if (
            (product as any).image_urls &&
            Array.isArray((product as any).image_urls)
          ) {
            setSelectedImages((product as any).image_urls);
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to load product"
          );
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, mode]);

  const validateAndProcessFiles = (files: File[]) => {
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
    const ALLOWED_TYPES = ["image/jpeg", "image/png"];

    // Check if adding new files would exceed total limit of 6
    if (selectedImages.length + files.length > 6) {
      showToast(`You can only have up to 6 images total. You currently have ${selectedImages.length} image${selectedImages.length !== 1 ? 's' : ''}.`, "warning");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return false;
    }

    const invalidFiles = files.filter((file) => {
      const isInvalidType = !ALLOWED_TYPES.includes(file.type);
      const isTooLarge = file.size > MAX_FILE_SIZE;
      return isInvalidType || isTooLarge;
    });

    if (invalidFiles.length > 0) {
      const invalidTypes = invalidFiles.filter(
        (file) => !ALLOWED_TYPES.includes(file.type)
      );
      const tooLarge = invalidFiles.filter((file) => file.size > MAX_FILE_SIZE);

      let errorMessage = "";
      if (invalidTypes.length > 0) {
        errorMessage += "Only .jpg and .png files are allowed. ";
      }
      if (tooLarge.length > 0) {
        errorMessage += "Some files exceed the 2MB size limit.";
      }

      showToast(errorMessage.trim(), "error");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return false;
    }

    // Check for duplicates and add to current selection
    const existingFiles = selectedImages.filter(
      (img) => typeof img === "object"
    ) as File[];
    const newFiles = files.filter(
      (newFile) =>
        !existingFiles.some(
          (existingFile) =>
            existingFile.name === newFile.name &&
            existingFile.size === newFile.size
        )
    );

    const duplicateCount = files.length - newFiles.length;

    if (duplicateCount > 0) {
      showToast(
        `${duplicateCount} image${
          duplicateCount !== 1 ? "s" : ""
        } already selected`,
        "warning"
      );
    }

    if (newFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...newFiles]);
      showToast(
        `${newFiles.length} new image${newFiles.length !== 1 ? "s" : ""} added`,
        "info"
      );
    }

    return true;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    validateAndProcessFiles(fileArray); // defaults to append (true)
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !currentUser.user_id) {
      showToast("Please log in to create a product.", "error");
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      showToast("Please enter a product name.", "error");
      return;
    }

    if (!formData.price.trim()) {
      showToast("Please enter a price.", "error");
      return;
    }

    if (!formData.category_id) {
      showToast("Please select a category.", "error");
      return;
    }

    // Check if there are more than 6 images
    if (selectedImages.length > 6) {
      showToast("You can only upload up to 6 images.", "warning");
      return;
    }

    const priceNumber = parseFloat(formData.price);
    const categoryId = parseInt(formData.category_id);

    if (isNaN(priceNumber) || isNaN(categoryId)) {
      showToast("Price and Category must be valid numbers.", "error");
      return;
    }

    if (priceNumber <= 0) {
      showToast("Price must be greater than 0.", "error");
      return;
    }
    const uploadedImageUrls: string[] = [];

    try {
      if (selectedImages.length > 0) {
        showToast("Uploading images...", "info");

        for (let i = 0; i < selectedImages.length; i++) {
          const image = selectedImages[i];
          if (typeof image === "string") continue; // skip URLs in edit mode
          console.log(image);
          const fileExt = image.name.split(".").pop();
          const uniqueFileName = `${Date.now()}_${Math.random()
            .toString(36)
            .substring(2)}.${fileExt}`;
          const key = `uploads/${uniqueFileName}`;
          const url = `https://hand2handimages.s3.amazonaws.com/${key}`;

          console.log("in uploading image");
          const uploadRes = await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type": image.type,
            },
            body: image,
          });

          if (!uploadRes.ok) {
            showToast("Failed to upload one or more images.", "error");
            return;
          }

          uploadedImageUrls.push(url);
        }
        console.log("after uploaded images");
        showToast("Images uploaded successfully!", "success");
      }

      const existingImageUrls = selectedImages.filter(
        (img) => typeof img === "string"
      ) as string[];
      const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls];
      const productData: ProductAPIIn = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: priceNumber,
        condition: formData.condition.trim(),
        image_urls: finalImageUrls,
        seller_id: currentUser.user_id,
        category_id: categoryId,
        is_wanted: formData.is_wanted,
        location: formData.location,
      };

      if (mode === "edit" && id) {
        await updateProduct(id, productData);
        showToast("Product updated successfully!", "success");
        navigate("/my-listings");
      } else if (onSubmit) {
        onSubmit(productData);
      }
    } catch (error) {
      showToast("Failed to save product. Please try again.", "error");
    }
  };
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  return (
    <>
      <form
        className="space-y-6 max-w-4xl mx-auto gap-6"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Product Name*
              </label>
              <input
                name="name"
                required
                onChange={handleChange}
                value={formData.name}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Price*
              </label>
              <input
                type="number"
                name="price"
                step="0.01"
                required
                onChange={handleChange}
                value={formData.price}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Category*
              </label>
              <select
                name="category_id"
                required
                onChange={handleChange}
                value={formData.category_id}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Condition
              </label>
              <select
                name="condition"
                onChange={handleChange}
                value={formData.condition}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">Select</option>
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Old">Old</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Postal Code*
              </label>
              <input
                name="location"
                required
                onChange={handleChange}
                value={formData.location}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                onChange={handleChange}
                value={formData.description}
                className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                rows={4}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Upload Images (max 6)
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const files = Array.from(e.dataTransfer.files);
                  validateAndProcessFiles(files); // defaults to append (true)
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="space-y-2">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-indigo-600 hover:text-indigo-500">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG up to 2MB each (max 6 images)
                  </p>
                </div>
              </div>
              {selectedImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">
                    {selectedImages.length} image
                    {selectedImages.length !== 1 ? "s" : ""} selected
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        {typeof image === "string" ? (
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="h-24 w-full object-cover rounded-lg"
                          />
                        ) : (
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="h-24 w-full object-cover rounded-lg"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = selectedImages.filter(
                              (_, i) => i !== index
                            );
                            setSelectedImages(newImages);
                            showToast("Image removed", "info");
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4">
          {mode === "edit" ? (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition font-semibold shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full bg-[#3A1078] text-white py-3 rounded-lg hover:bg-[#4A23A0] transition font-semibold shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full bg-[#3A1078] text-white py-3 rounded-lg hover:bg-[#4A23A0] transition font-semibold shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Product
            </button>
          )}
        </div>
      </form>
    </>
  );
}
