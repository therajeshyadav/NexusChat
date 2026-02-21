import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { chatApi } from "@/services/chatApi";
import { Friend } from "@/types/chat";
import { useAuth } from "@/context/AuthContext";

interface SelectFriendsModalProps {
  onClose: () => void;
  onAddFriend: () => void;
}

export default function SelectFriendsModal({ onClose, onAddFriend }: SelectFriendsModalProps) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const data = await chatApi.getFriends();
      // Only show accepted friends
      const acceptedFriends = data.filter((f: Friend) => f.status === "accepted");
      setFriends(acceptedFriends);
    } catch (err) {
      console.error("Failed to load friends", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateDM = () => {
    // TODO: Create DM with selected friends
    console.log("Create DM with:", selectedFriends);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-[440px] rounded-lg bg-discord-dark">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h2 className="text-xl font-bold text-foreground">Select Friends</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          {loading ? (
            <p className="py-8 text-center text-muted-foreground">Loading...</p>
          ) : friends.length === 0 ? (
            <div className="py-8 text-center">
              <p className="mb-4 text-muted-foreground">
                You don't have any friends to add!
              </p>
              <button
                onClick={() => {
                  onClose();
                  onAddFriend();
                }}
                className="w-full rounded-md bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Add Friend
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
                {friends.map((friend) => (
                  <button
                    key={friend._id}
                    onClick={() => toggleFriend(friend._id)}
                    className={`flex w-full items-center gap-3 rounded-md p-2 transition-colors ${
                      selectedFriends.includes(friend._id)
                        ? "bg-primary/20"
                        : "hover:bg-discord-hover"
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {friend.friendUsername.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-foreground">{friend.friendUsername}</span>
                    {selectedFriends.includes(friend._id) && (
                      <div className="ml-auto h-5 w-5 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCreateDM}
                disabled={selectedFriends.length === 0}
                className="w-full rounded-md bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create DM
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
