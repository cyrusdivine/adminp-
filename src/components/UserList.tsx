import { User, Clock } from 'lucide-react';

interface UserConversation {
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

interface UserListProps {
  users: UserConversation[];
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  isLoading: boolean;
}

export function UserList({ users, selectedUserId, onSelectUser, isLoading }: UserListProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-400">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <User className="w-12 h-12 text-gray-500 mx-auto" />
          <p className="text-sm text-gray-400">No conversations yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {users.map((user) => (
        <button
          key={user.userId}
          onClick={() => onSelectUser(user.userId)}
          className={`w-full p-4 border-b border-white/10 hover:bg-white/5 transition-colors text-left ${
            selectedUserId === user.userId ? 'bg-white/10' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
             <User className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="truncate">{user.userName}</h3>
                {user.unreadCount > 0 && (
                  <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                    {user.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 truncate">{user.lastMessage}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {formatTime(user.lastMessageTime)}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
