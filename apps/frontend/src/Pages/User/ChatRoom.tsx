import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, User, Loader2 } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket'; // Adjust path as needed

interface Message {
  type: string;
  message: string;
  original?: string;
  translated?: string;
  language?: string;
  sender: string;
  timestamp?: string;
  target?: string;
  showTranslation: boolean;
}

const ChatRoom = () => {
  const { roomName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showOriginal, setShowOriginal] = useState<{[key: string]: boolean}>({});
  const [translationLoading, setTranslationLoading] = useState<{[key: string]: boolean}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const otherUserName = location.state?.otherUserName || '';
  // const other_user_email = useRef<string | null>(null);

  // Get state from navigation
  const { productName } = location.state || {};

  // Get WebSocket URL from environment variables
  const getWebSocketUrl = () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!apiBaseUrl) {
      console.error('VITE_API_BASE_URL is not defined in environment variables');
      return null;
    }
    
    // Convert HTTP URL to WebSocket URL
    const wsUrl = apiBaseUrl.replace(/^https?:\/\//, 'ws://').replace(/\/api$/, '');
    return roomName ? `${wsUrl}/ws/chat/${roomName}` : null;
  };

  // WebSocket URL
  const wsUrl = getWebSocketUrl();

  // Handle incoming WebSocket messages
  const handleMessage = (data: any) => {
    console.log('Received WebSocket message:', data);
    
    if (data.type === 'translation_result') {
      console.log('Received translation result:', data);
      
      // Clear loading state for this translation
      setTranslationLoading(prev => {
        const messageKey = `${data.original}-${data.sender || ''}`;
        const newState = { ...prev };
        delete newState[messageKey];
        return newState;
      });
      
      setMessages(prev => {
        const newMessages = prev.map(msg => {
          if (msg.original === data.original) {
            console.log('Updating message with translation:', {
              original: msg.original,
              translation: data.message
            });
            return {
              ...msg,
              translated: data.message,
              language: data.language,
              showTranslation: true
            };
          }
          return msg;
        });
        return newMessages;
      });
    } else {
      // Handle both chat_message type and regular messages
      console.log('Received chat message:', data);
      setMessages(prev => {
        // Check if message already exists
        const exists = prev.some(msg => 
          msg.message === data.message && 
          msg.sender === data.sender && 
          msg.timestamp === data.timestamp
        );
        
        if (!exists) {
          const newMessage: Message = {
            type: data.type || 'chat_message',
            message: data.message,
            original: data.original || data.message,
            translated: data.translated || undefined,
            language: data.language || undefined,
            sender: data.sender,
            timestamp: data.timestamp || new Date().toISOString(),
            showTranslation: false
          };
          console.log('Adding new message:', newMessage);
          return [...prev, newMessage];
        }
        return prev;
      });
    }
  };

  // Handle WebSocket connection
  const handleConnect = () => {
    console.log('WebSocket connected');
  };

  // Handle WebSocket disconnection
  const handleDisconnect = () => {
    console.log('WebSocket disconnected');
  };

  // Use the WebSocket hook
  const { isConnected, error, sendMessage: sendWSMessage } = useWebSocket(
    wsUrl as string,
    handleMessage,
    handleConnect,
    handleDisconnect
  );

  useEffect(() => {
    // Get current user
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        setCurrentUser(parsedUserData);
        console.log('Current user:', parsedUserData); // Debug log
      } catch (error) {
        navigate('/login');
        return;
      }
    } else {
      navigate('/login');
      return;
    }
  }, [roomName, navigate, wsUrl, location.state]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !isConnected) {
      return;
    }
    
    const messageData = {
      type: 'chat',
      message: newMessage.trim()
    };
    
    const success = sendWSMessage(messageData);
    if (success) {
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const translateMessage = (message: string, sender: string, targetLang: string = 'EN-US') => {
    if (!isConnected) {
      return;
    }
    
    const messageKey = `${message}-${sender}`;
    setTranslationLoading(prev => ({...prev, [messageKey]: true}));
    
    const translationData = {
      type: 'translate',
      message: message,
      target: targetLang
    };
    
    console.log('Sending translation request:', translationData); // Debug log
    const success = sendWSMessage(translationData);
    if (!success) {
      setTranslationLoading(prev => ({...prev, [messageKey]: false}));
    }
  };

  const toggleOriginal = (message: string, sender: string) => {
    const messageKey = `${message}-${sender}`;
    setShowOriginal(prev => ({
      ...prev,
      [messageKey]: !prev[messageKey]
    }));
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Improved function to determine message ownership
  const isOwnMessage = (sender: string) => {
    if (!currentUser) return false;
    
    console.log('Checking message ownership:', { sender, currentUserEmail: currentUser.email }); // Debug log
    
    // Check multiple possible identifiers
    return sender === currentUser.email || 
           sender === currentUser.username || 
           sender === currentUser.id ||
           sender === currentUser.name;
  };

  // Show error if WebSocket URL is invalid
  if (!roomName) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Chat Room</h2>
          <p className="text-gray-500 mb-4">Room name is required</p>
          <button
            onClick={() => navigate('/chats')}
            className="px-4 py-2 text-white rounded-lg transition"
            style={{ backgroundColor: '#3A1078' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a0c59'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3A1078'}
          >
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  // Show error if WebSocket URL couldn't be constructed
  if (!wsUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Error</h2>
          <p className="text-gray-500 mb-4">Unable to connect to chat service</p>
          <button
            onClick={() => navigate('/chats')}
            className="px-4 py-2 text-white rounded-lg transition"
            style={{ backgroundColor: '#3A1078' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a0c59'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3A1078'}
          >
            Back to Chats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/chats')}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          
          <div>
            <h2 className="font-semibold text-gray-900">{otherUserName}</h2>
            {productName && (
              <p className="text-sm" style={{ color: '#3A1078' }}>About: {productName}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {error && (
            <span className="text-xs text-red-500 ml-2">({error})</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start the conversation</h3>
            <p className="text-gray-500">Send a message to begin chatting!</p>
            {!isConnected && (
              <p className="text-red-500 text-sm mt-2">
                Connecting to chat room...
              </p>
            )}
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={`${msg.sender}-${msg.timestamp}-${index}`}
              className={`flex ${isOwnMessage(msg.sender) ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[70%] ${isOwnMessage(msg.sender) ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  {msg.sender ? msg.sender[0].toUpperCase() : '?'}
                </div>
                <div className={`flex flex-col ${isOwnMessage(msg.sender) ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-lg p-3 ${
                      isOwnMessage(msg.sender)
                        ? 'text-white'
                        : 'bg-white text-gray-800'
                    }`}
                    style={isOwnMessage(msg.sender) ? { backgroundColor: '#3A1078' } : {}}
                  >
                    {/* Show original if showOriginal is true, otherwise show translated or original message */}
                    <p>
                      {showOriginal[`${msg.message}-${msg.sender}`] && msg.original
                        ? msg.original
                        : (msg.translated || msg.message)}
                    </p>
                    
                    {/* Timestamp */}
                    {msg.timestamp && (
                      <p className={`text-xs mt-1 ${
                        isOwnMessage(msg.sender) ? 'text-white text-opacity-70' : 'text-gray-500'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    )}
                    
                    {/* Show buttons inside the message bubble */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-opacity-20" 
                         style={{ borderColor: isOwnMessage(msg.sender) ? 'white' : '#e5e7eb' }}>
                      {/* Show "Show Original" button if message is translated */}
                      {msg.translated && (
                        <button
                          onClick={() => toggleOriginal(msg.message, msg.sender)}
                          className={`text-xs hover:opacity-80 ${
                            isOwnMessage(msg.sender) ? 'text-white' : 'text-gray-500'
                          }`}
                        >
                          {showOriginal[`${msg.message}-${msg.sender}`] ? 'Show Translation' : 'Show Original'}
                        </button>
                      )}
                      
                      {/* Show "Translate" button if message has original text (not translated yet) or no translation */}
                      {!msg.translated && (
                        <button
                          onClick={() => translateMessage(msg.message, msg.sender)}
                          className={`text-xs hover:opacity-80 flex items-center gap-1 ${
                            isOwnMessage(msg.sender) ? 'text-white' : ''
                          }`}
                          style={!isOwnMessage(msg.sender) ? { color: '#3A1078' } : {}}
                          disabled={translationLoading[`${msg.message}-${msg.sender}`]}
                        >
                          {translationLoading[`${msg.message}-${msg.sender}`] ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Translating...
                            </>
                          ) : (
                            'Translate'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ 
                maxHeight: '100px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3A1078';
                e.currentTarget.style.boxShadow = `0 0 0 2px #3A107840`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className={`p-2 rounded-lg transition ${
              !newMessage.trim() || !isConnected
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'text-white'
            }`}
            style={!newMessage.trim() || !isConnected ? {} : { backgroundColor: '#3A1078' }}
            onMouseEnter={(e) => {
              if (!(!newMessage.trim() || !isConnected)) {
                e.currentTarget.style.backgroundColor = '#2a0c59';
              }
            }}
            onMouseLeave={(e) => {
              if (!(!newMessage.trim() || !isConnected)) {
                e.currentTarget.style.backgroundColor = '#3A1078';
              }
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {!isConnected && (
          <p className="text-red-500 text-sm mt-2">
            {error ? `Connection error: ${error}` : 'Connection lost. Trying to reconnect...'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;