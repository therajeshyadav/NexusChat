import { Settings, Mic, Headphones, Bell } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import UserProfileModal from "@/components/profile/UserProfileModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserPanelProps {
  pendingCount?: number;
  onPendingClick?: () => void;
}

export default function UserPanel({ pendingCount, onPendingClick }: UserPanelProps) {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
  };

  return (
    <>
      <div className="flex items-center gap-2 border-t border-discord-darkest bg-discord-darkest/50 px-2 py-2">
        <div className="relative">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getImageUrl(user?.avatar)} alt={user?.username} />
            <AvatarFallback className="text-xs font-bold bg-primary text-primary-foreground">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-discord-darkest bg-discord-green" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-foreground">
            {user?.username || "User"}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">Online</p>
        </div>
        <div className="flex gap-1">
          {pendingCount !== undefined && pendingCount > 0 && (
            <button 
              onClick={onPendingClick}
              className="relative rounded p-1 text-muted-foreground transition-colors hover:bg-discord-hover hover:text-foreground"
              title={`${pendingCount} pending request${pendingCount > 1 ? 's' : ''}`}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            </button>
          )}
          <button className="rounded p-1 text-muted-foreground transition-colors hover:bg-discord-hover hover:text-foreground">
            <Mic className="h-4 w-4" />
          </button>
          <button className="rounded p-1 text-muted-foreground transition-colors hover:bg-discord-hover hover:text-foreground">
            <Headphones className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowProfile(true)}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-discord-hover hover:text-foreground"
            title="User Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      <UserProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
}
