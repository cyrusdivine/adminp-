import { useState, useEffect } from 'react';
import { UserList } from './UserList';
import { AdminChatPanel } from './AdminChatPanel';
import { LogOut, Users, MessageSquare } from 'lucide-react';
import { projectId } from '../utils/supabase/info';

interface AdminDashboardProps {
  accessToken: string;
  adminUser: any;
  onLogout: () => void;
}

interface UserConversation {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

export function AdminDashboard({ accessToken, adminUser, onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserConversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllUsers();
    const interval = setInterval(fetchAllUsers, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d491a504/chat/admin/users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.log('Failed to fetch users:', await response.text());
        return;
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.log('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUser = users.find(u => u.userId === selectedUserId);











  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl">Admin Dashboard</h1>
              <p className="text-sm text-gray-400">
                {adminUser?.user_metadata?.name || adminUser?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-sm">{users.length} Active Users</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* User List Sidebar */}
        <div className="w-80 border-r border-white/10 bg-black/20 backdrop-blur-sm flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Conversations
            </h2>
          </div>
          <UserList
            users={users}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
            isLoading={isLoading}
          />
        </div>

        {/* Chat Panel */}
        <div className="flex-1">
          {selectedUserId ? (
            <AdminChatPanel
              accessToken={accessToken}
              userId={selectedUserId}
              userName={selectedUser?.userName || 'User'}
              onRefreshUsers={fetchAllUsers}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-white/10 rounded-full mx-auto flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl text-gray-400">Select a user to start chatting</h3>
                <p className="text-sm text-gray-500">
                  Choose a conversation from the list on the left
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
