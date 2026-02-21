import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { chatApi } from "@/services/chatApi";
import { DM } from "@/types/chat";
import UserPanel from "@/components/shared/UserPanel";

interface DMSidebarProps {
  activeDMId: string | null;
  onSelectDM: (friendId: number, friendUsername: string, dmId: string) => void;
  onShowFriends: () => void;
}

export default function DMSidebar({ activeDMId, onSelectDM, onShowFriends }: DMSidebarProps) {
  const [dms, setDMs] = useState<DM[]>([]);

  useEffect(() => {
    loadDMs();
  }, []);

  const loadDMs = async () => {
    try {
      const data = await chatApi.getDMs();
      setDMs(data);
    } catch (err) {
      console.error("Failed to load DMs", err);
    }
  };

  return (
    <div className="flex h-full w-60 flex-col bg-discord-darker">
      {/* Search */}
      <div className="p-2">
        <button 
          onClick={onShowFriends}
          className="flex w-full items-center gap-2 rounded-md bg-discord-darkest px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span>Find or start a conversation</span>
        </button>
      </div>

      {/* DM List */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Direct Messages
          </span>
        </div>

        {dms.length > 0 ? (
          <div className="space-y-0.5">
            {dms.map((dm) => (
              <button
                key={dm._id}
                onClick={() => onSelectDM(dm.friendId, dm.friendUsername, dm._id)}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
                  activeDMId === dm._id
                    ? "bg-discord-hover text-foreground"
                    : "text-muted-foreground hover:bg-discord-hover/50 hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {dm.friendUsername.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-discord-darker bg-gray-500" />
                </div>
                <div className="flex-1 overflow-hidden text-left">
                  <p className="truncate font-medium">{dm.friendUsername}</p>
                  {dm.lastMessage && (
                    <p className="truncate text-xs text-muted-foreground">
                      {dm.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-2 text-xs text-muted-foreground">
            No conversations yet. Click a friend to start chatting!
          </p>
        )}
      </div>

      {/* User panel */}
      <UserPanel />
    </div>
  );
}
