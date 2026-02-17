import { useState, useRef, useEffect } from 'react';
import { Hash, Bell, Pin, Users, Search, Plus, SmilePlus, Gift, ImagePlus } from 'lucide-react';
import { Message, Channel, Member } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';

interface ChatAreaProps {
  channel: Channel;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onToggleMembers: () => void;
  showMembers: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

function getAvatarColor(id: string) {
  const colors = ['bg-primary', 'bg-discord-green', 'bg-discord-yellow', 'bg-discord-red', 'bg-accent'];
  return colors[parseInt(id) % colors.length];
}

export default function ChatArea({ channel, messages, onSendMessage, onToggleMembers, showMembers }: ChatAreaProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-discord-chat-bg">
      {/* Channel header */}
      <div className="flex h-12 items-center justify-between border-b border-discord-darkest px-4">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold text-foreground">{channel.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground transition-colors hover:text-foreground"><Bell className="h-5 w-5" /></button>
          <button className="text-muted-foreground transition-colors hover:text-foreground"><Pin className="h-5 w-5" /></button>
          <button onClick={onToggleMembers} className={`transition-colors ${showMembers ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><Users className="h-5 w-5" /></button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input className="w-36 rounded-md bg-discord-darkest py-1 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" placeholder="Search" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Hash className="mb-2 h-16 w-16 opacity-30" />
            <h3 className="text-xl font-bold text-foreground">Welcome to #{channel.name}!</h3>
            <p className="text-sm">This is the start of the #{channel.name} channel.</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const showDate = i === 0 || formatDate(messages[i - 1].timestamp) !== formatDate(msg.timestamp);
          const isGrouped = i > 0 && messages[i - 1].author.id === msg.author.id && !showDate && (new Date(msg.timestamp).getTime() - new Date(messages[i - 1].timestamp).getTime()) < 5 * 60 * 1000;

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="my-4 flex items-center gap-2">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-[11px] font-semibold text-muted-foreground">{formatDate(msg.timestamp)}</span>
                  <div className="flex-1 border-t border-border" />
                </div>
              )}
              <div className={`group flex gap-4 rounded-md px-2 py-0.5 transition-colors hover:bg-discord-hover/30 ${isGrouped ? 'mt-0' : 'mt-4'}`}>
                {isGrouped ? (
                  <div className="w-10 shrink-0">
                    <span className="hidden text-[10px] text-muted-foreground group-hover:inline">{formatTime(msg.timestamp)}</span>
                  </div>
                ) : (
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground ${getAvatarColor(msg.author.id)}`}>
                    {msg.author.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {!isGrouped && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-foreground hover:underline">{msg.author.username}</span>
                      <span className="text-[11px] text-muted-foreground">{formatTime(msg.timestamp)}</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{msg.content}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="px-4 pb-6">
        <div className="flex items-center gap-2 rounded-lg bg-discord-input-bg px-4 py-2">
          <button className="text-muted-foreground transition-colors hover:text-foreground"><Plus className="h-5 w-5" /></button>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder={`Message #${channel.name}`}
          />
          <button className="text-muted-foreground transition-colors hover:text-foreground"><ImagePlus className="h-5 w-5" /></button>
          <button className="text-muted-foreground transition-colors hover:text-foreground"><Gift className="h-5 w-5" /></button>
          <button className="text-muted-foreground transition-colors hover:text-foreground"><SmilePlus className="h-5 w-5" /></button>
        </div>
      </div>
    </div>
  );
}
