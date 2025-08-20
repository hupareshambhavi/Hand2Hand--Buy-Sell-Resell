import  { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, User, Clock, Loader2 } from 'lucide-react';

interface ChatRoom {
  room_name: string;
  last_message: string;
  last_message_time: string;
  other_user_email: string;
  product_name?: string;
  product_id?: string;
  unread_count?: number;
  other_user_name?: string;
}

const ChatList = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Get user data from localStorage
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        if (userData && userData.user_id) {
          setUserId(userData.user_id);
        }
      } catch (err) {
        console.error('Error parsing currentUser:', err);
        setError('Failed to get user information');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch chat rooms
  useEffect(() => {
    const fetchChatRooms = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/chats/rooms/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch chat rooms');
        }
        const data = await response.json();
        setChatRooms(data);
      } catch (err) {
        console.error('Error fetching chat rooms:', err);
        setError('Failed to load chat rooms');
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();
  }, [userId]);

  const handleChatClick = (roomName: string, productId?: string, productName?: string, otherUserName?: string) => {
    // Extract user IDs from room name to determine other user
    const parts = roomName.split('_');
    if (parts.length >= 4) {
      const sellerId = parseInt(parts[2]);
      const buyerId = parseInt(parts[3]);
      const otherUserId = sellerId === userId ? buyerId : sellerId;
      
      navigate(`/chat/${roomName}`, {
        state: {
          productId: productId,
          productName: productName,
          sellerId: sellerId,
          buyerId: buyerId,
          otherUserId: otherUserId,
          isNewChat: false,
          otherUserName: otherUserName
        }
      });
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          <span className="ml-2 text-gray-600">Loading your chats...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Your Conversations
          </h1>
          <p className="text-gray-600 mt-1">Manage your conversations with other users</p>
        </div>

        <div className="divide-y divide-gray-200">
          {chatRooms.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-500">
                Start a conversation by messaging a seller on any product page.
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Browse Products
              </button>
            </div>
          ) : (
            chatRooms.map((room) => (
              <div
                key={room.room_name}
                onClick={() => handleChatClick(room.room_name, room.product_id, room.product_name, room.other_user_name)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {room.other_user_name}
                        </h3>
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeAgo(room.last_message_time)}
                        </div>
                      </div>
                      
                      {room.product_name && (
                        <p className="text-xs text-blue-600 mb-1">
                          About: {room.product_name}
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-600 truncate">
                        {room.last_message || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                  
                  {(room.unread_count ?? 0) > 0 && (
                    <div className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {room.unread_count}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatList;