import ProductForm from "./ProductForm";

export default function EditProduct() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
            Edit Listing
          </h1>
          <ProductForm mode="edit" />
        </div>
      </div>
    </div>
  );
}
