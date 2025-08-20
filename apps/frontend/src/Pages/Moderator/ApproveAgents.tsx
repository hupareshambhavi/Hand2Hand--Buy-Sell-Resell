
import React, { useState, useEffect } from 'react';
import { getPendingAgents, approveAgent, rejectAgent } from '../../Services/moderatorapi';
import { Loader2, AlertCircle, User, X, Eye, Calendar, Clock, MapPin, Phone, Mail, Package } from 'lucide-react';

interface Agent {
  agent_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  category_ids: string[];
  transport_mode: string;
  reviews: any[];
  deliveries_completed: number;
  identity_img_url: string;
  day_of_week: string[];
  time_slot: number[][];
  joined_date: string;
  approval_status?: string; // Optional, since not in API response
}

const ApproveAgents: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await getPendingAgents();
        setAgents(data);
      } catch (err) {
        setError('Failed to fetch agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const handleApprove = async (agentId: number) => {
    try {
      await approveAgent(agentId);
      setAgents(agents.map(agent => agent.agent_id === agentId ? { ...agent, approval_status: 'approved' } : agent));
    } catch (err) {
      setError('Failed to approve agent');
    }
  };

  const handleReject = async (agentId: number) => {
    try {
      await rejectAgent(agentId);
      setAgents(agents.map(agent => agent.agent_id === agentId ? { ...agent, approval_status: 'rejected' } : agent));
    } catch (err) {
      setError('Failed to reject agent');
    }
  };

  const openModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAgent(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin w-8 h-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading pending agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Approve Delivery Agents</h1>
          </div>
          <p className="text-gray-600">
            Review and approve or reject delivery agent registrations. Click on any agent to view more details.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-6 text-red-600 bg-red-100 border border-red-200 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {agents.length > 0 ? (
          <div className="space-y-6">
            {agents.map(agent => (
              <div
                key={agent.agent_id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-blue-200 group"
              >
                <div className="flex">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center m-4">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {agent.first_name} {agent.last_name}
                          </h3>
                          {agent.approval_status === 'pending' && (
                            <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                              Pending Review
                            </div>
                          )}
                          {agent.approval_status === 'approved' && (
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              Approved
                            </div>
                          )}
                          {agent.approval_status === 'rejected' && (
                            <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                              Rejected
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          
                          <div>
                            <p className="text-gray-500 text-sm">Agent ID: {agent.agent_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <button
                            onClick={() => openModal(agent)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-1">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Transport: {agent.transport_mode}</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Deliveries: {agent.deliveries_completed}</span>
                          {agent.day_of_week && agent.day_of_week.length > 0 && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Available: {agent.day_of_week.join(', ')}</span>
                          )}
                          {agent.joined_date && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">Joined: {new Date(agent.joined_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-6 flex flex-col gap-2">
                        {agent.approval_status === undefined || agent.approval_status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApprove(agent.agent_id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(agent.agent_id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed font-medium text-sm"
                            disabled
                          >
                            {agent.approval_status.charAt(0).toUpperCase() + agent.approval_status.slice(1)}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Pending Agents</h3>
            <p className="text-gray-500">
              All agent applications have been reviewed. New submissions will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedAgent && (
        <div 
          className="fixed inset-0 backdrop-blur-sm bg-opacity-10 flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Agent Details</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Personal Info */}
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 underline">
                      {selectedAgent.first_name} {selectedAgent.last_name}
                    </h3>
                    <div className="flex justify-center">
                      {selectedAgent.approval_status === 'pending' && (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                          Pending Review
                        </span>
                      )}
                      {selectedAgent.approval_status === 'approved' && (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          Approved
                        </span>
                      )}
                      {selectedAgent.approval_status === 'rejected' && (
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      Contact Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{selectedAgent.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{selectedAgent.phone_number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Work Information */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      Work Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">Transport: {selectedAgent.transport_mode}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">Deliveries Completed: {selectedAgent.deliveries_completed}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">Joined: {new Date(selectedAgent.joined_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  {selectedAgent.category_ids && selectedAgent.category_ids.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAgent.category_ids.map((categoryId, index) => (
                          <span
                            key={index}
                            className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            Category {categoryId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Schedule & ID */}
                <div className="space-y-6">
                  {/* Availability Schedule */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Availability
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Available Days:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedAgent.day_of_week && selectedAgent.day_of_week.length > 0 ? (
                            selectedAgent.day_of_week.map((day, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                              >
                                {day}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-sm">No days specified</span>
                          )}
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  {/* ID Document */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Identity Document</h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <img
                        src={selectedAgent.identity_img_url}
                        alt="Identity Document"
                        className="max-w-full max-h-60 mx-auto rounded-lg shadow-md"
                        onError={(e) => {
                          e.currentTarget.parentElement!.innerHTML = `
                            <div class="flex flex-col items-center justify-center py-8">
                              <svg class="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                              </svg>
                              <p class="text-gray-500 text-sm">Identity document unavailable</p>
                            </div>
                          `;
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproveAgents;
