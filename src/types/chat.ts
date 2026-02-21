export interface Server {
  _id: string;
  name: string;
  ownerId: number;
  channels: Channel[];
}

export interface Channel {
  _id: string;
  name: string;
  serverId?: string;
  type?: "text" | "voice" | "dm";
  category?: string;
}

export interface Message {
  _id: string;
  content: string;
  senderId: string;
  senderUsername?: string;
  channelId: string;
  createdAt: string;
  updatedAt?: string;
  attachments?: Array<{
    type: "image" | "file";
    url: string;
    filename?: string;
    size?: number;
  }>;
}

export interface Member {
  _id: string;
  username: string;
  status?: "online" | "offline" | "idle" | "dnd";
  role?: "owner" | "admin" | "member";
}

export interface Friend {
  _id: string;
  userId: number;
  friendId: number;
  friendUsername: string;
  status: "pending" | "accepted" | "blocked";
  requestedBy: number;
  createdAt: string;
}

export interface DM {
  _id: string;
  friendId: number;
  friendUsername: string;
  lastMessage?: {
    content: string;
    senderId: number;
    createdAt: string;
  };
  updatedAt: string;
}