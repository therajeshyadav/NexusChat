import { Volume2, Mic, MicOff, Headphones, HeadphonesIcon, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Channel } from "@/types/chat";
import { VoiceChannelState } from "@/services/voiceChannel";

interface VoiceChannelAreaProps {
  channel: Channel;
  voiceState: VoiceChannelState;
  onJoinChannel: () => void;
  onLeaveChannel: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
}

export default function VoiceChannelArea({
  channel,
  voiceState,
  onJoinChannel,
  onLeaveChannel,
  onToggleMute,
  onToggleDeafen,
}: VoiceChannelAreaProps) {
  const isConnectedToThisChannel = voiceState.channelId === channel._id;

  return (
    <div className="flex h-full flex-1 flex-col bg-discord-chat-bg">
      {/* Channel header */}
      <div className="flex h-12 items-center justify-between border-b border-discord-darkest px-4">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold text-foreground">{channel.name}</span>
          {isConnectedToThisChannel && (
            <span className="text-xs text-green-400">
              ({voiceState.users.length + 1} connected)
            </span>
          )}
        </div>
      </div>

      {/* Voice Channel Content */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        {!isConnectedToThisChannel ? (
          /* Not Connected State */
          <div className="text-center">
            <div className="mb-6 flex h-24 w-24 mx-auto items-center justify-center rounded-full bg-discord-hover">
              <Volume2 className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {channel.name}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              This is a voice channel. Click the button below to join and start talking with others!
            </p>
            <Button
              onClick={onJoinChannel}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              <Volume2 className="mr-2 h-5 w-5" />
              Join Voice Channel
            </Button>
          </div>
        ) : (
          /* Connected State */
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="mb-4 flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-green-600">
                <Volume2 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Connected to {channel.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {voiceState.users.length + 1} user{voiceState.users.length !== 0 ? 's' : ''} in channel
              </p>
            </div>

            {/* Connected Users List */}
            <div className="mb-6 space-y-2">
              {/* Current User */}
              <div className="flex items-center gap-3 rounded-lg bg-discord-hover p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  You
                </div>
                <span className="flex-1 text-foreground">You</span>
                {voiceState.isMuted && <MicOff className="h-4 w-4 text-red-500" />}
              </div>

              {/* Other Users */}
              {voiceState.users.map((user) => (
                <div key={user.userId} className="flex items-center gap-3 rounded-lg bg-discord-hover p-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-primary-foreground ${
                    user.isSpeaking ? 'bg-green-500' : 'bg-discord-darker'
                  }`}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className={`flex-1 ${user.isMuted ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {user.username}
                  </span>
                  {user.isMuted && <MicOff className="h-4 w-4 text-red-500" />}
                </div>
              ))}
            </div>

            {/* Voice Controls */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={onToggleMute}
                  variant={voiceState.isMuted ? "destructive" : "secondary"}
                  className="flex-1"
                >
                  {voiceState.isMuted ? (
                    <>
                      <MicOff className="mr-2 h-4 w-4" />
                      Unmute
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      Mute
                    </>
                  )}
                </Button>

                <Button
                  onClick={onToggleDeafen}
                  variant={voiceState.isDeafened ? "destructive" : "secondary"}
                  className="flex-1"
                >
                  {voiceState.isDeafened ? (
                    <>
                      <HeadphonesIcon className="mr-2 h-4 w-4" />
                      Undeafen
                    </>
                  ) : (
                    <>
                      <Headphones className="mr-2 h-4 w-4" />
                      Deafen
                    </>
                  )}
                </Button>
              </div>

              <Button
                onClick={onLeaveChannel}
                variant="destructive"
                className="w-full"
              >
                <PhoneOff className="mr-2 h-4 w-4" />
                Leave Voice Channel
              </Button>

              {/* Debug Button */}
              <Button
                onClick={() => {
                  console.log('🔧 Voice Channel Debug Info:');
                  console.log('- Voice State:', voiceState);
                  console.log('- Audio Elements:', document.querySelectorAll('audio[id^="voice-audio-"]'));
                  console.log('- Local Stream:', navigator.mediaDevices.getUserMedia);
                  
                  // Test audio elements
                  document.querySelectorAll('audio[id^="voice-audio-"]').forEach((audio: any, index) => {
                    console.log(`🔊 Audio Element ${index}:`, {
                      id: audio.id,
                      muted: audio.muted,
                      volume: audio.volume,
                      paused: audio.paused,
                      readyState: audio.readyState,
                      hasStream: !!audio.srcObject
                    });
                    
                    if (audio.srcObject) {
                      const stream = audio.srcObject as MediaStream;
                      console.log(`🎵 Stream ${index}:`, {
                        active: stream.active,
                        audioTracks: stream.getAudioTracks().length,
                        tracks: stream.getAudioTracks().map(t => ({
                          enabled: t.enabled,
                          muted: t.muted,
                          readyState: t.readyState
                        }))
                      });
                    }
                  });
                }}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                🔧 Debug Audio
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}