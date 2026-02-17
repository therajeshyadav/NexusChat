import { useState } from 'react';
import { mockServers, mockMessages, Message, mockMembers } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import ServerSidebar from '@/components/chat/ServerSidebar';
import ChannelSidebar from '@/components/chat/ChannelSidebar';
import ChatArea from '@/components/chat/ChatArea';
import MembersSidebar from '@/components/chat/MembersSidebar';

export default function Chat() {
  const { user } = useAuth();
  const [activeServerId, setActiveServerId] = useState(mockServers[0].id);
  const [activeChannelId, setActiveChannelId] = useState(mockServers[0].channels[0].id);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [showMembers, setShowMembers] = useState(true);

  const activeServer = mockServers.find(s => s.id === activeServerId) || mockServers[0];
  const activeChannel = activeServer.channels.find(c => c.id === activeChannelId) || activeServer.channels[0];
  const channelMessages = messages.filter(m => m.channelId === activeChannelId);

  const handleSelectServer = (id: string) => {
    setActiveServerId(id);
    const server = mockServers.find(s => s.id === id);
    if (server) setActiveChannelId(server.channels[0].id);
  };

  const handleSendMessage = (content: string) => {
    const newMsg: Message = {
      id: 'm' + Date.now(),
      author: { id: '1', username: user?.username || 'You', avatar: '', status: 'online' },
      content,
      timestamp: new Date().toISOString(),
      channelId: activeChannelId,
    };
    setMessages(prev => [...prev, newMsg]);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ServerSidebar servers={mockServers} activeServerId={activeServerId} onSelectServer={handleSelectServer} />
      <ChannelSidebar server={activeServer} activeChannelId={activeChannelId} onSelectChannel={setActiveChannelId} />
      <ChatArea channel={activeChannel} messages={channelMessages} onSendMessage={handleSendMessage} onToggleMembers={() => setShowMembers(!showMembers)} showMembers={showMembers} />
      {showMembers && <MembersSidebar members={activeServer.members} />}
    </div>
  );
}
