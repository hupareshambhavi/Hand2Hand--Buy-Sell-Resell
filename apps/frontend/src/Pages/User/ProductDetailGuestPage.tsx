//import React from 'react';
import ProductDetail from '../../Components/ProductDetail';
import ProductDetailGuestPage from './ProductDetailGuestPage'; // this is for guests

// TEMPORARY fake auth check — replace with your real auth logic later
const isAuthenticated = () => {
  return !!localStorage.getItem('token'); // or your session logic
};

const ProductDetailPage = () => {
  return isAuthenticated() ? <ProductDetail /> : <ProductDetailGuestPage />;
};

export default ProductDetailPage;
