import { useState, useEffect } from "react";
import { Check, X, MessageCircle } from "lucide-react";
import { chatApi } from "@/services/chatApi";
import { socketService } from "@/services/socket";
import { Friend } from "@/types/chat";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface FriendsListProps {
  filter: "all" | "pending" | "online" | "blocked";
  onCountChange?: () => void;
}

export default function FriendsList({ filter, onCountChange }: FriendsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();

    // Listen for real-time friend events
    socketService.onFriendRequestReceived((data) => {
      console.log("Friend request received:", data);
      toast({
        title: "Friend Request",
        description: `${data.username} sent you a friend request!`,
      });
      loadFriends(); // Refresh list
    });

    socketService.onFriendRequestAccepted((data) => {
      console.log("Friend request accepted:", data);
      toast({
        title: "Friend Request Accepted",
        description: `${data.username} accepted your friend request!`,
      });
      loadFriends(); // Refresh list
    });

    socketService.onFriendRequestRejected((data) => {
      console.log("Friend request rejected:", data);
      toast({
        title: "Friend Request Rejected",
        description: "Your friend request was rejected.",
        variant: "destructive",
      });
      loadFriends(); // Refresh list
    });

    socketService.onFriendRemoved((data) => {
      console.log("Friend removed:", data);
      toast({
        title: "Friend Removed",
        description: "A friend has removed you from their friends list.",
        variant: "destructive",
      });
      loadFriends(); // Refresh list
    });

    return () => {
      socketService.offFriendEvents();
    };
  }, [toast]);

  const loadFriends = async () => {
    try {
      const data = await chatApi.getFriends();
      setFriends(data);
      if (onCountChange) {
        onCountChange();
      }
    } catch (err) {
      console.error("Failed to load friends", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (friendId: string) => {
    try {
      const friend = friends.find(f => f._id === friendId);
      await chatApi.acceptFriendRequest(friendId);
      
      // Notify via socket
      if (friend) {
        socketService.acceptFriendRequestNotification(friendId, friend.friendId);
      }
      
      toast({
        title: "Friend Request Accepted",
        description: `You are now friends with ${friend?.friendUsername}!`,
      });
      
      loadFriends();
    } catch (err) {
      console.error("Failed to accept request", err);
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (friendId: string) => {
    try {
      const friend = friends.find(f => f._id === friendId);
      await chatApi.rejectFriendRequest(friendId);
      
      // Notify via socket
      if (friend) {
        socketService.rejectFriendRequestNotification(friend.friendId);
      }
      
      toast({
        title: "Friend Request Rejected",
        description: "Friend request has been rejected.",
      });
      
      loadFriends();
    } catch (err) {
      console.error("Failed to reject request", err);
      toast({
        title: "Error",
        description: "Failed to reject friend request",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (friendId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;
    
    try {
      const friend = friends.find(f => f._id === friendId);
      await chatApi.removeFriend(friendId);
      
      // Notify via socket
      if (friend) {
        socketService.removeFriendNotification(friend.friendId);
      }
      
      toast({
        title: "Friend Removed",
        description: `${friend?.friendUsername} has been removed from your friends list.`,
      });
      
      loadFriends();
    } catch (err) {
      console.error("Failed to remove friend", err);
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
    }
  };

  const filteredFriends = friends.filter((friend) => {
    if (filter === "pending") {
      return friend.status === "pending" && friend.requestedBy !== user?.id;
    }
    if (filter === "blocked") {
      return friend.status === "blocked";
    }
    if (filter === "online") {
      return friend.status === "accepted"; // TODO: Add online status check
    }
    return friend.status === "accepted";
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading friends...</p>
      </div>
    );
  }

  if (filteredFriends.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          {filter === "pending" ? "No pending requests" : "No friends yet"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase text-muted-foreground">
        {filter === "pending" ? "Pending" : "All Friends"} — {filteredFriends.length}
      </h3>

      <div className="space-y-2">
        {filteredFriends.map((friend) => {
          const isPending = friend.status === "pending";
          const isIncoming = isPending && friend.requestedBy !== user?.id;

          return (
            <div
              key={friend._id}
              className="flex items-center justify-between rounded-lg border-t border-discord-darkest p-4 hover:bg-discord-hover"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {friend.friendUsername.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-discord-chat-bg bg-gray-500" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {friend.friendUsername}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPending ? (isIncoming ? "Incoming Request" : "Outgoing Request") : "Online"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {isIncoming ? (
                  <>
                    <button
                      onClick={() => handleAccept(friend._id)}
                      className="rounded-full bg-green-600 p-2 transition-colors hover:bg-green-700"
                      title="Accept"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleReject(friend._id)}
                      className="rounded-full bg-red-600 p-2 transition-colors hover:bg-red-700"
                      title="Reject"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </>
                ) : friend.status === "accepted" ? (
                  <>
                    <button
                      className="rounded-full bg-discord-darker p-2 transition-colors hover:bg-discord-hover"
                      title="Message"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleRemove(friend._id)}
                      className="rounded-full bg-discord-darker p-2 transition-colors hover:bg-red-600"
                      title="Remove Friend"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
