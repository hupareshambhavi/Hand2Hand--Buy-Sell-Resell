import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Product {
  product_id: number;
  name: string;
  description: string;
  price: number;
  condition: string;
  image_urls: string[];
  seller_id: number;
  category_id: number;
  is_wanted: boolean;
  created_at: string;
  updated_at: string;
}

interface Order {
  order_id: number;
  order_date: string;
  status: "Ordered" | "Delivered";
  delivery_fee: number;
  product_subtotal: number;
  total_price: number;
  products: Product[];
}

export default function PreviousOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!userId) {
      setError("User not logged in.");
      setLoading(false);
      return;
    }
    if (!token) {
      setError("No auth token found.");
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const url = `${API_BASE_URL}/users/${userId}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch orders: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        const mappedOrders: Order[] = data.map((order: any) => {
          const productSubTotal = order.product
            ? Number(order.product.price)
            : 0;
          const deliveryFee = Number(order.delivery_fee);
          const totalPrice = productSubTotal + deliveryFee;

          return {
            order_id: order.request_id,
            order_date: order.request_date,
            status: order.status === "completed" ? "Delivered" : "Ordered",
            delivery_fee: deliveryFee,
            product_subtotal: productSubTotal,
            total_price: totalPrice,
            products: order.product
              ? [order.product].map((product: any) => ({
                  product_id: product.product_id,
                  name: product.name,
                  description: product.description,
                  price: Number(product.price),
                  condition: product.condition,
                  image_urls: product.image_urls || [],
                  seller_id: product.seller_id,
                  category_id: product.category_id,
                  is_wanted: product.is_wanted,
                  created_at: product.created_at,
                  updated_at: product.updated_at,
                }))
              : [],
          };
        });

        setOrders(mappedOrders);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId, token]);

  const handleProductClick = (orderId: number) => {
    navigate(`/order-details/${orderId}`);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );

  if (error)
    return (
      <div
        className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
        role="alert"
      >
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );

  if (orders.length === 0)
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold mb-4">Your Previous Orders</h2>
        <p className="text-gray-600">No previous orders found.</p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">
        Your Previous Orders
      </h2>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.order_id}
            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Order #{order.order_id}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {new Date(order.order_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === "Delivered"
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-3">Products</h4>
                <ul className="space-y-4">
                  {order.products.map((product) => (
                    <li
                      key={product.product_id}
                      className="flex flex-col sm:flex-row gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                      onClick={() => handleProductClick(order.order_id)}
                    >
                      {product.image_urls.length > 0 && (
                        <div className="flex-shrink-0">
                          <img
                            src={product.image_urls[0]}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h5 className="font-medium text-gray-900 hover:text-blue-600">
                            {product.name}
                          </h5>
                          <p className="font-medium text-gray-900">
                            ${product.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">
                          Condition: {product.condition}
                        </p>
                        <p className="text-sm text-gray-600">
                          {product.description}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          Click to view order details →
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Delivery Fee:</span>
                    <span className="font-medium">
                      ${order.delivery_fee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">
                      Total:
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      ${order.total_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
