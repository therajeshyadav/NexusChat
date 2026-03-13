import { useState, useRef, useEffect } from "react";
import {
  Hash,
  Pin,
  Users,
  Search,
  Plus,
  SmilePlus,
  Gift,
  ImagePlus,
  File,
  X,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { Channel, Message, Member } from "@/types/chat";
import { API_CONFIG } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { chatApi } from "@/services/chatApi";

interface ChatAreaProps {
  channel: Channel;
  messages: Message[];
  members: Member[];
  onSendMessage: (content: string, attachments?: any[]) => void;
  onToggleMembers: () => void;
  showMembers: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getAvatarColor(id: string) {
  const colors = [
    "bg-primary",
    "bg-discord-green",
    "bg-discord-yellow",
    "bg-discord-red",
    "bg-accent",
  ];
  return colors[parseInt(id) % colors.length];
}

export default function ChatArea({
  channel,
  messages,
  members,
  onSendMessage,
  onToggleMembers,
  showMembers,
}: ChatAreaProps) {
  if (!channel) return null;

  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Helper to get username from senderId
  const getUsernameById = (senderId: string) => {
    if (senderId === user?.id.toString()) {
      return user.username;
    }
    const member = members.find((m) => m._id === senderId);
    return member?.username || `User ${senderId}`;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const result = await chatApi.uploadFile(file);
      setUploadedFiles((prev) => [...prev, result]);
    } catch (error) {
      console.error("File upload failed:", error);
      alert("File upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (!input.trim() && uploadedFiles.length === 0) return;

    onSendMessage(
      input.trim(),
      uploadedFiles.length > 0 ? uploadedFiles : undefined,
    );
    setInput("");
    setUploadedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  //emoji handler
  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="flex h-full flex-1 flex-col bg-discord-chat-bg">
      {/* Channel header */}
      <div className="flex h-12 items-center justify-between border-b border-discord-darkest px-4">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold text-foreground">{channel.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground transition-colors hover:text-foreground">
            <Pin className="h-5 w-5" />
          </button>
          <button
            onClick={onToggleMembers}
            className={`transition-colors ${showMembers ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Users className="h-5 w-5" />
          </button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-36 rounded-md bg-discord-darkest py-1 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              placeholder="Search"
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Hash className="mb-2 h-16 w-16 opacity-30" />
            <h3 className="text-xl font-bold text-foreground">
              Welcome to #{channel.name}!
            </h3>
            <p className="text-sm">
              This is the start of the #{channel.name} channel.
            </p>
          </div>
        )}
        {messages.map((msg, i) => {
          const showDate =
            i === 0 ||
            formatDate(messages[i - 1].createdAt) !== formatDate(msg.createdAt);
          const isGrouped =
            i > 0 &&
            messages[i - 1].senderId === msg.senderId &&
            !showDate &&
            new Date(msg.createdAt).getTime() -
              new Date(messages[i - 1].createdAt).getTime() <
              5 * 60 * 1000;

          return (
            <div key={msg._id}>
              {showDate && (
                <div className="my-4 flex items-center gap-2">
                  <div className="flex-1 border-t border-border" />
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {formatDate(msg.createdAt)}
                  </span>
                  <div className="flex-1 border-t border-border" />
                </div>
              )}
              <div
                className={`group flex gap-4 rounded-md px-2 py-0.5 transition-colors hover:bg-discord-hover/30 ${isGrouped ? "mt-0" : "mt-4"}`}
              >
                {isGrouped ? (
                  <div className="w-10 shrink-0">
                    <span className="hidden text-[10px] text-muted-foreground group-hover:inline">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground ${getAvatarColor(msg.senderId.toString())}`}
                  >
                    {getUsernameById(msg.senderId.toString())
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {!isGrouped && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-foreground hover:underline">
                        {getUsernameById(msg.senderId.toString())}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  {msg.content && (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {msg.content}
                    </p>
                  )}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.attachments.map((attachment, idx) => (
                        <div key={idx}>
                          {attachment.type === "image" ? (
                            <img
                              src={`${API_CONFIG.socketUrl}${attachment.url}`}
                              alt="attachment"
                              className="max-h-64 max-w-sm rounded-lg cursor-pointer hover:opacity-90"
                              onClick={() =>
                                window.open(
                                  `${API_CONFIG.socketUrl}${attachment.url}`,
                                  "_blank",
                                )
                              }
                            />
                          ) : (
                            <a
                              href={`${API_CONFIG.socketUrl}${attachment.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 rounded-lg bg-discord-hover px-3 py-2 text-sm hover:bg-discord-hover/70"
                            >
                              <File className="h-5 w-5" />
                              <span>{attachment.filename || "File"}</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="relative px-4 pb-6">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-16 right-4 z-50">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        {/* File preview */}
        {uploadedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {uploadedFiles.map((file, idx) => (
              <div
                key={idx}
                className="relative rounded-lg bg-discord-hover p-2"
              >
                {file.type === "image" ? (
                  <img
                    src={`${API_CONFIG.socketUrl}${file.url}`}
                    alt="preview"
                    className="h-20 w-20 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center">
                    <File className="h-8 w-8" />
                  </div>
                )}
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-lg bg-discord-input-bg px-4 py-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            title="Upload file"
          >
            <Plus className="h-5 w-5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder={`Message #${channel.name}`}
          />
          <button className="text-muted-foreground transition-colors hover:text-foreground">
            <ImagePlus className="h-5 w-5" />
          </button>
          <button className="text-muted-foreground transition-colors hover:text-foreground">
            <Gift className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <SmilePlus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
