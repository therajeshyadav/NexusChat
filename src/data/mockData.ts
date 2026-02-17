export interface Server {
  id: string;
  name: string;
  icon: string;
  channels: Channel[];
  members: Member[];
}

export interface Channel {
  id: string;
  name: string;
  category: string;
  type: 'text' | 'voice';
}

export interface Member {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  role?: string;
}

export interface Message {
  id: string;
  author: Member;
  content: string;
  timestamp: string;
  channelId: string;
}

export const mockMembers: Member[] = [
  { id: '1', username: 'You', avatar: '', status: 'online', role: 'Admin' },
  { id: '2', username: 'Alice', avatar: '', status: 'online', role: 'Moderator' },
  { id: '3', username: 'Bob', avatar: '', status: 'idle' },
  { id: '4', username: 'Charlie', avatar: '', status: 'online' },
  { id: '5', username: 'Diana', avatar: '', status: 'dnd' },
  { id: '6', username: 'Eve', avatar: '', status: 'offline' },
  { id: '7', username: 'Frank', avatar: '', status: 'offline' },
  { id: '8', username: 'Grace', avatar: '', status: 'online' },
];

export const mockServers: Server[] = [
  {
    id: 's1',
    name: 'Lovable Dev',
    icon: 'L',
    channels: [
      { id: 'c1', name: 'general', category: 'Text Channels', type: 'text' },
      { id: 'c2', name: 'introductions', category: 'Text Channels', type: 'text' },
      { id: 'c3', name: 'help', category: 'Support', type: 'text' },
      { id: 'c4', name: 'bugs', category: 'Support', type: 'text' },
      { id: 'c5', name: 'lounge', category: 'Voice Channels', type: 'voice' },
    ],
    members: mockMembers,
  },
  {
    id: 's2',
    name: 'Design Hub',
    icon: 'D',
    channels: [
      { id: 'c6', name: 'showcase', category: 'Text Channels', type: 'text' },
      { id: 'c7', name: 'feedback', category: 'Text Channels', type: 'text' },
    ],
    members: mockMembers.slice(0, 4),
  },
  {
    id: 's3',
    name: 'Gaming',
    icon: 'G',
    channels: [
      { id: 'c8', name: 'general', category: 'Text Channels', type: 'text' },
      { id: 'c9', name: 'lfg', category: 'Text Channels', type: 'text' },
    ],
    members: mockMembers.slice(0, 5),
  },
];

export const mockMessages: Message[] = [
  { id: 'm1', author: mockMembers[1], content: 'Hey everyone! Welcome to the server 🎉', timestamp: '2026-02-17T09:00:00Z', channelId: 'c1' },
  { id: 'm2', author: mockMembers[3], content: 'Thanks! Excited to be here.', timestamp: '2026-02-17T09:05:00Z', channelId: 'c1' },
  { id: 'm3', author: mockMembers[2], content: 'Has anyone tried the new update? It looks incredible.\nThe performance improvements are really noticeable.', timestamp: '2026-02-17T09:10:00Z', channelId: 'c1' },
  { id: 'm4', author: mockMembers[7], content: 'Yeah I tested it earlier today. Super smooth!', timestamp: '2026-02-17T09:15:00Z', channelId: 'c1' },
  { id: 'm5', author: mockMembers[4], content: 'Can someone help me with the setup? I\'m stuck on the configuration step.', timestamp: '2026-02-17T09:20:00Z', channelId: 'c1' },
  { id: 'm6', author: mockMembers[1], content: 'Sure! What error are you seeing?', timestamp: '2026-02-17T09:22:00Z', channelId: 'c1' },
  { id: 'm7', author: mockMembers[0], content: 'I can help too. Just share your config and I\'ll take a look.', timestamp: '2026-02-17T09:25:00Z', channelId: 'c1' },
  { id: 'm8', author: mockMembers[4], content: 'Thanks! Here\'s what I\'m seeing:\n\nError: Module not found\nCannot resolve \'@/config\'\n\nI\'ve tried reinstalling but no luck.', timestamp: '2026-02-17T09:28:00Z', channelId: 'c1' },
  { id: 'm9', author: mockMembers[1], content: 'Ah, that\'s a path alias issue. Check your tsconfig.json paths configuration.', timestamp: '2026-02-17T09:30:00Z', channelId: 'c1' },
  { id: 'm10', author: mockMembers[3], content: 'Good morning everyone! ☕', timestamp: '2026-02-17T10:00:00Z', channelId: 'c1' },
];
