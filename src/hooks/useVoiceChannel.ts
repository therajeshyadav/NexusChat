import { useState, useEffect } from 'react';
import { voiceChannelManager, VoiceChannelState, VoiceChannelUser } from '@/services/voiceChannel';
import { toast } from 'sonner';

export function useVoiceChannel() {
  const [voiceState, setVoiceState] = useState<VoiceChannelState>({
    channelId: null,
    isConnected: false,
    users: [],
    isMuted: false,
    isDeafened: false,
  });

  useEffect(() => {
    console.log('🎤 Setting up voice channel hook');

    // Setup callbacks
    voiceChannelManager.onStateChange((state) => {
      console.log('🎤 Voice channel state changed:', state);
      setVoiceState(state);
    });

    voiceChannelManager.onUserJoin((user) => {
      console.log('👤 User joined voice channel:', user);
      toast.success(`${user.username} joined the voice channel`);
    });

    voiceChannelManager.onUserLeave((userId) => {
      console.log('👤 User left voice channel:', userId);
      // Find username from current users
      const user = voiceState.users.find(u => u.userId === userId);
      if (user) {
        toast.info(`${user.username} left the voice channel`);
      }
    });

    voiceChannelManager.onError((error) => {
      console.error('❌ Voice channel error:', error);
      toast.error(error);
    });

    return () => {
      console.log('🧹 Cleaning up voice channel hook');
      // Don't destroy the manager, just cleanup callbacks
    };
  }, []);

  const joinVoiceChannel = async (channelId: string) => {
    try {
      await voiceChannelManager.joinVoiceChannel(channelId);
    } catch (error) {
      console.error('Failed to join voice channel:', error);
    }
  };

  const leaveVoiceChannel = () => {
    voiceChannelManager.leaveVoiceChannel();
  };

  const toggleMute = () => {
    voiceChannelManager.toggleMute();
  };

  const toggleDeafen = () => {
    voiceChannelManager.toggleDeafen();
  };

  return {
    voiceState,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen,
  };
}