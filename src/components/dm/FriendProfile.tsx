import { UserX } from "lucide-react";

interface FriendProfileProps {
  friendId: number;
  friendUsername: string;
  onRemoveFriend?: () => void;
}

export default function FriendProfile({ friendId, friendUsername, onRemoveFriend }: FriendProfileProps) {
  return (
    <div className="flex h-full w-80 flex-col border-l border-discord-darkest bg-discord-chat-bg">
      {/* Profile Header */}
      <div className="border-b border-discord-darkest p-4">
        <div className="flex flex-col items-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
            {friendUsername.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-foreground">{friendUsername}</h2>
          <p className="text-sm text-muted-foreground">User #{friendId}</p>
        </div>
      </div>

      {/* Profile Info */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <h3 className="mb-2 text-xs font-bold uppercase text-muted-foreground">About Me</h3>
          <div className="rounded-lg bg-discord-darker p-3">
            <p className="text-sm text-muted-foreground">No bio set yet.</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="mb-2 text-xs font-bold uppercase text-muted-foreground">Member Since</h3>
          <div className="rounded-lg bg-discord-darker p-3">
            <p className="text-sm text-foreground">Discord Member</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="mb-2 text-xs font-bold uppercase text-muted-foreground">Note</h3>
          <textarea
            className="w-full rounded-lg bg-discord-darker p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder="Click to add a note"
            rows={3}
          />
        </div>
      </div>

      {/* Actions */}
      {onRemoveFriend && (
        <div className="border-t border-discord-darkest p-4">
          <button
            onClick={onRemoveFriend}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <UserX className="h-4 w-4" />
            Remove Friend
          </button>
        </div>
      )}
    </div>
  );
}
