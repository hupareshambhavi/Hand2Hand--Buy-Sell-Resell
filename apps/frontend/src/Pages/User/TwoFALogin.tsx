import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { HOME } from "../../routes";
import { authService } from "../../Services/authService";
import { verify2FA } from "../../Services/userapi";

const TwoFALogin: React.FC = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = authService.getCurrentUser();
  const userId = currentUser?.user_id;

  if (!userId) {
    return <div className="text-center mt-10">Invalid 2FA session. Please login again.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = await verify2FA(userId, code);
      authService.setAuthData({ token: data.token, refresh_token: data.refresh_token }, data);
      showToast("Login successful!", "success");
      navigate(HOME);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Network error";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center">Two-Factor Authentication</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="2fa-code" className="block text-lg mb-1">
            Enter 2FA Code
          </label>
          <input
            id="2fa-code"
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="w-full p-3 border-2 rounded focus:outline-none focus:border-black"
            autoFocus
          />
          <button
            type="submit"
            className="w-full p-3 text-white bg-[#3A1078] rounded hover:opacity-85 focus:outline-none disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TwoFALogin;
