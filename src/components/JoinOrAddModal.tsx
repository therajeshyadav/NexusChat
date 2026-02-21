import { useState } from "react";
import { chatApi } from "@/services/chatApi";
import { socketService } from "@/services/socket";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface JoinOrAddModalProps {
  onClose: () => void;
  onServerJoined: () => void;
  onFriendAdded?: () => void;
}

export default function JoinOrAddModal({
  onClose,
  onServerJoined,
  onFriendAdded,
}: JoinOrAddModalProps) {
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [username, setUsername] = useState("");
  const [serverError, setServerError] = useState("");
  const [friendError, setFriendError] = useState("");
  const [serverLoading, setServerLoading] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);

  const handleJoinServer = async () => {
    if (!inviteCode.trim()) {
      setServerError("Please enter an invite code");
      return;
    }

    setServerLoading(true);
    setServerError("");

    try {
      await chatApi.joinServer(inviteCode.trim());
      await onServerJoined();
      toast({
        title: "Server Joined",
        description: "You have successfully joined the server!",
      });
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Failed to join server");
    } finally {
      setServerLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!username.trim()) {
      setFriendError("Please enter a username");
      return;
    }

    setFriendLoading(true);
    setFriendError("");

    try {
      const response = await chatApi.sendFriendRequest(username.trim());
      
      // Notify via socket
      socketService.sendFriendRequestNotification(response.friendId, username.trim());
      
      toast({
        title: "Friend Request Sent",
        description: `Friend request sent to ${username.trim()}!`,
      });
      
      setUsername("");
      if (onFriendAdded) {
        onFriendAdded();
      }
    } catch (err: any) {
      setFriendError(err.response?.data?.message || "Failed to send friend request");
    } finally {
      setFriendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[450px] rounded-lg bg-discord-dark p-6">
        <Tabs defaultValue="server" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="server">Join Server</TabsTrigger>
            <TabsTrigger value="friend">Add Friend</TabsTrigger>
          </TabsList>

          <TabsContent value="server">
            <h2 className="mb-2 text-xl font-bold text-foreground">Join a Server</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Enter an invite code to join an existing server
            </p>

            <div className="mb-2">
              <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                Invite Code
              </label>
              <input
                className="w-full rounded bg-discord-input-bg p-2 text-foreground focus:outline-none"
                placeholder="e.g., abc123xyz"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinServer()}
              />
            </div>

            {serverError && (
              <p className="mb-3 text-sm text-red-400">{serverError}</p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded px-4 py-2 text-foreground transition-colors hover:bg-discord-hover"
                disabled={serverLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleJoinServer}
                className="rounded bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={serverLoading}
              >
                {serverLoading ? "Joining..." : "Join Server"}
              </button>
            </div>
          </TabsContent>

          <TabsContent value="friend">
            <h2 className="mb-2 text-xl font-bold text-foreground">Add Friend</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Enter a username to send a friend request
            </p>

            <div className="mb-2">
              <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                Username
              </label>
              <input
                className="w-full rounded bg-discord-input-bg p-2 text-foreground focus:outline-none"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
              />
            </div>

            {friendError && (
              <p className="mb-3 text-sm text-red-400">{friendError}</p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded px-4 py-2 text-foreground transition-colors hover:bg-discord-hover"
                disabled={friendLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddFriend}
                className="rounded bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={friendLoading}
              >
                {friendLoading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
