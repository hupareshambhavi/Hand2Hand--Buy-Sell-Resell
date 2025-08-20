import { useEffect, useState } from "react";
import type { ProductAPIOut } from "../../product";

export default function MyProfile() {
    const [products, setProducts] = useState<ProductAPIOut[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch("http://127.0.0.1:8000/api/products");
                const data = await response.json();
                setProducts(data);
            } catch (err) {
                console.error("Failed to fetch products", err);
            }
        };

        fetchProducts();
    }, []);

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-4">My Listings</h1>
            {products.map((p) => (
                <div key={p.product_id} className="border p-4 mb-2 rounded shadow">
                    {p.image_urls.length > 0 && (
                        <img src={p.image_urls[0]} alt={p.name} className="w-20 h-20 object-cover mb-2" />
                    )}
                    <h2 className="font-semibold text-lg">{p.name}</h2>
                    <p>Condition: {p.condition}</p>
                    <p>Price: ${p.price}</p>
                    <p>Created: {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
            ))}
        </div>
    );
}
