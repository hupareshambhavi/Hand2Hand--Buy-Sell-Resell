import React, { useState, useEffect } from "react";
import { fetchCategories } from "../Services/productapi";
import { useToast } from "../context/ToastContext";

interface DeliveryAgentDetailsProps {
  onNext: (details: {
    transport_mode: string;
    identity_img_url: string | null;
    category_ids: string[];
    delivery_items: string[];
    phone_number: string;
  }) => void;
  onBack: () => void;
}

interface Category {
  id: number;
  name: string;
}

const DeliveryAgentDetails: React.FC<DeliveryAgentDetailsProps> = ({ onNext, onBack }) => {
  const [formData, setFormData] = useState({
    phone_number: "",
    delivery_items: [] as string[],
    transport_mode: "",
    identity_img_url: null as File | null,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (err) {
        setError("Failed to load categories");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Validate form data
  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.phone_number.trim()) {
      errors.phone_number = "Phone number is required";
    } else if (!/^\d{10,}$/.test(formData.phone_number.replace(/\s/g, ''))) {
      errors.phone_number = "Please enter a valid phone number (at least 10 digits)";
    }

    if (formData.delivery_items.length === 0) {
      errors.delivery_items = "Please select at least one delivery item category";
    }

    if (!formData.transport_mode) {
      errors.transport_mode = "Please select a transport mode";
    }

    if (!formData.identity_img_url) {
      errors.identity_img_url = "Please upload your identity proof";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if form is complete
  const isFormComplete = () => {
    return (
      formData.phone_number.trim() !== "" &&
      formData.delivery_items.length > 0 &&
      formData.transport_mode !== "" &&
      formData.identity_img_url !== null
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleCategoryChange = (categoryName: string) => {
    setFormData((prev) => {
      const currentItems = prev.delivery_items;
      const newItems = currentItems.includes(categoryName)
        ? currentItems.filter((item) => item !== categoryName)
        : [...currentItems, categoryName];
      
      return {
        ...prev,
        delivery_items: newItems,
      };
    });
    
    // Clear validation error when user selects categories
    if (validationErrors.delivery_items) {
      setValidationErrors(prev => ({
        ...prev,
        delivery_items: ""
      }));
    }
  };

  const handleSelectAllCategories = () => {
    // Check if all categories are currently selected
    const allSelected = categories.every(cat => 
      formData.delivery_items.includes(cat.name)
    );
    
    // If all are selected, unselect all. Otherwise, select all
    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        delivery_items: []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        delivery_items: categories.map(cat => cat.name)
      }));
    }
    
    // Clear validation error when user selects categories
    if (validationErrors.delivery_items) {
      setValidationErrors(prev => ({
        ...prev,
        delivery_items: ""
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type and size
      const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
      
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast("Only .jpg and .png files are allowed.", "error");
        return;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        showToast("File size must be less than 2MB.", "error");
        return;
      }
      
      setFormData((prev) => ({
        ...prev,
        identity_img_url: file,
      }));
      
      // Clear validation error when user uploads file
      if (validationErrors.identity_img_url) {
        setValidationErrors(prev => ({
          ...prev,
          identity_img_url: ""
        }));
      }
      
      showToast("Identity proof selected", "info");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Validate file type and size
      const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
      
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast("Only .jpg and .png files are allowed.", "error");
        return;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        showToast("File size must be less than 2MB.", "error");
        return;
      }
      
      setFormData((prev) => ({
        ...prev,
        identity_img_url: file,
      }));
      
      // Clear validation error when user uploads file
      if (validationErrors.identity_img_url) {
        setValidationErrors(prev => ({
          ...prev,
          identity_img_url: ""
        }));
      }
      
      showToast("Identity proof selected", "info");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsUploading(true);
    
    try {
      let uploadedImageUrl: string | null = null;
      
      // Upload identity proof to S3 if selected
      if (formData.identity_img_url) {
        showToast("Uploading identity proof...", "info");
        
        const fileExt = formData.identity_img_url.name.split('.').pop();
        const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const key = `uploads/${uniqueFileName}`;
        const url = `https://hand2handimages.s3.amazonaws.com/${key}`;

        const uploadRes = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": formData.identity_img_url.type,
          },
          body: formData.identity_img_url,
        });

        if (!uploadRes.ok) {
          showToast("Failed to upload identity proof.", "error");
          setIsUploading(false);
          return;
        }

        uploadedImageUrl = url;
        showToast("Identity proof uploaded successfully!", "success");
      }
      
      const selectedCategoryIds = categories
        .filter(cat => formData.delivery_items.includes(cat.name))
        .map(cat => cat.id.toString());
      
      console.log('Selected delivery items:', formData.delivery_items);
      console.log('Selected category IDs:', selectedCategoryIds);
      
      onNext({
        ...formData,
        identity_img_url: uploadedImageUrl,
        category_ids: selectedCategoryIds
      });
    } catch (error) {
      showToast("Failed to upload identity proof. Please try again.", "error");
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading categories...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="max-w-xl mx-auto mt-8 p-6">
      <h2 className="text-2xl font-bold mb-6">Complete Your Delivery Agent Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="text"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            required
            className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#3A1078] ${
              validationErrors.phone_number ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your phone number"
          />
          {validationErrors.phone_number && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.phone_number}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Which type of items would you like to deliver? *
          </label>
          
          {/* Select All Button */}
          <div className="mb-3">
            <button
              type="button"
              onClick={handleSelectAllCategories}
              className="px-4 py-2 bg-[#3A1078] text-white rounded hover:bg-[#4C1D95] transition-colors text-sm font-medium cursor-pointer"
            >
              {categories.every(cat => formData.delivery_items.includes(cat.name)) 
                ? 'Unselect All' 
                : 'Select All'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`category-${category.id}`}
                  checked={formData.delivery_items.includes(category.name)}
                  onChange={() => handleCategoryChange(category.name)}
                  className="h-4 w-4 text-[#3A1078] focus:ring-[#3A1078] border-gray-300 rounded"
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="ml-2 block text-sm text-gray-700"
                >
                  {category.name}
                </label>
              </div>
            ))}
          </div>
          {validationErrors.delivery_items && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.delivery_items}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transport Mode *
          </label>
          <select
            name="transport_mode"
            value={formData.transport_mode}
            onChange={handleChange}
            required
            className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#3A1078] ${
              validationErrors.transport_mode ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select transport mode</option>
            <option value="bicycle">Bicycle</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="car">Car</option>
            <option value="van">Van</option>
          </select>
          {validationErrors.transport_mode && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.transport_mode}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Identity Proof (Student ID) *
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              validationErrors.identity_img_url ? 'border-red-500' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="identity_img_url"
            />
            <label
              htmlFor="identity_img_url"
              className="cursor-pointer text-[#3A1078] hover:text-[#4E31AA]"
            >
              {formData.identity_img_url ? (
                <div>
                  <p className="text-sm text-gray-600">
                    Selected file: {formData.identity_img_url.name}
                  </p>
                  <img
                    src={URL.createObjectURL(formData.identity_img_url)}
                    alt="Preview"
                    className="mt-2 max-h-40 mx-auto"
                  />
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600">
                    Drag and drop your identity proof here, or click to select
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              )}
            </label>
          </div>
          {validationErrors.identity_img_url && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.identity_img_url}</p>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={onBack}
            disabled={isUploading}
            className="px-6 py-2 border border-[#3A1078] text-[#3A1078] rounded hover:bg-[#3A1078] hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <div className="relative group">
            <button
              type="submit"
              disabled={!isFormComplete() || isUploading}
              className={`px-6 py-2 rounded transition-colors ${
                isFormComplete() && !isUploading
                  ? 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Next'}
            </button>
            {!isFormComplete() && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Please fill all required fields
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default DeliveryAgentDetails;