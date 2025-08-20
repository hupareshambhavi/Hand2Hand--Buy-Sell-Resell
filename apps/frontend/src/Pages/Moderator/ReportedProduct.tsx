import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";
import { useToast } from "../../context/ToastContext";

interface Product {
  product_id: number;
  name: string;
  description: string;
  price: number;
  condition: string;
  image_urls?: string[];
  seller_id: number;
  location: string;
  created_at: string;
  category_name: string;
}

interface ProductReport {
  report_id: number;
  status: string;
  product?: Product;
  rejection_reason?: string;
  reported_by_id: number;
  reason?: string;
}

const ReportedProducts: React.FC = () => {
  const [reports, setReports] = useState<ProductReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [rejectionReasons, setRejectionReasons] = useState<{ [key: number]: string }>({});
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/reports`);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();
        setReports(data);
      } catch (err) {
        setError("Error loading reports");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleKeep = async (reportId: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reports/${reportId}/keep`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to approve report");
      setReports((prev) =>
        prev.map((r) =>
          r.report_id === reportId ? { ...r, status: "kept" } : r
        )
      );
      showToast("Report rejected and product kept.", "success");
    } catch (err) {
      console.error("Error keeping product:", err);
      showToast("Failed to approve report.", "error");
    }
  };

  const handleReject = async (reportId: number) => {
    const reason = rejectionReasons[reportId];
    if (!reason || reason.trim() === "") {
      showToast("Please enter a rejection reason", "error");
      
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/reports/${reportId}/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejection_reason: reason }),
      });
      if (!res.ok) throw new Error("Failed to reject report");
      setReports((prev) =>
        prev.map((r) =>
          r.report_id === reportId
            ? { ...r, status: "rejected", rejection_reason: reason }
            : r
        )
      );
      showToast("Report approved and product deleted.", "success");
    } catch (err) {
      console.error("Error rejecting product:", err);
      showToast("Failed to reject report.", "error");
    }
  };

  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const keptCount = reports.filter((r) => r.status === "kept").length;
  const rejectedCount = reports.filter((r) => r.status === "rejected").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Reported Products</h1>
          <p className="text-gray-600 max-w-3xl">
            Review and moderate reported listings. Take appropriate action to maintain marketplace quality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <StatCard title="Pending Review" value={pendingCount} color="yellow" />
          <StatCard title="Kept" value={keptCount} color="green" />
          <StatCard title="Rejected" value={rejectedCount} color="red" />
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-indigo-600 rounded-full mx-auto mb-3"></div>
            <p className="text-lg text-gray-700">Loading reports...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-red-50 rounded-lg">
            <p className="text-red-600 text-lg">{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-500 text-lg">No reported products found</p>
          </div>
        ) : (
          <div className="space-y-5">
            {reports.map((report) => (
              <div
                key={report.report_id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition hover:shadow-md"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="w-full md:w-48 h-48 bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {report.product?.image_urls?.[0] ? (
                      <img
                        src={report.product.image_urls[0]}
                        alt={report.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400">No Image</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-5">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {report.product?.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            report.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : report.status === "kept"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                        <span className="text-xl font-bold text-gray-900">
                          €{report.product?.price}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {report.product?.description}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                      <div>Location: {report.product?.location}</div>
                      <div>Reported by User {report.reported_by_id}</div>
                    </div>

                    {report.reason && (
                      <div className="mt-3 bg-red-50 border border-red-200 p-3 rounded-lg">
                        <p className="text-sm text-red-700">
                          <strong className="font-medium">User Reported Reason:</strong>{" "}
                          {report.reason}
                        </p>
                      </div>
                    )}

                    {report.rejection_reason && report.status === "rejected" && (
                      <div className="mt-3 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong className="font-medium">Moderator Rejection Reason:</strong>{" "}
                          {report.rejection_reason}
                        </p>
                      </div>
                    )}

                    {report.status === "pending" && (
                      <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
                        <input
                          type="text"
                          placeholder="Reason for rejection"
                          value={rejectionReasons[report.report_id] || ""}
                          onChange={(e) =>
                            setRejectionReasons((prev) => ({
                              ...prev,
                              [report.report_id]: e.target.value,
                            }))
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleKeep(report.report_id)}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium"
                          >
                            Reject and Keep
                          </button>
                          <button
                            onClick={() => handleReject(report.report_id)}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium"
                          >
                            Accept and Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) => {
  const colorClasses = {
    yellow: "bg-yellow-50 text-yellow-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div
      className={`${
        colorClasses[color as keyof typeof colorClasses]
      } p-5 rounded-xl`}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default ReportedProducts;