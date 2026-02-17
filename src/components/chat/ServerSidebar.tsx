import { Plus } from 'lucide-react';
import { Server } from '@/data/mockData';

interface ServerSidebarProps {
  servers: Server[];
  activeServerId: string;
  onSelectServer: (id: string) => void;
}

export default function ServerSidebar({ servers, activeServerId, onSelectServer }: ServerSidebarProps) {
  return (
    <div className="flex h-full w-[72px] flex-col items-center gap-2 bg-discord-darkest py-3">
      {/* Home / DM button */}
      <button className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-discord-dark transition-all duration-200 hover:rounded-xl hover:bg-primary">
        <svg width="28" height="20" viewBox="0 0 28 20" fill="none" className="text-foreground transition-colors group-hover:text-primary-foreground">
          <path d="M23.7 1.7A23.3 23.3 0 0017.9.1a.1.1 0 00-.1 0 16 16 0 00-.7 1.5 21.5 21.5 0 00-6.4 0A15 15 0 0010 .1a.1.1 0 00-.1 0 23.2 23.2 0 00-5.8 1.6.1.1 0 000 0A24 24 0 00.1 16.2a.1.1 0 000 .1 23.4 23.4 0 007.1 3.6.1.1 0 00.1 0 16.7 16.7 0 001.5-2.4.1.1 0 000-.1 15.4 15.4 0 01-2.4-1.2.1.1 0 010-.2l.5-.4a.1.1 0 01.1 0 16.7 16.7 0 0014.2 0 .1.1 0 01.1 0l.5.4a.1.1 0 010 .2 14.5 14.5 0 01-2.5 1.2.1.1 0 000 .1 18.8 18.8 0 001.5 2.4.1.1 0 00.1 0 23.3 23.3 0 007.1-3.6.1.1 0 000-.1A24 24 0 0023.7 1.7zM9.3 13.3c-1.3 0-2.4-1.2-2.4-2.7s1.1-2.7 2.4-2.7 2.5 1.2 2.4 2.7c0 1.5-1 2.7-2.4 2.7zm8.8 0c-1.3 0-2.4-1.2-2.4-2.7s1.1-2.7 2.4-2.7 2.5 1.2 2.4 2.7c0 1.5-1 2.7-2.4 2.7z" fill="currentColor"/>
        </svg>
      </button>

      <div className="mx-auto w-8 border-t border-border" />

      {/* Server icons */}
      {servers.map(server => {
        const isActive = server.id === activeServerId;
        return (
          <div key={server.id} className="group relative">
            {/* Active indicator pill */}
            <div className={`absolute -left-1 top-1/2 h-2 w-1 -translate-y-1/2 rounded-r-full bg-foreground transition-all duration-200 ${isActive ? 'h-10' : 'h-0 group-hover:h-5'}`} />
            <button
              onClick={() => onSelectServer(server.id)}
              className={`flex h-12 w-12 items-center justify-center text-sm font-semibold transition-all duration-200 ${isActive ? 'rounded-xl bg-primary text-primary-foreground' : 'rounded-2xl bg-discord-dark text-foreground hover:rounded-xl hover:bg-primary hover:text-primary-foreground'}`}
              title={server.name}
            >
              {server.icon}
            </button>
          </div>
        );
      })}

      {/* Add server */}
      <button className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-discord-dark transition-all duration-200 hover:rounded-xl hover:bg-discord-green">
        <Plus className="h-5 w-5 text-discord-green transition-colors group-hover:text-primary-foreground" />
      </button>
    </div>
  );
}
