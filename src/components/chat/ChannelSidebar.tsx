import {
  Hash,
  Volume2,
  ChevronDown,
  Plus,
  UserPlus,
  Copy,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Server, Channel } from "@/types/chat"; // adjust path
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { chatApi } from "@/services/chatApi";
import EditChannelModal from "@/components/EditChannelModal";
import UserPanel from "@/components/shared/UserPanel";
import VoiceChannelPanel from "@/components/chat/VoiceChannelPanel";
import { useVoiceChannel } from "@/hooks/useVoiceChannel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChannelSidebarProps {
  server: Server;
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  onChannelCreated: () => void;
}

export default function ChannelSidebar({
  server,
  activeChannelId,
  onSelectChannel,
  onChannelCreated,
}: ChannelSidebarProps) {
  if (!server || !server.channels || server.channels.length === 0) return null;
  
  const { user, logout } = useAuth();
  const { voiceState, joinVoiceChannel, leaveVoiceChannel, toggleMute, toggleDeafen } = useVoiceChannel();
  
  const categories = [
    "TEXT CHANNELS",
    "VOICE CHANNELS",
    ...new Set(server.channels.map((c) => c.category || "general").filter(cat => 
      cat !== "general" && !cat.toUpperCase().includes("TEXT") && !cat.toUpperCase().includes("VOICE")
    )),
  ];
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [deletingChannelId, setDeletingChannelId] = useState<string | null>(null);

  const isOwnerOrAdmin = server.ownerId === user?.id;

  const toggleCategory = (cat: string) =>
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const handleCreateChannel = async (category: string) => {
    const isVoiceCategory = category.toUpperCase().includes("VOICE");
    const type = isVoiceCategory ? "voice" : "text";
    const name = prompt(`Enter ${type} channel name:`);
    if (!name) return;

    try {
      await chatApi.createChannel(server._id, name, type, category);
      await onChannelCreated();
    } catch (err) {
      console.error("Failed to create channel", err);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const response = await chatApi.generateInvite(server._id);
      const inviteCode = response.inviteCode;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(inviteCode);
      alert(`Invite code copied to clipboard: ${inviteCode}`);
    } catch (err) {
      console.error("Failed to generate invite", err);
      alert("Failed to generate invite code");
    }
  };

  const handleEditChannel = async (name: string) => {
    if (!editingChannel) return;
    
    try {
      await chatApi.updateChannel(server._id, editingChannel._id, name);
      await onChannelCreated();
      setEditingChannel(null);
    } catch (err) {
      console.error("Failed to update channel", err);
      alert("Failed to update channel");
    }
  };

  const handleChannelClick = (channel: Channel) => {
    if (channel.type === 'voice') {
      // Handle voice channel join/leave
      if (voiceState.channelId === channel._id) {
        // Already in this voice channel, leave it
        leaveVoiceChannel();
      } else {
        // Join this voice channel (leave current one if any)
        if (voiceState.isConnected) {
          leaveVoiceChannel();
        }
        joinVoiceChannel(channel._id);
      }
    } else {
      // Regular text channel
      onSelectChannel(channel._id);
    }
  };

  const handleDeleteChannel = async () => {
    if (!deletingChannelId) return;
    
    try {
      await chatApi.deleteChannel(server._id, deletingChannelId);
      await onChannelCreated();
      setDeletingChannelId(null);
    } catch (err: any) {
      console.error("Failed to delete channel", err);
      alert(err.response?.data?.message || "Failed to delete channel");
    }
  };

  return (
    <div className="flex h-full w-60 flex-col bg-discord-darker">
      {/* Server header */}
      <div className="flex h-12 items-center justify-between border-b border-discord-darkest px-4">
        <span className="truncate text-sm font-semibold text-foreground">
          {server.name}
        </span>
        <button
          onClick={handleGenerateInvite}
          className="text-muted-foreground transition-colors hover:text-foreground"
          title="Generate Invite Link"
        >
          <UserPlus className="h-4 w-4" />
        </button>
      </div>

      {/* Channel list */}
      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-2 pt-4">
        {categories.map((category) => (
          <div key={category} className="mb-4">
            <div className="mb-1 flex w-full items-center justify-between px-1">
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
              >
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    collapsed[category] ? "-rotate-90" : ""
                  }`}
                />
                {category}
              </button>
              <button
                onClick={() => handleCreateChannel(category)}
                className="text-muted-foreground hover:text-foreground"
                title="Create Channel"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {!collapsed[category] &&
              server.channels
                .filter((c) => {
                  if (category === "TEXT CHANNELS") {
                    return c.type === "text" || !c.type; // Default to text if no type
                  } else if (category === "VOICE CHANNELS") {
                    return c.type === "voice";
                  } else {
                    return (c.category || "general") === category;
                  }
                })
                .map((channel) => (
                  <div
                    key={channel._id}
                    className={`group mb-0.5 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                      channel.type === 'voice' && voiceState.channelId === channel._id
                        ? "bg-green-600/20 text-green-400"
                        : channel._id === activeChannelId
                        ? "bg-discord-hover text-foreground"
                        : "text-muted-foreground hover:bg-discord-hover/50 hover:text-foreground"
                    }`}
                  >
                    <button
                      onClick={() => handleChannelClick(channel)}
                      className="flex flex-1 items-center gap-1.5 overflow-hidden"
                    >
                      {channel.type === "text" ? (
                        <Hash className="h-4 w-4 shrink-0 opacity-70" />
                      ) : (
                        <Volume2 className={`h-4 w-4 shrink-0 ${
                          voiceState.channelId === channel._id ? 'text-green-400' : 'opacity-70'
                        }`} />
                      )}
                      <span className="truncate">{channel.name}</span>
                      {channel.type === 'voice' && voiceState.channelId === channel._id && (
                        <span className="text-xs text-green-400">({voiceState.users.length + 1})</span>
                      )}
                    </button>
                    
                    {isOwnerOrAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-discord-hover rounded">
                            <MoreVertical className="h-3 w-3" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingChannel(channel)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Channel
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeletingChannelId(channel._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Channel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
          </div>
        ))}
      </div>

      {/* Voice Channel Panel */}
      <VoiceChannelPanel
        voiceState={voiceState}
        onToggleMute={toggleMute}
        onToggleDeafen={toggleDeafen}
        onLeaveChannel={leaveVoiceChannel}
      />

      {/* User panel */}
      <UserPanel />

      {/* Edit Channel Modal */}
      {editingChannel && (
        <EditChannelModal
          isOpen={!!editingChannel}
          onClose={() => setEditingChannel(null)}
          channelName={editingChannel.name}
          onSave={handleEditChannel}
        />
      )}

      {/* Delete Channel Confirmation */}
      <AlertDialog open={!!deletingChannelId} onOpenChange={() => setDeletingChannelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this channel? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChannel} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
