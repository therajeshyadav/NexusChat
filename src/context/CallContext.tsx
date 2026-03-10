import React, { createContext, useContext, ReactNode } from 'react';
import { useCall } from '@/hooks/useCall';

interface CallContextType {
  callState: any;
  currentCall: any;
  isIncoming: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  startCall: (friendId: number, friendUsername: string, callType: 'voice' | 'video') => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const callHook = useCall();

  console.log('🎯 CallProvider render, call state:', {
    callState: callHook.callState,
    isIncoming: callHook.isIncoming,
    hasCurrentCall: !!callHook.currentCall,
    currentCall: callHook.currentCall
  });

  return (
    <CallContext.Provider value={callHook}>
      {children}
    </CallContext.Provider>
  );
}

export function useCallContext() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within CallProvider');
  }
  return context;
}
