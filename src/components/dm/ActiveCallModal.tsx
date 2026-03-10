import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

interface ActiveCallModalProps {
  isOpen: boolean;
  callType: 'voice' | 'video';
  friendUsername: string;
  isConnected: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | HTMLAudioElement>;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export default function ActiveCallModal({
  isOpen,
  callType,
  friendUsername,
  isConnected,
  isMuted,
  isVideoOff,
  localVideoRef,
  remoteVideoRef,
  onToggleMute,
  onToggleVideo,
  onEndCall,
}: ActiveCallModalProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [effectiveCallType, setEffectiveCallType] = useState(callType);

  useEffect(() => {
    if (!isConnected) {
      setCallDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Update effective call type based on actual video tracks
  useEffect(() => {
    if (isConnected && localVideoRef.current) {
      const localStream = localVideoRef.current.srcObject as MediaStream;
      if (localStream) {
        const hasVideo = localStream.getVideoTracks().length > 0;
        setEffectiveCallType(hasVideo ? 'video' : 'voice');
      }
    } else {
      setEffectiveCallType(callType);
    }
  }, [isConnected, callType]);

  // Log when the modal renders and ref status
  useEffect(() => {
    console.log('🎬 ActiveCallModal rendered:', {
      isOpen,
      callType,
      effectiveCallType,
      isConnected,
      hasRemoteVideoRef: !!remoteVideoRef.current
    });
  }, [isOpen, callType, effectiveCallType, isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onEndCall}>
      <DialogContent className="max-w-4xl h-[600px] p-0 overflow-hidden">
        <div className="relative h-full bg-discord-darkest flex flex-col">
          {/* Always render audio element for voice calls */}
          <audio
            ref={effectiveCallType === 'voice' ? (remoteVideoRef as React.RefObject<HTMLAudioElement>) : undefined}
            autoPlay
            playsInline
            controls={false}
            muted={false}
            style={{ display: 'none' }}
            onLoadedMetadata={() => {
              console.log('🎵 Audio metadata loaded');
              const audio = remoteVideoRef.current as HTMLAudioElement;
              if (audio) {
                console.log('🔊 Audio element state after metadata load:', {
                  muted: audio.muted,
                  volume: audio.volume,
                  paused: audio.paused,
                  hasStream: !!audio.srcObject,
                  readyState: audio.readyState
                });
              }
            }}
            onCanPlay={() => {
              console.log('🎵 Audio can play event');
              const audio = remoteVideoRef.current as HTMLAudioElement;
              if (audio) {
                audio.play().catch(err => console.error('🎵 Auto-play failed:', err));
              }
            }}
            onPlay={() => console.log('🎵 Audio started playing')}
            onPause={() => console.log('🎵 Audio paused')}
            onError={(e) => console.error('🎵 Audio error:', e)}
          />
          
          {/* Video Area */}
          <div className="flex-1 relative bg-black">
            {effectiveCallType === 'video' ? (
              <>
                {/* Remote Video (Main) */}
                <video
                  ref={remoteVideoRef as React.RefObject<HTMLVideoElement>}
                  autoPlay
                  playsInline
                  muted={false}
                  className="w-full h-full object-cover"
                  onLoadedMetadata={() => {
                    console.log('📹 Video metadata loaded');
                    const video = remoteVideoRef.current as HTMLVideoElement;
                    if (video) {
                      console.log('🔊 Video element state after metadata load:', {
                        muted: video.muted,
                        volume: video.volume,
                        paused: video.paused,
                        hasStream: !!video.srcObject,
                        readyState: video.readyState
                      });
                      
                      // Ensure video is not muted for audio
                      video.muted = false;
                      video.volume = 1.0;
                    }
                  }}
                  onCanPlay={() => {
                    console.log('📹 Video can play event');
                    const video = remoteVideoRef.current as HTMLVideoElement;
                    if (video) {
                      video.play().catch(err => console.error('📹 Video auto-play failed:', err));
                    }
                  }}
                  onPlay={() => console.log('📹 Video started playing')}
                  onPause={() => console.log('📹 Video paused')}
                  onError={(e) => console.error('📹 Video error:', e)}
                />

                {/* Local Video (Picture-in-Picture) */}
                <div className="absolute top-4 right-4 w-48 h-36 bg-discord-darker rounded-lg overflow-hidden border-2 border-discord-darkest">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                  {isVideoOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-discord-darker">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                        You
                      </div>
                    </div>
                  )}
                </div>

                {/* Remote video placeholder */}
                {!isConnected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-discord-darker">
                    <div className="text-center">
                      <div className="flex h-24 w-24 mx-auto mb-4 items-center justify-center rounded-full bg-primary text-4xl font-bold text-primary-foreground">
                        {friendUsername.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-lg text-muted-foreground">Connecting...</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Voice Call UI */
              <div className="flex items-center justify-center h-full bg-gradient-to-br from-discord-darker to-discord-darkest">
                <div className="text-center">
                  <div className="flex h-32 w-32 mx-auto mb-6 items-center justify-center rounded-full bg-primary text-5xl font-bold text-primary-foreground shadow-2xl">
                    {friendUsername.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{friendUsername}</h3>
                  <p className="text-lg text-muted-foreground">
                    {isConnected ? formatDuration(callDuration) : 'Connecting...'}
                  </p>
                  <div className="mt-6">
                    <Phone className="h-8 w-8 mx-auto text-green-500 animate-pulse" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Call Info Overlay (for video calls) */}
          {effectiveCallType === 'video' && (
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent">
              <div className="text-center text-white">
                <h3 className="text-xl font-bold">{friendUsername}</h3>
                <p className="text-sm opacity-90">
                  {isConnected ? formatDuration(callDuration) : 'Connecting...'}
                </p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="p-6 bg-discord-darker border-t border-discord-darkest">
            <div className="flex items-center justify-center gap-4">
              {/* Mute Button */}
              <Button
                onClick={onToggleMute}
                size="lg"
                variant={isMuted ? "destructive" : "secondary"}
                className="rounded-full h-14 w-14 p-0"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>

              {/* Audio Test Button (for debugging both voice and video calls) */}
              {(effectiveCallType === 'voice' || effectiveCallType === 'video') && (
                <Button
                  onClick={() => {
                    if (effectiveCallType === 'voice') {
                      const audio = remoteVideoRef.current as HTMLAudioElement;
                      if (audio) {
                        console.log('🔧 Manual audio test clicked');
                        console.log('🔊 Audio state before test:', {
                          muted: audio.muted,
                          volume: audio.volume,
                          paused: audio.paused,
                          hasStream: !!audio.srcObject,
                          readyState: audio.readyState,
                          networkState: audio.networkState,
                          currentTime: audio.currentTime,
                          duration: audio.duration
                        });
                        
                        // Check if stream has audio tracks
                        if (audio.srcObject) {
                          const stream = audio.srcObject as MediaStream;
                          console.log('🎵 Stream info:', {
                            id: stream.id,
                            active: stream.active,
                            audioTracks: stream.getAudioTracks().length,
                            videoTracks: stream.getVideoTracks().length
                          });
                          
                          console.log('🎵 Stream audio tracks:', stream.getAudioTracks().map(t => ({
                            id: t.id,
                            enabled: t.enabled,
                            muted: t.muted,
                            readyState: t.readyState,
                            label: t.label
                          })));
                          
                          // Try to unmute and enable tracks
                          stream.getAudioTracks().forEach(track => {
                            track.enabled = true;
                            console.log('🔧 Force enabled track:', track.id);
                          });
                        } else {
                          console.error('❌ No stream object on audio element!');
                        }
                        
                        // Reset audio element properties
                        audio.muted = false;
                        audio.volume = 1.0;
                        
                        // Try to play
                        audio.play().then(() => {
                          console.log('✅ Manual audio play successful');
                          console.log('🔊 Audio state after play:', {
                            muted: audio.muted,
                            volume: audio.volume,
                            paused: audio.paused,
                            currentTime: audio.currentTime
                          });
                        }).catch(err => {
                          console.error('❌ Manual audio play failed:', err);
                        });
                      } else {
                        console.error('❌ No audio element found!');
                      }
                    } else {
                      // Video call audio test
                      const video = remoteVideoRef.current as HTMLVideoElement;
                      if (video) {
                        console.log('🔧 Manual video audio test clicked');
                        console.log('🔊 Video element audio state before test:', {
                          muted: video.muted,
                          volume: video.volume,
                          paused: video.paused,
                          hasStream: !!video.srcObject,
                          readyState: video.readyState,
                          networkState: video.networkState,
                          currentTime: video.currentTime,
                          duration: video.duration
                        });
                        
                        // Check if stream has audio tracks
                        if (video.srcObject) {
                          const stream = video.srcObject as MediaStream;
                          console.log('🎵 Video stream info:', {
                            id: stream.id,
                            active: stream.active,
                            audioTracks: stream.getAudioTracks().length,
                            videoTracks: stream.getVideoTracks().length
                          });
                          
                          console.log('🎵 Video stream audio tracks:', stream.getAudioTracks().map(t => ({
                            id: t.id,
                            enabled: t.enabled,
                            muted: t.muted,
                            readyState: t.readyState,
                            label: t.label
                          })));
                          
                          // Try to unmute and enable tracks
                          stream.getAudioTracks().forEach(track => {
                            track.enabled = true;
                            console.log('🔧 Force enabled video audio track:', track.id);
                          });
                        } else {
                          console.error('❌ No stream object on video element!');
                        }
                        
                        // Reset video element audio properties
                        video.muted = false;
                        video.volume = 1.0;
                        
                        // Try to play
                        video.play().then(() => {
                          console.log('✅ Manual video play successful');
                          console.log('🔊 Video audio state after play:', {
                            muted: video.muted,
                            volume: video.volume,
                            paused: video.paused,
                            currentTime: video.currentTime
                          });
                        }).catch(err => {
                          console.error('❌ Manual video play failed:', err);
                        });
                      } else {
                        console.error('❌ No video element found!');
                      }
                    }
                  }}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  🔊 Test Audio
                </Button>
              )}

              {/* Video Toggle (only for video calls) */}
              {effectiveCallType === 'video' && (
                <Button
                  onClick={onToggleVideo}
                  size="lg"
                  variant={isVideoOff ? "destructive" : "secondary"}
                  className="rounded-full h-14 w-14 p-0"
                  title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                >
                  {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                </Button>
              )}

              {/* End Call Button */}
              <Button
                onClick={onEndCall}
                size="lg"
                variant="destructive"
                className="rounded-full h-14 w-14 p-0"
                title="End call"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
