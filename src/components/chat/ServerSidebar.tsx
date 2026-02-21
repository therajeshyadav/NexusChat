import { Plus, UserPlus, Edit, Trash2 } from "lucide-react";
import { Server } from "@/types/chat";
import { useState } from "react";
import CreateServerModal from "@/components/CreateServerModal";
import JoinOrAddModal from "@/components/JoinOrAddModal";
import EditServerModal from "@/components/EditServerModal";
import { chatApi } from "@/services/chatApi";
import { useAuth } from "@/context/AuthContext";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
interface ServerSidebarProps {
  servers: Server[];
  activeServerId: string;
  onSelectServer: (id: string) => void;
  onServerCreated: () => void;
  onHomeClick: () => void;
}

export default function ServerSidebar({
  servers,
  activeServerId,
  onSelectServer,
  onServerCreated,
  onHomeClick,
}: ServerSidebarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinOrAddModal, setShowJoinOrAddModal] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [deletingServerId, setDeletingServerId] = useState<string | null>(null);
  const { user } = useAuth();
  console.log("Servers:", servers);

  const handleEditServer = async (name: string) => {
    if (!editingServer) return;
    
    try {
      await chatApi.updateServer(editingServer._id, name);
      await onServerCreated();
      setEditingServer(null);
    } catch (err) {
      console.error("Failed to update server", err);
      alert("Failed to update server");
    }
  };

  const handleDeleteServer = async () => {
    if (!deletingServerId) return;
    
    try {
      await chatApi.deleteServer(deletingServerId);
      await onServerCreated();
      setDeletingServerId(null);
    } catch (err: any) {
      console.error("Failed to delete server", err);
      alert(err.response?.data?.message || "Failed to delete server");
    }
  };

  return (
    <div className="flex h-full w-[72px] flex-col items-center gap-2 bg-discord-darkest py-3">
      {/* Home / DM button */}
      <div className="group relative">
        {/* Active indicator for home */}
        <div
          className={`absolute -left-1 top-1/2 h-2 w-1 -translate-y-1/2 rounded-r-full bg-foreground transition-all duration-200 ${!activeServerId ? "h-10" : "h-0 group-hover:h-5"}`}
        />
        <button 
          onClick={onHomeClick}
          className={`flex h-12 w-12 items-center justify-center transition-all duration-200 ${!activeServerId ? "rounded-xl bg-primary" : "rounded-2xl bg-discord-dark hover:rounded-xl hover:bg-primary"}`}
          title="Direct Messages"
        >
          <svg
            width="28"
            height="20"
            viewBox="0 0 28 20"
            fill="none"
            className={`transition-colors ${!activeServerId ? "text-primary-foreground" : "text-foreground group-hover:text-primary-foreground"}`}
          >
            <path
              d="M23.7 1.7A23.3 23.3 0 0017.9.1a.1.1 0 00-.1 0 16 16 0 00-.7 1.5 21.5 21.5 0 00-6.4 0A15 15 0 0010 .1a.1.1 0 00-.1 0 23.2 23.2 0 00-5.8 1.6.1.1 0 000 0A24 24 0 00.1 16.2a.1.1 0 000 .1 23.4 23.4 0 007.1 3.6.1.1 0 00.1 0 16.7 16.7 0 001.5-2.4.1.1 0 000-.1 15.4 15.4 0 01-2.4-1.2.1.1 0 010-.2l.5-.4a.1.1 0 01.1 0 16.7 16.7 0 0014.2 0 .1.1 0 01.1 0l.5.4a.1.1 0 010 .2 14.5 14.5 0 01-2.5 1.2.1.1 0 000 .1 18.8 18.8 0 001.5 2.4.1.1 0 00.1 0 23.3 23.3 0 007.1-3.6.1.1 0 000-.1A24 24 0 0023.7 1.7zM9.3 13.3c-1.3 0-2.4-1.2-2.4-2.7s1.1-2.7 2.4-2.7 2.5 1.2 2.4 2.7c0 1.5-1 2.7-2.4 2.7zm8.8 0c-1.3 0-2.4-1.2-2.4-2.7s1.1-2.7 2.4-2.7 2.5 1.2 2.4 2.7c0 1.5-1 2.7-2.4 2.7z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <div className="mx-auto w-8 border-t border-border" />

      {/* Server icons */}
      {servers.map((server) => {
        const isActive = server._id === activeServerId;
        const isOwner = server.ownerId === user?.id;
        
        return (
          <ContextMenu key={server._id}>
            <ContextMenuTrigger>
              <div className="group relative">
                {/* Active indicator pill */}
                <div
                  className={`absolute -left-1 top-1/2 h-2 w-1 -translate-y-1/2 rounded-r-full bg-foreground transition-all duration-200 ${isActive ? "h-10" : "h-0 group-hover:h-5"}`}
                />
                <button
                  onClick={() => onSelectServer(server._id)}
                  className={`flex h-12 w-12 items-center justify-center text-sm font-semibold transition-all duration-200 ${isActive ? "rounded-xl bg-primary text-primary-foreground" : "rounded-2xl bg-discord-dark text-foreground hover:rounded-xl hover:bg-primary hover:text-primary-foreground"}`}
                  title={server.name}
                >
                  {server.name.charAt(0).toUpperCase()}
                </button>
              </div>
            </ContextMenuTrigger>
            {isOwner && (
              <ContextMenuContent>
                <ContextMenuItem onClick={() => setEditingServer(server)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Server
                </ContextMenuItem>
                <ContextMenuItem 
                  onClick={() => setDeletingServerId(server._id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Server
                </ContextMenuItem>
              </ContextMenuContent>
            )}
          </ContextMenu>
        );
      })}

      {/* Add server */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-discord-dark transition-all duration-200 hover:rounded-xl hover:bg-discord-green"
        title="Create Server"
      >
        <Plus className="h-5 w-5 text-discord-green transition-colors group-hover:text-primary-foreground" />
      </button>

      {/* Join server or Add friend */}
      <button
        onClick={() => setShowJoinOrAddModal(true)}
        className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-discord-dark transition-all duration-200 hover:rounded-xl hover:bg-discord-green"
        title="Join Server / Add Friend"
      >
        <UserPlus className="h-5 w-5 text-discord-green transition-colors group-hover:text-primary-foreground" />
      </button>

      {showCreateModal && (
        <CreateServerModal
          onClose={() => setShowCreateModal(false)}
          onServerCreated={onServerCreated}
        />
      )}

      {showJoinOrAddModal && (
        <JoinOrAddModal
          onClose={() => setShowJoinOrAddModal(false)}
          onServerJoined={onServerCreated}
          onFriendAdded={() => {
            // Optional: refresh friends list if needed
            console.log("Friend request sent");
          }}
        />
      )}

      {/* Edit Server Modal */}
      {editingServer && (
        <EditServerModal
          isOpen={!!editingServer}
          onClose={() => setEditingServer(null)}
          serverName={editingServer.name}
          onSave={handleEditServer}
        />
      )}

      {/* Delete Server Confirmation */}
      <AlertDialog open={!!deletingServerId} onOpenChange={() => setDeletingServerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Server</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this server? This will permanently delete all channels and messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteServer} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
