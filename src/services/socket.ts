import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinServer(serverId: string) {
    console.log('Joining server:', serverId);
    this.socket?.emit('join_server', serverId);
  }

  leaveServer(serverId: string) {
    console.log('Leaving server:', serverId);
    this.socket?.emit('leave_server', serverId);
  }

  joinChannel(channelId: string) {
    console.log('Joining channel:', channelId);
    this.socket?.emit('join_channel', channelId);
  }

  leaveChannel(channelId: string) {
    console.log('Leaving channel:', channelId);
    this.socket?.emit('leave_channel', channelId);
  }

  sendMessage(channelId: string, content: string, attachments?: any[]) {
    console.log('Sending message:', { channelId, content, attachments });
    this.socket?.emit('send_message', { channelId, content, attachments });
  }

  onNewMessage(callback: (message: any) => void) {
    this.socket?.on('receive_message', callback);
  }

  offNewMessage() {
    this.socket?.off('receive_message');
  }

  onOnlineUsersUpdate(callback: (data: { serverId: string; onlineUsers: string[] }) => void) {
    this.socket?.on('online_users_update', callback);
  }

  offOnlineUsersUpdate() {
    this.socket?.off('online_users_update');
  }

  // Friend request socket events
  sendFriendRequestNotification(friendId: number, friendUsername: string) {
    this.socket?.emit('send_friend_request', { friendId, friendUsername });
  }

  acceptFriendRequestNotification(friendshipId: string, friendId: number) {
    this.socket?.emit('accept_friend_request', { friendshipId, friendId });
  }

  rejectFriendRequestNotification(friendId: number) {
    this.socket?.emit('reject_friend_request', { friendId });
  }

  removeFriendNotification(friendId: number) {
    this.socket?.emit('remove_friend', { friendId });
  }

  onFriendRequestReceived(callback: (data: any) => void) {
    this.socket?.on('friend_request_received', callback);
  }

  onFriendRequestAccepted(callback: (data: any) => void) {
    this.socket?.on('friend_request_accepted', callback);
  }

  onFriendRequestRejected(callback: (data: any) => void) {
    this.socket?.on('friend_request_rejected', callback);
  }

  onFriendRemoved(callback: (data: any) => void) {
    this.socket?.on('friend_removed', callback);
  }

  offFriendEvents() {
    this.socket?.off('friend_request_received');
    this.socket?.off('friend_request_accepted');
    this.socket?.off('friend_request_rejected');
    this.socket?.off('friend_removed');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
