import { socketService } from './socket';

export type CallType = 'voice' | 'video';
export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

interface CallConfig {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize?: number;
  iceTransportPolicy?: RTCIceTransportPolicy;
}

const DEFAULT_CONFIG: CallConfig = {
  iceServers: [
    // Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Additional STUN servers for better connectivity
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.nextcloud.com:443' },
    
    // Multiple TURN servers for better connectivity
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
    
    // Additional TURN servers
    {
      urls: 'turn:relay1.expressturn.com:3478',
      username: 'ef3CYGPKLM2X2LC40V',
      credential: 'Hj8pDKpz92KmF5r6',
    },
  ],
  // Enhanced configuration for mobile networks and same-machine testing
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all' as RTCIceTransportPolicy,
};

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private friendId: number | null = null;
  private callType: CallType = 'voice';
  private isCleaningUp: boolean = false; // Flag to prevent infinite loops
  
  // Queue for offer that arrives before answerCall()
  private pendingOffer: RTCSessionDescriptionInit | null = null;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];

  // Callbacks
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onCallEndCallback?: () => void;
  private onErrorCallback?: (error: string) => void;

  constructor() {
    console.log('🔧 WebRTCManager: Constructor called, setting up socket listeners');
    
    // Setup listeners immediately (in case socket is already connected)
    this.setupSocketListeners();
    
    // Also setup listeners when socket connects/reconnects
    if (typeof window !== 'undefined') {
      window.addEventListener('socket-connected', () => {
        console.log('🔧 WebRTCManager: Socket reconnected, re-setting up listeners');
        this.setupSocketListeners();
      });
    }
    
    console.log('🔧 WebRTCManager: Socket listeners setup complete');
  }

  private setupSocketListeners() {
    console.log('🔧 WebRTCManager: Setting up socket listeners');
    
    // DON'T remove old listeners - they should persist
    // socketService.offCallEvents();
    
    // Handle incoming call offer
    socketService.onCallOffer(async ({ from, offer }) => {
      console.log('📥 Offer received from:', from, 'current friendId:', this.friendId);
      
      // Don't check friendId here - it might not be set yet when offer arrives
      // The offer comes BEFORE answerCall() is called
      
      try {
        await this.handleOffer(offer);
      } catch (error) {
        console.error('Error handling offer:', error);
        this.onErrorCallback?.('Failed to handle call offer');
      }
    });

    // Handle call answer
    socketService.onCallAnswer(async ({ from, answer }) => {
      console.log('📥 Answer received from:', from, 'current friendId:', this.friendId);
      
      if (this.friendId?.toString() !== from) {
        console.warn('⚠️ Answer from wrong user, ignoring');
        return;
      }
      
      try {
        await this.handleAnswer(answer);
      } catch (error) {
        console.error('Error handling answer:', error);
        this.onErrorCallback?.('Failed to handle call answer');
      }
    });

    // Handle ICE candidate
    socketService.onCallIceCandidate(async ({ from, candidate }) => {
      // Don't check friendId - ICE candidates can arrive before friendId is set
      
      try {
        await this.handleIceCandidate(candidate);
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    // Handle call end
    socketService.onCallEnd(() => {
      console.log('📞 dm_call_end event received - remote user ended call');
      if (this.isCleaningUp) {
        console.log('⚠️ Already cleaning up, ignoring');
        return;
      }
      // Don't send socket event again, just cleanup and notify UI
      this.cleanup();
      this.onCallEndCallback?.();
    });

    // Handle user disconnected
    socketService.onCallUserDisconnected(() => {
      console.log('📞 User disconnected - ending call');
      if (this.isCleaningUp) {
        console.log('⚠️ Already cleaning up, ignoring');
        return;
      }
      this.cleanup();
      this.onCallEndCallback?.();
    });
    
    console.log('✅ WebRTCManager: Socket listeners registered');
  }

  async startCall(friendId: number, callType: CallType): Promise<void> {
    this.friendId = friendId;
    this.callType = callType;

    try {
      console.log('📞 Starting call to:', friendId, 'type:', callType);
      
      // Get local media stream
      await this.initializeLocalStream(callType);

      // Create peer connection
      this.createPeerConnection();

      // Add local stream to peer connection
      if (this.localStream) {
        console.log('🎤 Adding local tracks to peer connection');
        this.localStream.getTracks().forEach(track => {
          console.log('➕ Adding track:', track.kind, 'enabled:', track.enabled);
          this.peerConnection?.addTrack(track, this.localStream!);
        });
      }

      // Create and send offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      
      console.log('📤 Sending call offer');
      socketService.sendCallOffer(friendId, offer);
    } catch (error) {
      console.error('Error starting call:', error);
      this.onErrorCallback?.('Failed to start call. Please check your camera/microphone permissions.');
      this.cleanup();
      throw error;
    }
  }

  async answerCall(friendId: number, callType: CallType): Promise<void> {
    this.friendId = friendId;
    this.callType = callType;

    try {
      console.log('📞 Answering call from:', friendId, 'type:', callType);
      
      // Get local media stream FIRST
      await this.initializeLocalStream(callType);

      // Create peer connection AFTER getting local stream
      this.createPeerConnection();

      // Add local stream to peer connection
      if (this.localStream) {
        console.log('🎤 Adding local tracks to peer connection');
        this.localStream.getTracks().forEach(track => {
          console.log('➕ Adding track:', track.kind, 'enabled:', track.enabled);
          this.peerConnection?.addTrack(track, this.localStream!);
        });
      }
      
      // Process pending offer if it arrived before answerCall()
      if (this.pendingOffer) {
        console.log('📥 Processing pending offer');
        await this.handleOffer(this.pendingOffer);
        this.pendingOffer = null;
      }
      
      // Process pending ICE candidates
      if (this.pendingIceCandidates.length > 0) {
        console.log(`📥 Processing ${this.pendingIceCandidates.length} pending ICE candidates`);
        for (const candidate of this.pendingIceCandidates) {
          await this.handleIceCandidate(candidate);
        }
        this.pendingIceCandidates = [];
      }
      
      console.log('✅ Answer call setup complete');
    } catch (error) {
      console.error('Error answering call:', error);
      this.onErrorCallback?.('Failed to answer call. Please check your camera/microphone permissions.');
      this.cleanup();
      throw error;
    }
  }

  private async initializeLocalStream(callType: CallType): Promise<void> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: callType === 'video' ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      } : false,
    };

    try {
      console.log('🎤 Requesting media access:', constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Media access granted');
      console.log('🎤 Audio tracks:', this.localStream.getAudioTracks().length);
      console.log('📹 Video tracks:', this.localStream.getVideoTracks().length);
      
      // Ensure audio tracks are enabled and log their state
      this.localStream.getAudioTracks().forEach((track, index) => {
        track.enabled = true;
        console.log(`🎤 Local audio track ${index}:`, {
          id: track.id,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          label: track.label
        });
      });

      // Log video tracks if video call
      if (callType === 'video') {
        this.localStream.getVideoTracks().forEach((track, index) => {
          track.enabled = true;
          console.log(`📹 Local video track ${index}:`, {
            id: track.id,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            label: track.label
          });
        });
      }
      
    } catch (error) {
      console.error('❌ Error getting local stream:', error);
      
      // More specific error handling
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera/microphone access denied. Please allow permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera/microphone found. Please check your devices.');
      } else if (error.name === 'NotReadableError') {
        if (callType === 'video') {
          // Fallback to audio-only if camera is busy
          console.log('📹 Camera busy, falling back to audio-only call');
          const audioOnlyConstraints: MediaStreamConstraints = {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          };
          
          try {
            this.localStream = await navigator.mediaDevices.getUserMedia(audioOnlyConstraints);
            console.log('✅ Fallback to audio-only successful');
            // Update call type to voice
            this.callType = 'voice';
            
            // Notify user about the fallback
            this.onErrorCallback?.('Camera is busy. Switched to audio-only call.');
            return;
          } catch (audioError) {
            console.error('❌ Audio fallback also failed:', audioError);
            throw new Error('Camera is busy and microphone is also unavailable. Please close other apps and try again.');
          }
        } else {
          throw new Error('Microphone is busy. Please close other apps and try again.');
        }
      } else if (error.name === 'AbortError') {
        throw new Error('Media access was interrupted. Please try again.');
      } else if (error.name === 'OverconstrainedError') {
        // Try with less strict constraints
        console.log('📹 Constraints too strict, trying with basic settings');
        const basicConstraints: MediaStreamConstraints = {
          audio: true,
          video: callType === 'video' ? true : false,
        };
        
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
          console.log('✅ Basic constraints successful');
          return;
        } catch (basicError) {
          throw new Error('Your device does not support the required media settings.');
        }
      } else {
        throw new Error(`Could not access ${callType === 'video' ? 'camera/microphone' : 'microphone'}: ${error.message}`);
      }
    }
  }

  private createPeerConnection(): void {
    console.log('🔧 Creating peer connection, callbacks registered:', {
      onRemoteStream: !!this.onRemoteStreamCallback,
      onCallEnd: !!this.onCallEndCallback,
      onError: !!this.onErrorCallback
    });
    
    // Enhanced configuration for local and mobile network testing
    const config = {
      ...DEFAULT_CONFIG,
      // Allow local candidates for same-machine testing
      bundlePolicy: 'max-bundle' as RTCBundlePolicy,
      rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
      // Force relay candidates for better mobile network compatibility
      iceTransportPolicy: 'all' as RTCIceTransportPolicy,
    };
    
    console.log('🔧 Using WebRTC config:', config);
    
    this.peerConnection = new RTCPeerConnection(config);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.friendId) {
        console.log('🧊 Sending ICE candidate');
        socketService.sendIceCandidate(this.friendId, event.candidate.toJSON());
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('🎵 Remote track received:', event.track.kind);
      console.log('🎵 Track enabled:', event.track.enabled);
      console.log('🎵 Track readyState:', event.track.readyState);
      console.log('🎵 Has onRemoteStreamCallback:', !!this.onRemoteStreamCallback);
      
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        console.log('✅ Remote stream set');
        console.log('🎤 Remote audio tracks:', this.remoteStream.getAudioTracks().length);
        console.log('📹 Remote video tracks:', this.remoteStream.getVideoTracks().length);
        
        // Log each audio track and ensure they're enabled
        this.remoteStream.getAudioTracks().forEach((track, index) => {
          console.log(`🎤 Audio track ${index}:`, {
            id: track.id,
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState
          });
          
          // Force enable the track
          track.enabled = true;
          console.log(`🔧 Force enabled audio track ${index}`);
        });
        
        if (this.onRemoteStreamCallback) {
          console.log('📞 Calling onRemoteStreamCallback');
          this.onRemoteStreamCallback(this.remoteStream);
        } else {
          console.error('❌ No onRemoteStreamCallback registered!');
        }
      } else {
        console.warn('⚠️ No streams in track event');
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log('🧊 ICE connection state:', state);
      
      if (state === 'failed') {
        console.log('❌ ICE connection failed, attempting restart');
        // Try to restart ICE
        this.peerConnection?.restartIce();
      } else if (state === 'disconnected') {
        console.log('⚠️ ICE connection disconnected, waiting for reconnection...');
        // Don't immediately end call, wait for potential reconnection
      } else if (state === 'connected' || state === 'completed') {
        console.log('✅ ICE connection established successfully');
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('🔗 Connection state:', state);

      if (state === 'failed') {
        console.log('❌ Connection failed, attempting to restart ICE');
        // Try to restart ICE
        this.peerConnection?.restartIce();
      } else if (state === 'disconnected') {
        console.log('⚠️ Connection disconnected, waiting for reconnection...');
        // Wait a bit before ending call in case it reconnects
        setTimeout(() => {
          if (this.peerConnection?.connectionState === 'disconnected') {
            console.log('❌ Connection still disconnected after timeout, ending call');
            this.endCall();
          }
        }, 5000);
      } else if (state === 'closed') {
        this.endCall();
      }
    };
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    console.log('📥 Handling offer');
    
    if (!this.peerConnection) {
      console.warn('⚠️ No peer connection yet, storing offer for later');
      this.pendingOffer = offer;
      return;
    }

    console.log('📝 Setting remote description (offer)');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    console.log('📝 Creating answer');
    const answer = await this.peerConnection.createAnswer();
    
    console.log('📝 Setting local description (answer)');
    await this.peerConnection.setLocalDescription(answer);
    
    if (this.friendId) {
      console.log('📤 Sending answer to friend:', this.friendId);
      socketService.sendCallAnswer(this.friendId, answer);
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    console.log('📥 Handling answer');
    
    if (!this.peerConnection) {
      console.error('❌ No peer connection when handling answer!');
      return;
    }

    console.log('📝 Setting remote description (answer)');
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log('✅ Answer processed successfully');
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      console.warn('⚠️ No peer connection yet, storing ICE candidate for later');
      this.pendingIceCandidates.push(candidate);
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('✅ ICE candidate added');
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  }

  endCall(): void {
    console.log('📞 WebRTCManager.endCall() called, isCleaningUp:', this.isCleaningUp);
    
    if (this.isCleaningUp) {
      console.log('⚠️ Already cleaning up, ignoring duplicate endCall');
      return;
    }
    
    this.isCleaningUp = true;
    const hadConnection = this.friendId && this.peerConnection;
    
    // Send socket event only if we have a friendId and haven't cleaned up yet
    if (hadConnection) {
      console.log('📤 Sending dm_call_end to friend:', this.friendId);
      socketService.endCall(this.friendId!);
    }

    this.cleanup();
    
    // Call the callback AFTER cleanup
    if (hadConnection && this.onCallEndCallback) {
      console.log('📞 Calling onCallEndCallback');
      this.onCallEndCallback();
    }
    
    this.isCleaningUp = false;
  }

  private cleanup(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.friendId = null;
    this.pendingOffer = null;
    this.pendingIceCandidates = [];
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  getCallType(): CallType {
    return this.callType;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  onRemoteStream(callback: (stream: MediaStream) => void): void {
    console.log('🔧 WebRTCManager: Registering onRemoteStream callback');
    this.onRemoteStreamCallback = callback;
  }

  onCallEnd(callback: () => void): void {
    console.log('🔧 WebRTCManager: Registering onCallEnd callback');
    this.onCallEndCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    console.log('🔧 WebRTCManager: Registering onError callback');
    this.onErrorCallback = callback;
  }

  destroy(): void {
    this.cleanup();
    socketService.offCallEvents();
  }
}

export const webrtcManager = new WebRTCManager();
