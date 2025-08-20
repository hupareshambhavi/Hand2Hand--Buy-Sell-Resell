import React, { useEffect } from "react";

const ComingSoon: React.FC = () => {
  useEffect(() => {
    // Prevent scrolling on mount
    document.body.style.overflow = "hidden";
    return () => {
      // Restore scroll when component unmounts
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-white">
      <h1 className="text-5xl font-bold text-gray-800 mb-4 mt-10">Coming Soon</h1>
      <p className="text-lg text-gray-600 mb-6">
        This page is under construction. Please check back later!
      </p>
    </div>
  );
};

export default ComingSoon;