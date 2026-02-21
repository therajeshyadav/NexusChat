import { useState, useEffect } from "react";
import { Users, UserPlus, Search } from "lucide-react";
import AddFriendPage from "@/components/AddFriendPage";
import FriendsList from "@/components/FriendsList";
import SelectFriendsModal from "@/components/SelectFriendsModal";
import { useAuth } from "@/context/AuthContext";
import { chatApi } from "@/services/chatApi";
import { socketService } from "@/services/socket";
import UserPanel from "@/components/shared/UserPanel";

type Tab = "online" | "all" | "pending" | "blocked" | "add";

interface FriendsProps {
  onOpenDM?: (friendId: number, friendUsername: string) => void;
}

export default function Friends({ onOpenDM }: FriendsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("add");
  const [showSelectFriends, setShowSelectFriends] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [acceptedFriends, setAcceptedFriends] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    loadPendingCount();
    loadAcceptedFriends();

    // Listen for real-time updates
    socketService.onFriendRequestReceived(() => {
      loadPendingCount();
    });

    socketService.onFriendRequestAccepted(() => {
      loadPendingCount();
      loadAcceptedFriends();
    });

    socketService.onFriendRequestRejected(() => {
      loadPendingCount();
    });

    socketService.onFriendRemoved(() => {
      loadAcceptedFriends();
    });

    return () => {
      socketService.offFriendEvents();
    };
  }, []);

  const loadPendingCount = async () => {
    try {
      const friends = await chatApi.getFriends();
      const pending = friends.filter(
        (f: any) => f.status === "pending" && f.requestedBy !== user?.id
      );
      setPendingCount(pending.length);
    } catch (err) {
      console.error("Failed to load pending count", err);
    }
  };

  const loadAcceptedFriends = async () => {
    try {
      const friends = await chatApi.getFriends();
      const accepted = friends.filter((f: any) => f.status === "accepted");
      setAcceptedFriends(accepted);
    } catch (err) {
      console.error("Failed to load accepted friends", err);
    }
  };

  const handleAddFriendClick = () => {
    setActiveTab("add");
    setShowSelectFriends(false);
  };

  return (
    <div className="flex h-full w-full">
      {/* Left Sidebar - Friends/DM List */}
      <div className="flex h-full w-60 flex-col bg-discord-darker">
        {/* Search */}
        <div className="p-2">
          <button className="flex w-full items-center gap-2 rounded-md bg-discord-darkest px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <Search className="h-4 w-4" />
            <span>Find or start a conversation</span>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-2">
          <button
            onClick={() => setActiveTab("online")}
            className={`mb-0.5 flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
              activeTab !== "add"
                ? "bg-discord-hover text-foreground"
                : "text-muted-foreground hover:bg-discord-hover/50 hover:text-foreground"
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="font-medium">Friends</span>
          </button>

          {/* Shop and Quests - Commented for now */}
          {/* <button className="mb-0.5 flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-discord-hover/50 hover:text-foreground">
            <ShoppingBag className="h-5 w-5" />
            <span className="font-medium">Shop</span>
          </button>

          <button className="mb-0.5 flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-discord-hover/50 hover:text-foreground">
            <Compass className="h-5 w-5" />
            <span className="font-medium">Quests</span>
          </button> */}

          <div className="my-2 border-t border-discord-darkest" />

          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Direct Messages
            </span>
            <button
              onClick={() => setShowSelectFriends(true)}
              className="text-muted-foreground hover:text-foreground"
              title="Create DM"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </div>

          {/* DM list - Accepted Friends */}
          {acceptedFriends.length > 0 ? (
            <div className="space-y-0.5">
              {acceptedFriends.map((friend) => (
                <button
                  key={friend._id}
                  onClick={() => onOpenDM && onOpenDM(friend.friendId, friend.friendUsername)}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-discord-hover/50 hover:text-foreground"
                >
                  <div className="relative">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {friend.friendUsername.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-discord-darker bg-gray-500" />
                  </div>
                  <span className="truncate font-medium">{friend.friendUsername}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-2 text-xs text-muted-foreground">
              No friends yet. Add some friends to start chatting!
            </p>
          )}
        </div>

        {/* User panel */}
        <UserPanel 
          pendingCount={pendingCount} 
          onPendingClick={() => setActiveTab("pending")} 
        />
      </div>

      {/* Select Friends Modal */}
      {showSelectFriends && (
        <SelectFriendsModal
          onClose={() => setShowSelectFriends(false)}
          onAddFriend={handleAddFriendClick}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <div className="flex h-12 items-center border-b border-discord-darkest px-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span className="font-semibold text-foreground">Friends</span>
          </div>

          <div className="ml-6 flex gap-4">
            <button
              onClick={() => setActiveTab("online")}
              className={`text-sm font-medium transition-colors ${
                activeTab === "online"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`text-sm font-medium transition-colors ${
                activeTab === "all"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`relative text-sm font-medium transition-colors ${
                activeTab === "pending"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pending
              {pendingCount > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("blocked")}
              className={`text-sm font-medium transition-colors ${
                activeTab === "blocked"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Blocked
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className="text-sm font-medium text-green-500 transition-colors hover:text-green-400"
            >
              Add Friend
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1">
            {activeTab === "add" ? (
              <AddFriendPage />
            ) : (
              <FriendsList 
                filter={activeTab} 
                onCountChange={() => {
                  loadPendingCount();
                  loadAcceptedFriends();
                }} 
              />
            )}
          </div>

          {/* Right Sidebar - Active Now */}
          <div className="w-80 border-l border-discord-darkest bg-discord-chat-bg p-4">
            <h3 className="mb-4 text-sm font-bold text-foreground">Active Now</h3>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 text-6xl">👀</div>
              <h4 className="mb-2 text-sm font-bold text-foreground">
                It's quiet for now...
              </h4>
              <p className="text-xs text-muted-foreground">
                When a friend starts an activity—like playing a game or hanging
                out on voice—we'll show it here!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

