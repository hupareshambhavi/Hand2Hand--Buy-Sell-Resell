// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { SEARCH_AND_CREATE_PRODUCTS } from "../routes";

// ------------------- Interfaces ------------------- //
export interface Product {
  id : number,
  product_id : number,
  name: string;
  description: string;
  price: string;
  image?: string;
  category?: string;
  category_id?: number;
  condition?: string;
  location?: string;
  createdAt?: string;
  image_urls?: string[];
  is_wanted?: boolean;
  approve_status?: string;
  rejection_reason?: string;
  status?: string;
}

export interface ProductAPIIn {
  name: string;
  description: string;
  price: number;
  condition: string;
  image_urls: string[];
  seller_id: number;
  category_id: number;
  is_wanted: boolean;
}

export interface SearchParams {
  category?: string;
  name?: string;
  condition?: string;
  location?: string;
  min_price?: number;
  max_price?: number;
}

export interface Category {
  id: number;
  name: string;
}

// ------------------- Error Handler ------------------- //
const handleFetchError = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      console.error("Error response data:", errorData);

      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (typeof errorData === "object") {
        errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;

        if (response.status === 422 && errorData.errors) {
          const validationErrors = Array.isArray(errorData.errors)
            ? errorData.errors.map((err: any) => err.msg || err.message || JSON.stringify(err)).join(", ")
            : JSON.stringify(errorData.errors);
          errorMessage = `Validation error: ${validationErrors}`;
        }
      }
    } catch (err) {
      console.warn("Could not parse error response:", err);
    }
    throw new Error(errorMessage);
  }
};

// ------------------- Product Mapper ------------------- //
const mapToProduct = (item: any): Product => ({
  id: item.id || item._id || 0,
  product_id : item.product_id,
  name: item.name,
  description: item.description,
  price: item.price,
  image: item.image,
  category: item.category,
  category_id: item.category_id,
  condition: item.condition,
  location: item.location,
  createdAt: item.createdAt,
  image_urls: item.image_urls || [],
  is_wanted: item.is_wanted,
  status: item.status,
});

// ------------------- Normalize API Response ------------------- //
const normalizeProductResponse = (data: any): Product[] => {
  if (Array.isArray(data)) return data.map(mapToProduct);
  if (data?.data && Array.isArray(data.data)) return data.data.map(mapToProduct);
  if (data?.products && Array.isArray(data.products)) return data.products.map(mapToProduct);
  if (data?.results && Array.isArray(data.results)) return data.results.map(mapToProduct);

  console.warn("Unexpected API response format:", data);
  return [];
};

// ------------------- Fetch All Products ------------------- //
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const url = `${API_BASE_URL}${SEARCH_AND_CREATE_PRODUCTS}`;
    console.log("Fetching all products from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    await handleFetchError(response);
    const data = await response.json();
    console.log("Products API Response:", data);

    return normalizeProductResponse(data);
  } catch (error) {
    console.error("Fetch Error:", error);
    throw new Error(error instanceof Error ? error.message : "Unexpected fetch error");
  }
};

// ------------------- Search Products ------------------- //
export const searchProducts = async (params: SearchParams): Promise<Product[]> => {
  try {
    return await searchProductsAlt(params);
  } catch (err) {
    console.warn("Fallback to dedicated search endpoint. Reason:", err);

    try {
      const queryParams = new URLSearchParams();

      if (params.category?.trim()) queryParams.append("category", params.category.trim().toLowerCase());
      if (params.name?.trim()) queryParams.append("name", params.name.trim());
      if (params.condition?.trim()) queryParams.append("condition", params.condition.trim().toLowerCase());
      if (params.location?.trim()) queryParams.append("location", params.location.trim());
      if (params.min_price != null && params.min_price >= 0) queryParams.append("min_price", params.min_price.toString());
      if (params.max_price != null && params.max_price >= 0) queryParams.append("max_price", params.max_price.toString());

      const url = `${API_BASE_URL}${SEARCH_AND_CREATE_PRODUCTS}/search${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      console.log("Search URL (fallback):", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      await handleFetchError(response);
      const data = await response.json();

      return normalizeProductResponse(data);
    } catch (searchError) {
      console.error("Search failed completely:", searchError);
      throw new Error("Search failed: " + (searchError instanceof Error ? searchError.message : "Unknown error"));
    }
  }
};

// ------------------- Alt Search Products ------------------- //
export const searchProductsAlt = async (params: SearchParams): Promise<Product[]> => {
  try {
    const queryParams = new URLSearchParams();

    if (params.category) queryParams.append("category", params.category);
    if (params.name?.trim()) queryParams.append("name", params.name.trim());
    if (params.condition?.trim()) queryParams.append("condition", params.condition.trim().toLowerCase());
    if (params.location?.trim()) queryParams.append("location", params.location.trim());
    if (params.min_price != null && params.min_price >= 0) queryParams.append("min_price", params.min_price.toString());
    if (params.max_price != null && params.max_price >= 0) queryParams.append("max_price", params.max_price.toString());

    const url = `${API_BASE_URL}${SEARCH_AND_CREATE_PRODUCTS}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    console.log("Search URL (alt):", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    await handleFetchError(response);
    const data = await response.json();

    return normalizeProductResponse(data);
  } catch (error) {
    console.error("Alt Search Error:", error);
    throw new Error(error instanceof Error ? error.message : "Unexpected search error");
  }
};

// ------------------- Fetch All Categories ------------------- //
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const url = `${API_BASE_URL}/products/categories`;
    console.log("Fetching categories from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    await handleFetchError(response);
    const data = await response.json();
    console.log("Categories Response:", data);

    return Array.isArray(data)
      ? data.map((cat: any) => ({
          id: cat.category_id,
          name: cat.category_name.charAt(0).toUpperCase() + cat.category_name.slice(1),
        }))
      : [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("Failed to fetch categories");
  }
};

// ------------------- Fetch Product By ID ------------------- //
export const fetchProductById = async (productId: string): Promise<Product> => {
  try {
    const url = `${API_BASE_URL}/products/${productId}`;
    console.log("Fetching product by ID from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    await handleFetchError(response);
    const data = await response.json();
    console.log("Product by ID API Response:", data);
    return mapToProduct(data);
  } catch (error) {
    console.error("Fetch Product by ID Error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unexpected fetch error"
    );
  }
};

// ------------------- Update Product ------------------- //
export const updateProduct = async (
  productId: string,
  productData: Partial<ProductAPIIn>
): Promise<Product> => {
  try {
    const url = `${API_BASE_URL}/products/${productId}`;
    console.log("Updating product at:", url);

    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    await handleFetchError(response);
    const data = await response.json();
    console.log("Update Product API Response:", data);

    return mapToProduct(data);
  } catch (error) {
    console.error("Update Product Error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unexpected update error"
    );
  }
};

// ------------------- Mark Product as Sold ------------------- //
export const markProductAsSold = async (productId: string): Promise<{ detail: string }> => {
  try {
    const url = `${API_BASE_URL}/products/${productId}/mark-sold`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    await handleFetchError(response);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Mark as Sold Error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unexpected error marking as sold"
    );
  }
};

// ------------------- Mark Product as Available ------------------- //
export const markProductAsAvailable = async (productId: string): Promise<{ detail: string }> => {
  try {
    const url = `${API_BASE_URL}/products/${productId}/mark-available`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    await handleFetchError(response);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Mark as Available Error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unexpected error marking as available"
    );
  }
};

// ------------------- Delete Product ------------------- //
export const deleteProduct = async (productId: string): Promise<{ detail: string }> => {
  try {
    const url = `${API_BASE_URL}/products/${productId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    await handleFetchError(response);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Delete Product Error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unexpected delete error"
    );
  }
};

// ------------------- Fetch Sold Products ------------------- //
export const fetchSoldProducts = async (): Promise<Product[]> => {
  try {
    const url = `${API_BASE_URL}${SEARCH_AND_CREATE_PRODUCTS}?status=Sold`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    await handleFetchError(response);
    const data = await response.json();

    return normalizeProductResponse(data);
  } catch (error) {
    console.error("Fetch Sold Products Error:", error);
    throw new Error(error instanceof Error ? error.message : "Unexpected fetch error");
  }
};

