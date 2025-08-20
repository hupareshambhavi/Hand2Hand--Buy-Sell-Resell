import React, { useState } from "react";
import { setup2FA } from "../../Services/userapi";

interface Props {
  userId: number;
}

const TwoFASetup: React.FC<Props> = ({ userId }) => {
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getSecretFromUri = (uri: string): string => {
    try {
      const url = new URL(uri);
      return url.searchParams.get('secret') || '';
    } catch {
      return '';
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await setup2FA(userId);
      setQrUri(data.provisioning_uri);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Network error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg space-y-6 mt-5">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Two-Factor Authentication</h2>
        <p className="text-gray-600">Enhance your account security</p>
      </div>
      
      <button
        onClick={handleSetup}
        className="w-full p-3 text-white bg-green-600 rounded hover:opacity-85 focus:outline-none disabled:opacity-50 font-semibold transition-opacity"
        disabled={loading || !!qrUri}
      >
        {loading ? "Setting up..." : "Enable 2FA"}
      </button>
      
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {qrUri && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="text-center space-y-4">
            <h3 className="font-semibold text-gray-800">Setup Your Authenticator App</h3>
            
            {/* Option 1 - QR Code */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Option 1: Scan QR Code</h4>
              <p className="text-sm text-gray-600">
                Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR code:
              </p>
              <div className="flex justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrUri)}&size=200x200`} 
                  alt="2FA QR Code" 
                  className="border-2 border-gray-200 rounded-lg shadow-sm"
                />
              </div>
            </div>

            {/* Option 2 - Enter manual code */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Option 2: Manual Entry</h4>
              <p className="text-sm text-gray-600">
                Or enter this secret key manually in your authenticator app:
              </p>
              <div className="bg-white p-3 border rounded-lg">
                <code className="text-sm font-mono break-all text-gray-800">
                  {getSecretFromUri(qrUri)}
                </code>
              </div>
              <div className="text-xs text-gray-500">
                <p><strong>Account name:</strong> Your email address</p>
                <p><strong>Issuer:</strong> Hand2Hand</p>
              </div>
            </div>

            <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="font-medium mb-1">Setup Complete!</p>
              <p className="text-xs">Your authenticator app will now generate 6-digit codes for login. You can test this during your next login.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFASetup;
