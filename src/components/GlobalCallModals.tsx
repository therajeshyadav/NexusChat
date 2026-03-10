import { useCallContext } from '@/context/CallContext';
import CallModal from '@/components/dm/CallModal';
import ActiveCallModal from '@/components/dm/ActiveCallModal';

export default function GlobalCallModals() {
  const {
    callState,
    currentCall,
    isIncoming,
    isMuted,
    isVideoOff,
    localVideoRef,
    remoteVideoRef,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCallContext();

  console.log('🎬 GlobalCallModals render:', { 
    callState, 
    isIncoming, 
    hasCurrentCall: !!currentCall,
    currentCall 
  });

  // Show incoming call modal only when ringing and incoming
  const showIncomingModal = callState === 'ringing' && isIncoming && currentCall;
  
  // Show outgoing/connecting call modal when calling but not incoming (caller or receiver connecting)
  const showOutgoingModal = callState === 'calling' && !isIncoming && currentCall;
  
  // Show active call modal when connected
  const showActiveModal = callState === 'connected' && currentCall;
  
  // Don't show any modal when idle or no current call
  const showNoModal = callState === 'idle' || !currentCall;

  console.log('🎬 Modal visibility:', { 
    showIncomingModal, 
    showOutgoingModal, 
    showActiveModal, 
    showNoModal,
    callState,
    isIncoming 
  });

  // If no call, don't show any modal
  if (showNoModal) {
    return null;
  }

  return (
    <>
      {/* Incoming Call Modal - only when ringing and incoming */}
      {showIncomingModal && (
        <CallModal
          isOpen={true}
          callType={currentCall.callType}
          callerUsername={currentCall.friendUsername}
          isIncoming={true}
          onAccept={answerCall}
          onReject={rejectCall}
        />
      )}

      {/* Outgoing/Connecting Call Modal - when calling (either caller or receiver connecting) */}
      {showOutgoingModal && (
        <CallModal
          isOpen={true}
          callType={currentCall.callType}
          callerUsername={currentCall.friendUsername}
          isIncoming={false}
          onReject={endCall}
        />
      )}

      {/* Active Call Modal - when connected */}
      {showActiveModal && (
        <ActiveCallModal
          isOpen={true}
          callType={currentCall.callType}
          friendUsername={currentCall.friendUsername}
          isConnected={true}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onEndCall={endCall}
        />
      )}
    </>
  );
}
