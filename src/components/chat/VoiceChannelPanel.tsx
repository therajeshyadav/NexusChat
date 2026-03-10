import { Volume2, Mic, MicOff, Headphones, HeadphonesIcon, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceChannelState } from "@/services/voiceChannel";

interface VoiceChannelPanelProps {
  voiceState: VoiceChannelState;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onLeaveChannel: () => void;
}

export default function VoiceChannelPanel({
  voiceState,
  onToggleMute,
  onToggleDeafen,
  onLeaveChannel,
}: VoiceChannelPanelProps) {
  if (!voiceState.isConnected || !voiceState.channelId) {
    return null;
  }

  return (
    <div className="border-t border-discord-darkest bg-discord-darker p-3">
      {/* Voice Channel Header */}
      <div className="mb-3 flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-green-500" />
        <span className="text-sm font-medium text-foreground">Voice Connected</span>
        <div className="ml-auto">
          <Button
            onClick={onLeaveChannel}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
            title="Leave Voice Channel"
          >
            <PhoneOff className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Connected Users */}
      <div className="mb-3 space-y-1">
        {voiceState.users.map((user) => (
          <div key={user.userId} className="flex items-center gap-2 text-sm">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-primary-foreground ${
                user.isSpeaking ? 'bg-green-500' : 'bg-discord-hover'
              }`}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className={`flex-1 ${user.isMuted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {user.username}
            </span>
            {user.isMuted && <MicOff className="h-3 w-3 text-red-500" />}
          </div>
        ))}
      </div>

      {/* Voice Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onToggleMute}
          size="sm"
          variant={voiceState.isMuted ? "destructive" : "secondary"}
          className="flex-1"
          title={voiceState.isMuted ? "Unmute" : "Mute"}
        >
          {voiceState.isMuted ? (
            <>
              <MicOff className="mr-1 h-3 w-3" />
              Muted
            </>
          ) : (
            <>
              <Mic className="mr-1 h-3 w-3" />
              Mic
            </>
          )}
        </Button>

        <Button
          onClick={onToggleDeafen}
          size="sm"
          variant={voiceState.isDeafened ? "destructive" : "secondary"}
          className="flex-1"
          title={voiceState.isDeafened ? "Undeafen" : "Deafen"}
        >
          {voiceState.isDeafened ? (
            <>
              <HeadphonesIcon className="mr-1 h-3 w-3" />
              Deafened
            </>
          ) : (
            <>
              <Headphones className="mr-1 h-3 w-3" />
              Audio
            </>
          )}
        </Button>
      </div>
    </div>
  );
}