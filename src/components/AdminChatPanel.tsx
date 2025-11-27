import { useState, useEffect, useRef } from 'react';
import { Send, User } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import BalanceEditor from './BalanceEditor';

interface AdminChatPanelProps {
  accessToken: string;
  userId: string;
  userName: string;
  onRefreshUsers: () => void;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  isAdmin: boolean;
}

export function AdminChatPanel({ accessToken, userId, userName, onRefreshUsers }: AdminChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d491a504/chat/admin/messages/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.log('Failed to fetch messages:', await response.text());
        return;
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.log('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d491a504/chat/admin/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: newMessage,
            targetUserId: userId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.log('Failed to send message:', error);
        alert('Failed to send message');
        return;
      }

      setNewMessage('');
      await fetchMessages();
      onRefreshUsers(); // Refresh the user list to update last message
    } catch (error) {
      console.log('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };




    


  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */} 
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
        
          <div>
            <h2 className="text-lg">{userName}</h2>
            <p className="text-sm text-gray-400">User ID: {userId.slice(0, 8)}...</p>
          </div>
           <BalanceEditor targetUserId={userId} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>No messages yet</p>
            <p className="text-sm mt-2">Start the conversation with {userName}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.isAdmin
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
                }`}
              >
                {!msg.isAdmin && (
                  <p className="text-xs text-purple-400 mb-1">{msg.userName}</p>
                )}
                <p className="break-words">{msg.message}</p>
                <p className="text-xs text-gray-300 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="bg-black/30 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex items-center gap-4"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || isLoading}
          className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
