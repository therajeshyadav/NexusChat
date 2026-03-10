# Calling Feature - Remaining Fixes

## Current Status: UI Working ✅, Audio/State Management Issues ⚠️

### Issues Fixed:
1. ✅ Call UI showing on both sides
2. ✅ Modal bahar click se close nahi hoga (added `onPointerDownOutside` and `onInteractOutside` preventDefault)
3. ✅ Reject call socket event emit ho raha hai

### Issues Remaining:

#### 1. Audio Not Working
**Problem**: WebRTC peer connection ban raha hai but audio stream nahi aa raha
**Solution Needed**:
- Check microphone permissions
- Verify audio tracks are being added to peer connection
- Check remote audio element autoplay attribute
- Debug WebRTC connection state

#### 2. Call Timer Not Showing
**Problem**: Call accept hone ke baad timer nahi dikh raha
**Solution**: ActiveCallModal me timer add karna hai with `useState` and `useEffect`

#### 3. Call State Not Clearing After Reject
**Problem**: Reject ke baad bhi UI show ho raha hai
**Current Fix**: Socket listeners me direct state clear kar rahe hain instead of calling `endCall()`
**Status**: Partially fixed, needs testing

### Files Modified:
- `nexus-chat/src/components/dm/CallModal.tsx` - Modal outside click disabled
- `nexus-chat/src/hooks/useCall.ts` - Reject/end call handlers improved

### Next Steps:
1. Test call reject - UI should disappear immediately
2. Add timer to ActiveCallModal
3. Debug WebRTC audio connection
4. Add proper error handling for microphone permissions

### WebRTC Audio Debug Steps:
```javascript
// In webrtc.ts startCall():
1. Check: navigator.mediaDevices.getUserMedia() success
2. Check: localStream.getAudioTracks().length > 0
3. Check: peerConnection.addTrack() called for audio
4. Check: remote stream ontrack event fired
5. Check: remoteAudioElement.srcObject set
6. Check: remoteAudioElement.play() called
```
