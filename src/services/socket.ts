import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/config/api';

class SocketService {
  private socket: Socket | null = null;
  private callIncomingHandler: ((data: any) => void) | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    console.log('🔌 Connecting socket with token...');
    console.log('🔌 Socket URL:', API_CONFIG.socketUrl);
    
    this.socket = io(API_CONFIG.socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      // Emit custom event so listeners can re-register
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('socket-connected'));
      }
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    // Debug: Log ALL incoming events
    this.socket.onAny((eventName, ...args) => {
      console.log(`📨 Socket event received: ${eventName}`, args);
      
      // WORKAROUND: Manually trigger handlers since socket.on() not working
      if (eventName === 'dm_call_incoming') {
        console.log(`🔧 Event is dm_call_incoming, checking handler...`);
        
        if (this.callIncomingHandler) {
          console.log(`🔧 Manually triggering call incoming handler`);
          try {
            this.callIncomingHandler(args[0]);
            console.log(`✅ Handler executed successfully`);
          } catch (error) {
            console.error(`❌ Error in handler:`, error);
          }
        } else {
          console.warn('⚠️ No handler registered for dm_call_incoming!');
        }
      }
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

  // ===============================
  // USER STATUS
  // ===============================

  setStatus(status: 'online' | 'idle' | 'dnd' | 'invisible') {
    this.socket?.emit('set_status', { status });
  }

  onUserStatusChanged(callback: (data: { userId: string; status: string }) => void) {
    this.socket?.on('user_status_changed', callback);
  }

  offUserStatusChanged() {
    this.socket?.off('user_status_changed');
  }

  // ===============================
  // TYPING INDICATORS
  // ===============================

  startTyping(channelId: string) {
    this.socket?.emit('typing_start', { channelId });
  }

  stopTyping(channelId: string) {
    this.socket?.emit('typing_stop', { channelId });
  }

  onUserTyping(callback: (data: { channelId: string; userId: string; username: string }) => void) {
    this.socket?.on('user_typing', callback);
  }

  onUserStoppedTyping(callback: (data: { channelId: string; userId: string }) => void) {
    this.socket?.on('user_stopped_typing', callback);
  }

  offTypingEvents() {
    this.socket?.off('user_typing');
    this.socket?.off('user_stopped_typing');
  }

  // ===============================
  // DM CALLING (WebRTC)
  // ===============================

  // Initialize call
  initCall(friendId: number, callType: 'voice' | 'video' = 'voice') {
    console.log('🔊 Emitting dm_call_init:', { friendId, callType, socketConnected: this.socket?.connected });
    this.socket?.emit('dm_call_init', { friendId, callType });
  }

  // Reject incoming call
  rejectCall(friendId: number) {
    this.socket?.emit('dm_call_reject', { friendId });
  }

  // Send WebRTC offer
  sendCallOffer(friendId: number, offer: RTCSessionDescriptionInit) {
    this.socket?.emit('dm_call_offer', { friendId, offer });
  }

  // Send WebRTC answer
  sendCallAnswer(friendId: number, answer: RTCSessionDescriptionInit) {
    this.socket?.emit('dm_call_answer', { friendId, answer });
  }

  // Send ICE candidate
  sendIceCandidate(friendId: number, candidate: RTCIceCandidateInit) {
    this.socket?.emit('dm_call_ice_candidate', { friendId, candidate });
  }

  // End call
  endCall(friendId: number) {
    this.socket?.emit('dm_call_end', { friendId });
  }

  // Call event listeners
  onCallIncoming(callback: (data: { from: string; username: string; callType: string }) => void) {
    const listenerId = Math.random().toString(36).substr(2, 9);
    console.log(`📞 Registering onCallIncoming listener [${listenerId}]`);
    
    // Store ONLY the latest handler (replace old one)
    this.callIncomingHandler = callback;
    
    // Also try normal socket.on (in case it works)
    this.socket?.on('dm_call_incoming', (data) => {
      console.log(`🔔 dm_call_incoming event received in socket.ts [${listenerId}]:`, data);
      console.log('🔔 Calling callback function...');
      try {
        callback(data);
        console.log('✅ Callback executed successfully');
      } catch (error) {
        console.error('❌ Error in callback:', error);
      }
    });
  }

  onCallRejected(callback: (data: { from: string }) => void) {
    this.socket?.on('dm_call_rejected', callback);
  }

  onCallOffer(callback: (data: { from: string; offer: RTCSessionDescriptionInit }) => void) {
    this.socket?.on('dm_call_offer', callback);
  }

  onCallAnswer(callback: (data: { from: string; answer: RTCSessionDescriptionInit }) => void) {
    this.socket?.on('dm_call_answer', callback);
  }

  onCallIceCandidate(callback: (data: { from: string; candidate: RTCIceCandidateInit }) => void) {
    this.socket?.on('dm_call_ice_candidate', callback);
  }

  onCallEnd(callback: (data: { from: string; duration?: number }) => void) {
    this.socket?.on('dm_call_end', callback);
  }

  onCallUserOffline(callback: (data: { friendId: string }) => void) {
    this.socket?.on('dm_call_user_offline', callback);
  }

  onCallUserBusy(callback: (data: { friendId: string }) => void) {
    this.socket?.on('dm_call_user_busy', callback);
  }

  onCallAlreadyInCall(callback: () => void) {
    this.socket?.on('dm_call_already_in_call', callback);
  }

  onCallUserDisconnected(callback: (data: { userId: string }) => void) {
    this.socket?.on('dm_call_user_disconnected', callback);
  }

  offCallEvents() {
    console.log('🧹 Removing all call event listeners from socket');
    // DON'T clear the handler - keep it for manual triggering
    // this.callIncomingHandler = null;
    this.socket?.off('dm_call_incoming');
    this.socket?.off('dm_call_rejected');
    this.socket?.off('dm_call_offer');
    this.socket?.off('dm_call_answer');
    this.socket?.off('dm_call_ice_candidate');
    this.socket?.off('dm_call_end');
    this.socket?.off('dm_call_user_offline');
    this.socket?.off('dm_call_user_busy');
    this.socket?.off('dm_call_already_in_call');
    this.socket?.off('dm_call_user_disconnected');
  }

  // ===============================
  // VOICE CHANNELS (Group Voice Chat)
  // ===============================

  // Join voice channel
  joinVoiceChannel(channelId: string) {
    console.log('🎤 Emitting voice_channel_join:', { channelId, socketConnected: this.socket?.connected });
    this.socket?.emit('voice_channel_join', { channelId });
  }

  // Leave voice channel
  leaveVoiceChannel(channelId: string) {
    console.log('🎤 Leaving voice channel:', channelId);
    this.socket?.emit('voice_channel_leave', { channelId });
  }

  // Send WebRTC offer for voice channel
  sendVoiceChannelOffer(channelId: string, targetUserId: string, offer: RTCSessionDescriptionInit) {
    this.socket?.emit('voice_channel_offer', { channelId, targetUserId, offer });
  }

  // Send WebRTC answer for voice channel
  sendVoiceChannelAnswer(channelId: string, targetUserId: string, answer: RTCSessionDescriptionInit) {
    this.socket?.emit('voice_channel_answer', { channelId, targetUserId, answer });
  }

  // Send ICE candidate for voice channel
  sendVoiceChannelIceCandidate(channelId: string, targetUserId: string, candidate: RTCIceCandidateInit) {
    this.socket?.emit('voice_channel_ice_candidate', { channelId, targetUserId, candidate });
  }

  // Set mute status in voice channel
  setVoiceChannelMuted(channelId: string, isMuted: boolean) {
    this.socket?.emit('voice_channel_mute', { channelId, isMuted });
  }

  // Voice channel event listeners
  onVoiceChannelUserJoined(callback: (data: { userId: string; username: string; channelId: string }) => void) {
    console.log('📞 Registering onVoiceChannelUserJoined listener');
    this.socket?.on('voice_channel_user_joined', (data) => {
      console.log('🔔 voice_channel_user_joined event received:', data);
      console.log('🔔 Data type:', typeof data);
      console.log('🔔 Data keys:', Object.keys(data || {}));
      callback(data);
    });
  }

  onVoiceChannelUserLeft(callback: (data: { userId: string; channelId: string }) => void) {
    this.socket?.on('voice_channel_user_left', callback);
  }

  onVoiceChannelOffer(callback: (data: { from: string; offer: RTCSessionDescriptionInit; channelId: string }) => void) {
    console.log('📞 Registering onVoiceChannelOffer listener');
    this.socket?.on('voice_channel_offer', (data) => {
      console.log('🔔 voice_channel_offer event received:', data);
      callback(data);
    });
  }

  onVoiceChannelAnswer(callback: (data: { from: string; answer: RTCSessionDescriptionInit; channelId: string }) => void) {
    console.log('📞 Registering onVoiceChannelAnswer listener');
    this.socket?.on('voice_channel_answer', (data) => {
      console.log('🔔 voice_channel_answer event received:', data);
      callback(data);
    });
  }

  onVoiceChannelIceCandidate(callback: (data: { from: string; candidate: RTCIceCandidateInit; channelId: string }) => void) {
    console.log('📞 Registering onVoiceChannelIceCandidate listener');
    this.socket?.on('voice_channel_ice_candidate', (data) => {
      console.log('🔔 voice_channel_ice_candidate event received:', data);
      callback(data);
    });
  }

  onVoiceChannelUserMuted(callback: (data: { userId: string; isMuted: boolean; channelId: string }) => void) {
    this.socket?.on('voice_channel_user_muted', callback);
  }

  offVoiceChannelEvents() {
    console.log('🧹 Removing voice channel event listeners');
    this.socket?.off('voice_channel_user_joined');
    this.socket?.off('voice_channel_user_left');
    this.socket?.off('voice_channel_offer');
    this.socket?.off('voice_channel_answer');
    this.socket?.off('voice_channel_ice_candidate');
    this.socket?.off('voice_channel_user_muted');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
