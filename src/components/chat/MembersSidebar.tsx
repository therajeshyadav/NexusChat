import { Crown } from "lucide-react";
import { Member } from "@/types/chat";

interface MembersSidebarProps {
  members: Member[];
  ownerId?: number;
}

function getStatusColor(status: Member["status"]) {
  switch (status) {
    case "online":
      return "bg-discord-green";
    case "idle":
      return "bg-discord-yellow";
    case "dnd":
      return "bg-discord-red";
    default:
      return "bg-muted-foreground";
  }
}

function getAvatarColor(id: string) {
  const colors = [
    "bg-primary",
    "bg-discord-green",
    "bg-discord-yellow",
    "bg-discord-red",
    "bg-accent",
  ];
  return colors[parseInt(id) % colors.length];
}

export default function MembersSidebar({ members, ownerId }: MembersSidebarProps) {
  console.log(members);
  const online = members.filter((member) => member.status !== "offline");

  const offline = members.filter((member) => member.status === "offline");

  const renderMember = (member: Member) => {
    const isOwner = member._id === ownerId?.toString();
    
    return (
      <button
        key={member._id}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-discord-hover/50"
      >
        <div className="relative">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-primary-foreground ${getAvatarColor(member._id)} ${member.status === "offline" ? "opacity-40" : ""}`}
          >
            {member.username.charAt(0).toUpperCase()}
          </div>
          <div
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-discord-darker ${getStatusColor(member.status)}`}
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <p
            className={`truncate text-sm ${member.status === "offline" ? "text-muted-foreground" : "text-foreground/80"}`}
          >
            {member.username}
          </p>
          {isOwner && (
            <Crown className="h-4 w-4 flex-shrink-0 text-yellow-500" fill="currentColor" />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="flex h-full w-60 flex-col overflow-y-auto bg-discord-darker px-2 pt-6">
      {online.length > 0 && (
        <div className="mb-2">
          <h3 className="mb-1 px-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Online — {online.length}
          </h3>
          {online.map(renderMember)}
        </div>
      )}
      {offline.length > 0 && (
        <div className="mb-2">
          <h3 className="mb-1 px-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Offline — {offline.length}
          </h3>
          {offline.map(renderMember)}
        </div>
      )}
    </div>
  );
}
