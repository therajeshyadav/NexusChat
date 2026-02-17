import { Hash, Volume2, ChevronDown, Settings, Mic, Headphones } from 'lucide-react';
import { Server, Channel } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

interface ChannelSidebarProps {
  server: Server;
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
}

export default function ChannelSidebar({ server, activeChannelId, onSelectChannel }: ChannelSidebarProps) {
  const { user, logout } = useAuth();
  const categories = [...new Set(server.channels.map(c => c.category))];
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <div className="flex h-full w-60 flex-col bg-discord-darker">
      {/* Server header */}
      <button className="flex h-12 items-center justify-between border-b border-discord-darkest px-4 transition-colors hover:bg-discord-hover">
        <span className="truncate text-sm font-semibold text-foreground">{server.name}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-2 pt-4">
        {categories.map(category => (
          <div key={category} className="mb-4">
            <button onClick={() => toggleCategory(category)} className="mb-1 flex w-full items-center gap-1 px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-3 w-3 transition-transform ${collapsed[category] ? '-rotate-90' : ''}`} />
              {category}
            </button>
            {!collapsed[category] && server.channels
              .filter(c => c.category === category)
              .map(channel => (
                <button
                  key={channel.id}
                  onClick={() => onSelectChannel(channel.id)}
                  className={`mb-0.5 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors ${channel.id === activeChannelId ? 'bg-discord-hover text-foreground' : 'text-muted-foreground hover:bg-discord-hover/50 hover:text-foreground'}`}
                >
                  {channel.type === 'text' ? <Hash className="h-4 w-4 shrink-0 opacity-70" /> : <Volume2 className="h-4 w-4 shrink-0 opacity-70" />}
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
          </div>
        ))}
      </div>

      {/* User panel */}
      <div className="flex items-center gap-2 border-t border-discord-darkest bg-discord-darkest/50 px-2 py-2">
        <div className="relative">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-discord-darkest bg-discord-green" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium text-foreground">{user?.username || 'User'}</p>
          <p className="truncate text-[10px] text-muted-foreground">Online</p>
        </div>
        <div className="flex gap-1">
          <button className="rounded p-1 text-muted-foreground transition-colors hover:bg-discord-hover hover:text-foreground"><Mic className="h-4 w-4" /></button>
          <button className="rounded p-1 text-muted-foreground transition-colors hover:bg-discord-hover hover:text-foreground"><Headphones className="h-4 w-4" /></button>
          <button onClick={logout} className="rounded p-1 text-muted-foreground transition-colors hover:bg-discord-hover hover:text-foreground" title="Logout"><Settings className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
