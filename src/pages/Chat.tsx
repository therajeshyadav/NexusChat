import { useState, useEffect } from "react";
import { Server, Message, Channel, Member } from "@/types/chat";
import { useAuth } from "@/context/AuthContext";
import { useCallContext } from "@/context/CallContext";
import { useVoiceChannel } from "@/hooks/useVoiceChannel";
import ServerSidebar from "@/components/chat/ServerSidebar";
import ChannelSidebar from "@/components/chat/ChannelSidebar";
import ChatArea from "@/components/chat/ChatArea";
import VoiceChannelArea from "@/components/chat/VoiceChannelArea";
import MembersSidebar from "@/components/chat/MembersSidebar";
import DMSidebar from "@/components/dm/DMSidebar";
import DMChatArea from "@/components/dm/DMChatArea";
import FriendProfile from "@/components/dm/FriendProfile";
import CallModal from "@/components/dm/CallModal";
import ActiveCallModal from "@/components/dm/ActiveCallModal";
import Friends from "@/pages/Friends";
import { chatApi } from "@/services/chatApi";
import { socketService } from "@/services/socket";

export default function Chat() {
  const { user, token } = useAuth();
  const {
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
  } = useCallContext();

  const {
    voiceState,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute: toggleVoiceMute,
    toggleDeafen,
  } = useVoiceChannel();

  const [servers, setServers] = useState<Server[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeServerId, setActiveServerId] = useState<string>("");
  const [activeChannelId, setActiveChannelId] = useState<string>("");
  const [showMembers, setShowMembers] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  
  // DM state
  const [activeDM, setActiveDM] = useState<{ id: string; friendId: number; friendUsername: string } | null>(null);
  const [showDMProfile, setShowDMProfile] = useState(true);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const data = await chatApi.getServers();
        setServers(data || []);

        if (data && data.length > 0 && data[0].channels && data[0].channels.length > 0) {
          setActiveServerId(data[0]._id);
          setActiveChannelId(data[0].channels[0]._id);
        }
      } catch (err) {
        console.error("Failed to fetch servers", err);
        setServers([]);
      }
    };

    fetchServers();
  }, []);

  // Channel/DM messages and socket listeners
  useEffect(() => {
    const channelId = activeChannelId || activeDM?.id;
    if (!channelId) return;

    // Join channel/DM
    socketService.joinChannel(channelId);

    // Load messages
    const loadMessages = activeDM 
      ? chatApi.getDMMessages(activeDM.id)
      : chatApi.getMessages(channelId);
      
    loadMessages
      .then(setMessages)
      .catch((err) => console.error("Failed to fetch messages", err));

    // Listen for new messages
    socketService.onNewMessage((message: Message) => {
      console.log("New message received:", message);
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketService.leaveChannel(channelId);
      socketService.offNewMessage();
    };
  }, [activeChannelId, activeDM]);

  // Server join and online users tracking
  useEffect(() => {
    if (!activeServerId) return;

    // Join server for online status
    socketService.joinServer(activeServerId);

    // Fetch members
    chatApi
      .getMembers(activeServerId)
      .then(setMembers)
      .catch((err) => console.error("Failed to fetch members", err));

    // Listen for online users updates
    socketService.onOnlineUsersUpdate((data) => {
      if (data.serverId === activeServerId) {
        setOnlineUserIds(data.onlineUsers);
      }
    });

    return () => {
      socketService.leaveServer(activeServerId);
      socketService.offOnlineUsersUpdate();
    };
  }, [activeServerId]);

  const activeServer = servers?.find((s) => s._id === activeServerId);

  const activeChannel =
    activeServer?.channels?.find((c) => c._id === activeChannelId) ||
    activeServer?.channels?.[0];

  const channelMessages = messages.filter(
    (m) => m.channelId === (activeChannelId || activeDM?.id),
  );

  const handleSelectServer = (id: string) => {
    setActiveServerId(id);

    const server = servers.find((s) => s._id === id);
    if (server && server.channels && server.channels.length > 0) {
      setActiveChannelId(server.channels[0]._id);
    }
  };

  const handleSendMessage = (content: string, attachments?: any[]) => {
    const channelId = activeChannelId || activeDM?.id;
    if (!channelId || (!content.trim() && !attachments?.length)) return;
    
    // Send via socket
    socketService.sendMessage(channelId, content.trim(), attachments);
  };

  const handleServerCreated = async () => {
    try {
      const data = await chatApi.getServers();
      setServers(data || []);

      if (data && data.length > 0) {
        const newServer = data[data.length - 1];
        setActiveServerId(newServer._id);
        if (newServer.channels && newServer.channels.length > 0) {
          setActiveChannelId(newServer.channels[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to refresh servers", err);
    }
  };

  const handleOpenDM = async (friendId: number, friendUsername: string) => {
    try {
      // Get or create DM
      const dm = await chatApi.getOrCreateDM(friendId);
      
      // Clear server selection
      setActiveServerId("");
      setActiveChannelId("");
      
      setActiveDM({
        id: dm._id,
        friendId,
        friendUsername,
      });
    } catch (err) {
      console.error("Failed to open DM", err);
    }
  };

  const handleSelectDM = (friendId: number, friendUsername: string, dmId: string) => {
    // Clear server selection
    setActiveServerId("");
    setActiveChannelId("");
    
    setActiveDM({
      id: dmId,
      friendId,
      friendUsername,
    });
  };

  const handleShowFriends = () => {
    setActiveDM(null);
    setActiveServerId("");
    setActiveChannelId("");
  };

  // if (!activeServer || !activeChannel) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ServerSidebar
        servers={servers}
        activeServerId={activeServerId}
        onSelectServer={handleSelectServer}
        onServerCreated={handleServerCreated}
        onHomeClick={() => setActiveServerId("")}
      />

      {activeServer ? (
        <>
          <ChannelSidebar
            server={activeServer}
            activeChannelId={activeChannelId}
            onSelectChannel={setActiveChannelId}
            onChannelCreated={handleServerCreated}
          />

          {activeChannel ? (
            activeChannel.type === 'voice' ? (
              <VoiceChannelArea
                channel={activeChannel}
                voiceState={voiceState}
                onJoinChannel={() => joinVoiceChannel(activeChannel._id)}
                onLeaveChannel={leaveVoiceChannel}
                onToggleMute={toggleVoiceMute}
                onToggleDeafen={toggleDeafen}
              />
            ) : (
              <ChatArea
                channel={activeChannel}
                messages={channelMessages}
                members={members}
                onSendMessage={handleSendMessage}
                onToggleMembers={() => setShowMembers(!showMembers)}
                showMembers={showMembers}
              />
            )
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-400">
              Select or create a channel
            </div>
          )}

          {showMembers && (
            <MembersSidebar 
              members={members.map(m => ({
                ...m,
                status: onlineUserIds.includes(m._id) ? 'online' : 'offline'
              }))} 
              ownerId={activeServer?.ownerId} 
            />
          )}
        </>
      ) : activeDM ? (
        <>
          <DMSidebar
            activeDMId={activeDM.id}
            onSelectDM={handleSelectDM}
            onShowFriends={handleShowFriends}
          />
          <DMChatArea
            friendId={activeDM.friendId}
            friendUsername={activeDM.friendUsername}
            dmId={activeDM.id}
            messages={messages.filter(m => m.channelId === activeDM.id)}
            members={[
              { _id: activeDM.friendId.toString(), username: activeDM.friendUsername, status: "online" },
              { _id: user?.id.toString() || "", username: user?.username || "", status: "online" },
            ]}
            onSendMessage={handleSendMessage}
            onToggleProfile={() => setShowDMProfile(!showDMProfile)}
            showProfile={showDMProfile}
            onStartCall={startCall}
          />
          {showDMProfile && (
            <FriendProfile
              friendId={activeDM.friendId}
              friendUsername={activeDM.friendUsername}
            />
          )}
        </>
      ) : (
        <Friends onOpenDM={handleOpenDM} />
      )}

      {/* Incoming Call Modal */}
      {isIncoming && currentCall && (
        <CallModal
          isOpen={true}
          callType={currentCall.callType}
          callerUsername={currentCall.friendUsername}
          isIncoming={true}
          onAccept={answerCall}
          onReject={rejectCall}
        />
      )}

      {/* Outgoing Call Modal */}
      {callState === 'calling' && !isIncoming && currentCall && (
        <CallModal
          isOpen={true}
          callType={currentCall.callType}
          callerUsername={currentCall.friendUsername}
          isIncoming={false}
          onReject={endCall}
        />
      )}

      {/* Active Call Modal */}
      {callState === 'connected' && currentCall && (
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
    </div>
  );
}
