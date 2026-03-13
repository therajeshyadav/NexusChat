import { useState, useEffect, useRef } from 'react';
import { socketService } from '@/services/socket';
import { webrtcManager, CallType, CallState } from '@/services/webrtc';
import { toast } from 'sonner';

interface CallInfo {
  friendId: number;
  friendUsername: string;
  callType: CallType;
}

export function useCall() {
  const [callState, setCallState] = useState<CallState>('idle');
  const [currentCall, setCurrentCall] = useState<CallInfo | null>(null);
  const [isIncoming, setIsIncoming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  console.log('🎯 useCall hook initialized, socket connected:', socketService.isConnected());

  useEffect(() => {
    console.log('🎯 Setting up call listeners...');
    console.log('🔌 Socket connected status:', socketService.isConnected());
    
    // Wait for socket to connect before setting up listeners
    const setupListeners = () => {
      console.log('🔌 Socket is now connected, setting up call listeners');
      
      // DON'T clear call events - WebRTCManager needs those listeners!
      // socketService.offCallEvents();
      
      // Handle incoming call
      const handleIncomingCall = ({ from, username, callType }: { from: string; username: string; callType: string }) => {
        console.log('📞 Incoming call handler triggered:', { from, username, callType });
        console.log('📞 Current state before update:', { callState, currentCall, isIncoming });
        
        setCurrentCall({
          friendId: parseInt(from),
          friendUsername: username,
          callType: callType as CallType,
        });
        setIsIncoming(true);
        setCallState('ringing');
        
        console.log('📞 State updated for incoming call');
      };
      
      socketService.onCallIncoming(handleIncomingCall);

      // Handle call rejected
      socketService.onCallRejected(() => {
        console.log('❌ Call was rejected');
        toast.error('Call was rejected');
        endCall();
      });

      // Handle user offline
      socketService.onCallUserOffline(() => {
        console.log('❌ User is offline');
        toast.error('User is offline');
        endCall();
      });

      // Handle user busy
      socketService.onCallUserBusy(() => {
        console.log('❌ User is busy');
        toast.error('User is busy on another call');
        endCall();
      });

      // Handle already in call
      socketService.onCallAlreadyInCall(() => {
        console.log('❌ Already in a call');
        toast.error('You are already in a call');
      });
    };
    
    // Setup WebRTC callbacks - ONLY ONCE per component mount
    console.log('🔧 Registering WebRTC callbacks in useCall');
    
    // Use custom events to communicate between WebRTC and UI
    const handleRemoteStream = (event: CustomEvent) => {
      const stream = event.detail;
      console.log('🎵 Remote stream received via custom event');
      console.log('🎤 Remote stream audio tracks:', stream.getAudioTracks().length);
      console.log('📹 Remote stream video tracks:', stream.getVideoTracks().length);
      
      setRemoteStream(stream);
      setCallState('connected');
      
      console.log('✅ Call state set to connected via custom event');
    };
    
    const handleCallEnd = () => {
      console.log('📞 Call end received via custom event');
      endCall();
    };
    
    const handleCallError = (event: CustomEvent) => {
      console.log('❌ Call error received via custom event:', event.detail);
      
      // Check if this is a camera fallback notification (not an error that should end the call)
      if (event.detail.includes('Camera is busy. Switched to audio-only call.')) {
        toast.info(event.detail);
        // Update call type if WebRTC fell back to audio-only
        const newCallType = webrtcManager.getCallType();
        if (currentCall && currentCall.callType !== newCallType) {
          setCurrentCall(prev => prev ? { ...prev, callType: newCallType } : null);
        }
      } else {
        toast.error(event.detail);
        endCall();
      }
    };
    
    // Listen for custom events
    window.addEventListener('webrtc-remote-stream', handleRemoteStream as EventListener);
    window.addEventListener('webrtc-call-end', handleCallEnd);
    window.addEventListener('webrtc-call-error', handleCallError as EventListener);
    
    // Register WebRTC callbacks to emit custom events
    webrtcManager.onRemoteStream((stream) => {
      console.log('🎵 WebRTC onRemoteStream - emitting custom event');
      window.dispatchEvent(new CustomEvent('webrtc-remote-stream', { detail: stream }));
    });

    webrtcManager.onCallEnd(() => {
      console.log('📞 WebRTC onCallEnd - emitting custom event');
      window.dispatchEvent(new CustomEvent('webrtc-call-end'));
    });

    webrtcManager.onError((error) => {
      console.log('❌ WebRTC onError - emitting custom event');
      window.dispatchEvent(new CustomEvent('webrtc-call-error', { detail: error }));
    });
    
    console.log('✅ WebRTC callbacks registered');
    
    // Listen for socket connection event
    const handleSocketConnected = () => {
      console.log('✅ Socket connected event received, setting up listeners');
      setupListeners();
    };
    
    // If socket is already connected, setup immediately
    if (socketService.isConnected()) {
      setupListeners();
    }
    
    // Listen for socket reconnection
    window.addEventListener('socket-connected', handleSocketConnected);

    return () => {
      console.log('🧹 Cleaning up call listeners');
      window.removeEventListener('socket-connected', handleSocketConnected);
      window.removeEventListener('webrtc-remote-stream', handleRemoteStream as EventListener);
      window.removeEventListener('webrtc-call-end', handleCallEnd);
      window.removeEventListener('webrtc-call-error', handleCallError as EventListener);
      // DON'T call offCallEvents() - let handlers persist
      // socketService.offCallEvents();
      // DON'T destroy webrtcManager - it's a singleton that should persist
      // webrtcManager.destroy();
    };
  }, []); // Empty dependency array - setup once on mount

  // Update local video when stream is available
  useEffect(() => {
    if (callState === 'calling' || callState === 'connected') {
      const localStream = webrtcManager.getLocalStream();
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        console.log('✅ Local video stream assigned');
      }
    }
  }, [callState]);

  // Force video element to be ready for video calls
  useEffect(() => {
    if (currentCall?.callType === 'video' && callState === 'connected') {
      // Ensure video element is mounted and ready
      const checkVideoElement = () => {
        if (remoteVideoRef.current) {
          console.log('✅ Video element is ready for stream assignment');
          const videoElement = remoteVideoRef.current as HTMLVideoElement;
          
          // If stream is already available but not assigned, assign it
          if (remoteStream && !videoElement.srcObject) {
            console.log('🔧 Assigning existing stream to video element');
            videoElement.srcObject = remoteStream;
            videoElement.muted = false;
            videoElement.volume = 1.0;
            videoElement.play().catch(err => console.error('Video play error:', err));
          }
        } else {
          console.log('⚠️ Video element not ready, checking again...');
          setTimeout(checkVideoElement, 50);
        }
      };
      
      checkVideoElement();
    }
  }, [currentCall?.callType, callState, remoteStream]);

  // Update remote audio/video when stream is available
  useEffect(() => {
    console.log('🎵 useEffect triggered for remoteStream:', !!remoteStream);
    console.log('🎵 remoteVideoRef.current:', !!remoteVideoRef.current);
    console.log('🎵 currentCall?.callType:', currentCall?.callType);
    
    if (remoteStream && currentCall) {
      // For voice calls, we need to wait for the audio element to be ready
      if (currentCall.callType === 'voice') {
        const assignAudioStream = () => {
          const audioElement = remoteVideoRef.current as HTMLAudioElement;
          if (audioElement) {
            console.log('🎵 Setting remote stream to audio element');
            console.log('🎵 Remote stream tracks:', remoteStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, muted: t.muted })));
            
            // IMPORTANT: Unmute all remote audio tracks first
            remoteStream.getAudioTracks().forEach(track => {
              console.log('🔧 Unmuting remote audio track:', track.id);
              track.enabled = true;
            });
            
            audioElement.srcObject = remoteStream;
            audioElement.muted = false;
            audioElement.volume = 1.0;
            
            console.log('🔊 Audio element setup:', {
              muted: audioElement.muted,
              volume: audioElement.volume,
              autoplay: audioElement.autoplay,
              hasStream: !!audioElement.srcObject
            });
            
            // Force play immediately
            const playAudio = async () => {
              try {
                console.log('🎵 Attempting immediate audio play');
                await audioElement.play();
                console.log('✅ Audio element playing successfully');
              } catch (err) {
                console.error('❌ Audio play error:', err);
                
                // Try again after a short delay
                setTimeout(async () => {
                  try {
                    console.log('🔄 Retrying audio play after delay');
                    await audioElement.play();
                    console.log('✅ Audio play retry successful');
                  } catch (retryErr) {
                    console.error('❌ Audio retry failed:', retryErr);
                    
                    // Add user interaction handler as fallback
                    const enableAudio = async () => {
                      try {
                        await audioElement.play();
                        console.log('✅ Audio enabled after user interaction');
                        document.removeEventListener('click', enableAudio);
                      } catch (e) {
                        console.error('❌ Audio failed even after user interaction:', e);
                      }
                    };
                    
                    document.addEventListener('click', enableAudio, { once: true });
                    console.log('🔧 Added click listener for audio activation');
                  }
                }, 100);
              }
            };
            
            // Wait for next tick to ensure DOM is ready
            setTimeout(playAudio, 0);
          } else {
            console.log('⚠️ Audio element not ready, retrying in 100ms...');
            setTimeout(assignAudioStream, 100);
          }
        };
        
        // Start trying to assign the stream
        assignAudioStream();
      } else if (currentCall.callType === 'video') {
        // For video calls, assign to video element AND ensure audio tracks are enabled
        const assignVideoStream = () => {
          const videoElement = remoteVideoRef.current as HTMLVideoElement;
          if (videoElement) {
            console.log('🎵 Setting remote stream to video element for video call');
            console.log('🎵 Remote stream tracks:', remoteStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, muted: t.muted })));
            
            // IMPORTANT: Unmute all remote audio tracks for video calls too
            remoteStream.getAudioTracks().forEach(track => {
              console.log('🔧 Unmuting remote audio track in video call:', track.id);
              track.enabled = true;
            });
            
            // IMPORTANT: Enable all video tracks
            remoteStream.getVideoTracks().forEach(track => {
              console.log('🔧 Enabling remote video track in video call:', track.id);
              track.enabled = true;
            });
            
            videoElement.srcObject = remoteStream;
            videoElement.muted = false; // CRITICAL: Don't mute video element for audio
            videoElement.volume = 1.0;
            
            console.log('🔊 Video element audio setup:', {
              muted: videoElement.muted,
              volume: videoElement.volume,
              autoplay: videoElement.autoplay,
              hasStream: !!videoElement.srcObject,
              audioTracks: remoteStream.getAudioTracks().length,
              videoTracks: remoteStream.getVideoTracks().length
            });
            
            // Force play video (which includes audio)
            const playVideo = async () => {
              try {
                console.log('🎵 Attempting video play (with audio)');
                await videoElement.play();
                console.log('✅ Video element playing successfully with audio');
              } catch (err) {
                console.error('❌ Video play error:', err);
                
                // Retry after short delay
                setTimeout(async () => {
                  try {
                    console.log('🔄 Retrying video play');
                    await videoElement.play();
                    console.log('✅ Video play retry successful');
                  } catch (retryErr) {
                    console.error('❌ Video retry failed:', retryErr);
                    
                    // Add user interaction handler as fallback
                    const enableVideo = async () => {
                      try {
                        await videoElement.play();
                        console.log('✅ Video enabled after user interaction');
                        document.removeEventListener('click', enableVideo);
                      } catch (e) {
                        console.error('❌ Video failed even after user interaction:', e);
                      }
                    };
                    
                    document.addEventListener('click', enableVideo, { once: true });
                    console.log('🔧 Added click listener for video activation');
                  }
                }, 100);
              }
            };
            
            // Wait for next tick to ensure DOM is ready
            setTimeout(playVideo, 0);
          } else {
            console.log('⚠️ Video element not ready, retrying in 100ms...');
            setTimeout(assignVideoStream, 100);
          }
        };
        
        // Start trying to assign the stream
        assignVideoStream();
      }
    } else {
      console.log('🎵 useEffect conditions not met:', {
        hasRemoteStream: !!remoteStream,
        hasCurrentCall: !!currentCall,
        callType: currentCall?.callType
      });
    }
  }, [remoteStream, currentCall?.callType, callState]); // Add callState to dependencies

  const startCall = async (friendId: number, friendUsername: string, callType: CallType) => {
    try {
      console.log('Starting call:', { friendId, friendUsername, callType });
      
      setCurrentCall({ friendId, friendUsername, callType });
      setIsIncoming(false);
      setCallState('calling');

      socketService.initCall(friendId, callType);
      await webrtcManager.startCall(friendId, callType);
      
      console.log('Call started successfully');
    } catch (error) {
      console.error('Failed to start call:', error);
      endCall();
    }
  };

  const answerCall = async () => {
    if (!currentCall) return;

    try {
      console.log('📞 Answering call from:', currentCall.friendUsername);
      setIsIncoming(false); // Clear incoming state FIRST
      setCallState('calling'); // Show "connecting" state
      await webrtcManager.answerCall(currentCall.friendId, currentCall.callType);
      console.log('✅ Call answered successfully');
    } catch (error) {
      console.error('Failed to answer call:', error);
      endCall();
    }
  };

  const rejectCall = () => {
    console.log('❌ Rejecting call');
    if (currentCall) {
      socketService.rejectCall(currentCall.friendId);
    }
    endCall();
  };

  const endCall = () => {
    console.log('📞 Ending call, current state:', { callState, hasCurrentCall: !!currentCall, isIncoming });
    
    // DON'T clear callbacks - they should persist for future calls
    // webrtcManager.onCallEnd(() => {});
    // webrtcManager.onError(() => {});
    
    // Cleanup WebRTC (this will also send socket event if needed)
    webrtcManager.endCall();
    
    // Reset all state
    setCallState('idle');
    setCurrentCall(null);
    setIsIncoming(false);
    setIsMuted(false);
    setIsVideoOff(false);
    setRemoteStream(null);

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    webrtcManager.toggleAudio(!newMuted);
    setIsMuted(newMuted);
  };

  const toggleVideo = () => {
    const newVideoOff = !isVideoOff;
    webrtcManager.toggleVideo(!newVideoOff);
    setIsVideoOff(newVideoOff);
  };

  return {
    callState,
    currentCall,
    isIncoming,
    isMuted,
    isVideoOff,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };
}
