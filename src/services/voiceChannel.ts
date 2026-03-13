import { socketService } from './socket';

export interface VoiceChannelUser {
  userId: string;
  username: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

export interface VoiceChannelState {
  channelId: string | null;
  isConnected: boolean;
  users: VoiceChannelUser[];
  isMuted: boolean;
  isDeafened: boolean;
}

// Get current user ID from localStorage or auth context
const getCurrentUserId = (): string => {
  // Try localStorage first (set during login)
  const storedUserId = localStorage.getItem('user_id');
  if (storedUserId) {
    console.log('🆔 Got user ID from localStorage:', storedUserId);
    return storedUserId;
  }
  
  // Fallback to parsing auth token
  const token = localStorage.getItem('auth_token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id?.toString() || '0';
      console.log('🆔 Got user ID from token:', userId);
      return userId;
    } catch (e) {
      console.error('Failed to parse token:', e);
    }
  }
  
  console.log('🆔 Fallback user ID: 0');
  return '0';
};

class VoiceChannelManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private currentChannelId: string | null = null;
  private isConnected: boolean = false;
  
  // Audio elements for each user
  private audioElements: Map<string, HTMLAudioElement> = new Map();
  
  // Callbacks
  private onStateChangeCallback?: (state: VoiceChannelState) => void;
  private onUserJoinCallback?: (user: VoiceChannelUser) => void;
  private onUserLeaveCallback?: (userId: string) => void;
  private onErrorCallback?: (error: string) => void;

  private users: VoiceChannelUser[] = [];

  constructor() {
    console.log('🎤 VoiceChannelManager: Constructor called');
    
    // Setup listeners when socket connects
    if (typeof window !== 'undefined') {
      window.addEventListener('socket-connected', () => {
        console.log('🎤 VoiceChannelManager: Socket connected, setting up listeners');
        this.setupSocketListeners();
      });
    }
    
    // If socket is already connected, setup immediately
    if (socketService.isConnected()) {
      console.log('🎤 VoiceChannelManager: Socket already connected, setting up listeners');
      this.setupSocketListeners();
    }
    
    console.log('🎤 VoiceChannelManager: Constructor complete');
  }

  private setupSocketListeners() {
    console.log('🎤 Setting up voice channel socket listeners');
    console.log('🎤 Socket connected:', socketService.isConnected());

    // Handle user joined voice channel
    socketService.onVoiceChannelUserJoined(({ userId, username, channelId }) => {
      console.log('🔔 voice_channel_user_joined callback triggered:', { userId, username, channelId });
      console.log('👤 Current channel:', this.currentChannelId);
      console.log('👤 Is same channel:', channelId === this.currentChannelId);
      
      if (channelId === this.currentChannelId) {
        // Check if user already exists
        const existingUser = this.users.find(u => u.userId === userId);
        if (existingUser) {
          console.log('⚠️ User already in list, skipping');
          return;
        }
        
        const user: VoiceChannelUser = {
          userId,
          username,
          isMuted: false,
          isSpeaking: false,
        };
        
        this.users.push(user);
        console.log('✅ Added user to voice channel list:', user);
        this.onUserJoinCallback?.(user);
        this.notifyStateChange();
        
        console.log('🔗 Starting WebRTC connection with user:', userId);
        // Small delay to ensure both sides are ready
        setTimeout(() => {
          this.createPeerConnection(userId);
        }, 500);
      } else {
        console.log('⚠️ User joined different channel, ignoring');
      }
    });

    // Handle user left voice channel
    socketService.onVoiceChannelUserLeft(({ userId, channelId }) => {
      console.log('🔔 voice_channel_user_left callback triggered:', { userId, channelId });
      
      if (channelId === this.currentChannelId) {
        this.users = this.users.filter(u => u.userId !== userId);
        this.onUserLeaveCallback?.(userId);
        this.notifyStateChange();
        
        // Close WebRTC connection
        this.closePeerConnection(userId);
      }
    });

    // WebRTC signaling
    socketService.onVoiceChannelOffer(async ({ from, offer, channelId }) => {
      console.log('🔔 voice_channel_offer callback triggered:', { from, channelId });
      if (channelId === this.currentChannelId) {
        await this.handleOffer(from, offer);
      }
    });

    socketService.onVoiceChannelAnswer(async ({ from, answer, channelId }) => {
      console.log('🔔 voice_channel_answer callback triggered:', { from, channelId });
      if (channelId === this.currentChannelId) {
        await this.handleAnswer(from, answer);
      }
    });

    socketService.onVoiceChannelIceCandidate(async ({ from, candidate, channelId }) => {
      console.log('🔔 voice_channel_ice_candidate callback triggered:', { from, channelId });
      if (channelId === this.currentChannelId) {
        await this.handleIceCandidate(from, candidate);
      }
    });

    // User mute/unmute
    socketService.onVoiceChannelUserMuted(({ userId, isMuted, channelId }) => {
      console.log('� voice_channel_user_muted callback triggered:', { userId, isMuted, channelId });
      if (channelId === this.currentChannelId) {
        const user = this.users.find(u => u.userId === userId);
        if (user) {
          user.isMuted = isMuted;
          this.notifyStateChange();
        }
      }
    });

    // Test the callback registration with raw socket listener
    console.log('🧪 Testing voice channel callback registration...');
    
    const socket = socketService.getSocket();
    if (socket) {
      console.log('🧪 Adding raw socket listener for voice_channel_user_joined');
      socket.on('voice_channel_user_joined', (data: any) => {
        console.log('🧪 RAW voice_channel_user_joined event received:', data);
        // Manually trigger our callback for testing
        if (data.channelId === this.currentChannelId) {
          console.log('🧪 Manually triggering voice channel user joined logic');
          
          const existingUser = this.users.find(u => u.userId === data.userId);
          if (!existingUser) {
            const user: VoiceChannelUser = {
              userId: data.userId,
              username: data.username,
              isMuted: false,
              isSpeaking: false,
            };
            
            this.users.push(user);
            console.log('✅ [MANUAL] Added user to voice channel list:', user);
            this.onUserJoinCallback?.(user);
            this.notifyStateChange();
            
            console.log('� [MANUAL] Starting WebRTC connection with user:', data.userId);
            setTimeout(() => {
              this.createPeerConnection(data.userId);
            }, 500);
          }
        }
      });
    } else {
      console.log('🧪 No socket available for raw listener');
    }
  }

  async joinVoiceChannel(channelId: string): Promise<void> {
    try {
      console.log('🎤 Joining voice channel:', channelId);
      
      // Get microphone access FIRST
      await this.initializeLocalStream();
      console.log('✅ Microphone access granted for voice channel');
      
      // Join channel via socket
      console.log('� Sending voice_channel_join event');
      socketService.joinVoiceChannel(channelId);
      
      this.currentChannelId = channelId;
      this.isConnected = true;
      this.notifyStateChange();
      
      console.log('✅ Successfully joined voice channel:', channelId);
      console.log('🎤 Local stream tracks:', this.localStream?.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState
      })));
      
    } catch (error) {
      console.error('❌ Failed to join voice channel:', error);
      this.onErrorCallback?.('Failed to join voice channel. Please check microphone permissions.');
      throw error;
    }
  }

  leaveVoiceChannel(): void {
    console.log('🎤 Leaving voice channel:', this.currentChannelId);
    
    if (this.currentChannelId) {
      socketService.leaveVoiceChannel(this.currentChannelId);
    }
    
    this.cleanup();
  }

  private async initializeLocalStream(): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false, // Voice channels don't need video
    };

    try {
      console.log('🎤 Requesting microphone access');
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Microphone access granted');
    } catch (error) {
      console.error('❌ Error getting microphone access:', error);
      throw new Error('Could not access microphone');
    }
  }

  private createPeerConnection(userId: string): void {
    console.log('🔗 Creating peer connection for user:', userId);
    console.log('🔗 Local stream available:', !!this.localStream);
    console.log('🔗 Local stream tracks:', this.localStream?.getTracks().length || 0);
    
    // Production-grade WebRTC configuration (works everywhere)
    const config: RTCConfiguration = {
      iceServers: [
        // Multiple STUN servers for redundancy
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        
        // Cloudflare STUN (fast & reliable)
        { urls: 'stun:stun.cloudflare.com:3478' },
        
        // Multiple TURN servers for NAT traversal
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
        
        // Additional reliable TURN servers
        {
          urls: 'turn:relay1.expressturn.com:3478',
          username: 'ef3CYGPKLM2X2LC40V',
          credential: 'Hj8pDKpz92KmF5r6',
        },
        
        // Twilio STUN (enterprise grade)
        { urls: 'stun:global.stun.twilio.com:3478' },
      ],
      
      // Optimized settings for all networks
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };
    
    console.log('🔧 Using production-grade WebRTC config');

    const peerConnection = new RTCPeerConnection(config);
    this.peerConnections.set(userId, peerConnection);

    // Add local stream
    if (this.localStream) {
      console.log('➕ Adding local tracks to peer connection for user:', userId);
      this.localStream.getTracks().forEach((track, index) => {
        console.log(`➕ Adding track ${index}:`, {
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
          id: track.id
        });
        peerConnection.addTrack(track, this.localStream!);
      });
    } else {
      console.error('❌ No local stream available when creating peer connection!');
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('🎵 Received remote stream from user:', userId);
      console.log('🎵 Event streams:', event.streams?.length || 0);
      console.log('🎵 Track kind:', event.track.kind);
      console.log('� Track enabled:', event.track.enabled);
      console.log('🎵 Track readyState:', event.track.readyState);
      
      if (event.streams && event.streams[0]) {
        console.log('🔊 Setting up audio element for user:', userId);
        this.setupAudioElement(userId, event.streams[0]);
      } else {
        console.warn('⚠️ No streams in track event for user:', userId);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.currentChannelId) {
        console.log('🧊 Sending ICE candidate to user:', userId);
        socketService.sendVoiceChannelIceCandidate(
          this.currentChannelId,
          userId,
          event.candidate.toJSON()
        );
      }
    };

    // Handle connection state
    peerConnection.onconnectionstatechange = () => {
      console.log(`🔗 Connection state with ${userId}:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'connected') {
        console.log('✅ WebRTC connection established with user:', userId);
      } else if (peerConnection.connectionState === 'failed') {
        console.log('❌ Connection failed with user:', userId, 'attempting restart');
        peerConnection.restartIce();
      }
    };

    // Handle ICE connection state
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`🧊 ICE connection state with ${userId}:`, peerConnection.iceConnectionState);
    };

    // Create offer if we're the initiator (user with lower ID)
    const currentUserId = getCurrentUserId();
    const currentUserIdNum = parseInt(currentUserId);
    const targetUserIdNum = parseInt(userId);
    
    console.log('🔗 Checking if should create offer:', { 
      currentUserId, 
      targetUserId: userId,
      currentUserIdNum,
      targetUserIdNum,
      shouldCreateOffer: currentUserIdNum < targetUserIdNum,
      comparison: `${currentUserIdNum} < ${targetUserIdNum} = ${currentUserIdNum < targetUserIdNum}`
    });
    
    if (currentUserIdNum < targetUserIdNum) {
      console.log('📤 I will create offer for user:', userId);
      setTimeout(() => this.createOffer(userId), 1000);
    } else {
      console.log('⏳ I will wait for offer from user:', userId);
    }
  }

  private async createOffer(userId: string): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (!peerConnection || !this.currentChannelId) {
      console.error('❌ Cannot create offer: missing peer connection or channel ID');
      return;
    }

    try {
      console.log('📤 Creating offer for user:', userId);
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      
      console.log('📝 Setting local description (offer)');
      await peerConnection.setLocalDescription(offer);
      
      console.log('📡 Sending offer via socket to user:', userId);
      socketService.sendVoiceChannelOffer(this.currentChannelId, userId, offer);
      
      console.log('✅ Offer sent successfully to user:', userId);
    } catch (error) {
      console.error('❌ Error creating offer for user:', userId, error);
    }
  }

  async handleOffer(userId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    console.log('📥 Handling offer from user:', userId);
    
    let peerConnection = this.peerConnections.get(userId);
    
    if (!peerConnection) {
      console.log('🔗 No existing peer connection, creating new one for user:', userId);
      this.createPeerConnection(userId);
      peerConnection = this.peerConnections.get(userId);
    }
    
    if (!peerConnection || !this.currentChannelId) {
      console.error('❌ Cannot handle offer: missing peer connection or channel ID');
      return;
    }

    try {
      console.log('� Setting remote description (offer) from user:', userId);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      console.log('📝 Creating answer for user:', userId);
      const answer = await peerConnection.createAnswer();
      
      console.log('📝 Setting local description (answer)');
      await peerConnection.setLocalDescription(answer);
      
      console.log('📡 Sending answer via socket to user:', userId);
      socketService.sendVoiceChannelAnswer(this.currentChannelId, userId, answer);
      
      console.log('✅ Answer sent successfully to user:', userId);
    } catch (error) {
      console.error('❌ Error handling offer from user:', userId, error);
    }
  }

  async handleAnswer(userId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    console.log('� Handling answer from user:', userId);
    
    const peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) {
      console.error('❌ No peer connection found for user:', userId);
      return;
    }

    try {
      console.log('� Setting remote description (answer) from user:', userId);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Answer processed successfully from user:', userId);
    } catch (error) {
      console.error('❌ Error handling answer from user:', userId, error);
    }
  }

  async handleIceCandidate(userId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) return;

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('✅ ICE candidate added for user:', userId);
    } catch (error) {
      console.error('❌ Error adding ICE candidate for user:', userId, error);
    }
  }

  private setupAudioElement(userId: string, stream: MediaStream): void {
    console.log('� Setting up audio element for user:', userId);
    console.log('🔊 Stream info:', {
      id: stream.id,
      active: stream.active,
      audioTracks: stream.getAudioTracks().length,
      videoTracks: stream.getVideoTracks().length
    });
    
    // Log each audio track
    stream.getAudioTracks().forEach((track, index) => {
      console.log(`🎤 Remote audio track ${index}:`, {
        id: track.id,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        label: track.label
      });
    });
    
    // Remove existing audio element if any
    const existingAudio = this.audioElements.get(userId);
    if (existingAudio) {
      console.log('�️ Removing existing audio element for user:', userId);
      existingAudio.remove();
    }

    // Create new audio element
    const audio = document.createElement('audio');
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.muted = false;
    audio.volume = 1.0;
    
    // Add event listeners for debugging
    audio.onloadedmetadata = () => {
      console.log('🎵 Audio metadata loaded for user:', userId);
      console.log('🔊 Audio element state:', {
        muted: audio.muted,
        volume: audio.volume,
        paused: audio.paused,
        readyState: audio.readyState,
        networkState: audio.networkState
      });
    };
    
    audio.oncanplay = () => {
      console.log('🎵 Audio can play for user:', userId);
    };
    
    audio.onplay = () => {
      console.log('🎵 Audio started playing for user:', userId);
    };
    
    audio.onerror = (e) => {
      console.error('❌ Audio error for user:', userId, e);
    };
    
    // Add to DOM (hidden)
    audio.style.display = 'none';
    audio.id = `voice-audio-${userId}`;
    document.body.appendChild(audio);
    
    this.audioElements.set(userId, audio);
    
    console.log('🔊 Audio element created and added to DOM for user:', userId);
    
    // Play audio with error handling
    const playAudio = async () => {
      try {
        console.log('🎵 Attempting to play audio for user:', userId);
        await audio.play();
        console.log('✅ Audio playing successfully for user:', userId);
      } catch (err) {
        console.error('❌ Audio play failed for user:', userId, err);
        
        // Add user interaction handler as fallback
        const enableAudio = async () => {
          try {
            await audio.play();
            console.log('✅ Audio enabled after user interaction for user:', userId);
            document.removeEventListener('click', enableAudio);
          } catch (e) {
            console.error('❌ Audio failed even after user interaction for user:', userId, e);
          }
        };
        
        document.addEventListener('click', enableAudio, { once: true });
        console.log('� Added click listener for audio activation for user:', userId);
      }
    };
    
    // Wait for next tick to ensure DOM is ready
    setTimeout(playAudio, 100);
  }

  private closePeerConnection(userId: string): void {
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
    }

    // Remove audio element
    const audio = this.audioElements.get(userId);
    if (audio) {
      audio.remove();
      this.audioElements.delete(userId);
    }
  }

  private cleanup(): void {
    // Close all peer connections
    this.peerConnections.forEach((pc, userId) => {
      this.closePeerConnection(userId);
    });
    this.peerConnections.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Clear state
    this.currentChannelId = null;
    this.isConnected = false;
    this.users = [];
    
    this.notifyStateChange();
  }

  toggleMute(): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        
        // Notify other users
        if (this.currentChannelId) {
          socketService.setVoiceChannelMuted(this.currentChannelId, !audioTrack.enabled);
        }
        
        this.notifyStateChange();
      }
    }
  }

  toggleDeafen(): void {
    // Mute/unmute all remote audio elements
    this.audioElements.forEach(audio => {
      audio.muted = !audio.muted;
    });
    
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    const state: VoiceChannelState = {
      channelId: this.currentChannelId,
      isConnected: this.isConnected,
      users: this.users,
      isMuted: this.localStream ? !this.localStream.getAudioTracks()[0]?.enabled : false,
      isDeafened: Array.from(this.audioElements.values()).some(audio => audio.muted),
    };
    
    this.onStateChangeCallback?.(state);
  }

  // Callback setters
  onStateChange(callback: (state: VoiceChannelState) => void): void {
    this.onStateChangeCallback = callback;
  }

  onUserJoin(callback: (user: VoiceChannelUser) => void): void {
    this.onUserJoinCallback = callback;
  }

  onUserLeave(callback: (userId: string) => void): void {
    this.onUserLeaveCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  // Getters
  getCurrentChannelId(): string | null {
    return this.currentChannelId;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  getUsers(): VoiceChannelUser[] {
    return this.users;
  }
}

export const voiceChannelManager = new VoiceChannelManager();