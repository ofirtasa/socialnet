import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

type ChatMessage = {
  senderId: string;
  receiverId: string;
  content: string;
  senderName?: string | null;
  senderAvatar?: string | null;
  createdAt: string;
};

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = io(window.location.origin as string, {
      path: "/socket.io",
      transports: ["websocket"],
    });
  }
  return socket;
}

export default function Chat() {
  const params = useParams<{ userId: string }>();
  const targetUserId = params.userId || null;
  const [, navigate] = useLocation();
  const { user } = useLocalAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(targetUserId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Bug 3 Fix: Get session token via tRPC (httpOnly cookie not accessible from JS)
  const { data: sessionToken } = trpc.auth.getSessionToken.useQuery(undefined, {
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: conversationPartners } = trpc.messages.conversationList.useQuery(
    { userId: user?.id ?? "" }, { enabled: !!user }
  );
  const { data: dbMessages, refetch: refetchMessages } = trpc.messages.conversation.useQuery(
    { userId1: user?.id ?? "", userId2: selectedUserId ?? "" },
    { enabled: !!user && !!selectedUserId }
  );
  const { data: targetUser } = trpc.users.getById.useQuery(
    { id: selectedUserId ?? "" }, { enabled: !!selectedUserId }
  );
  const { data: friends } = trpc.friends.list.useQuery(
    { userId: user?.id ?? "" }, { enabled: !!user }
  );

  // Initialize socket and authenticate when token is available
  useEffect(() => {
    if (!user || !sessionToken) return;

    const s = getSocket();

    const handleConnect = () => {
      setConnected(true);
      // Authenticate using the server-provided token
      s.emit("authenticate", sessionToken);
    };

    const handleAuthenticated = (data: { userId: string; name: string }) => {
      setAuthenticated(true);
      console.log("[Chat] Authenticated as", data.name);
    };

    const handleDisconnect = () => {
      setConnected(false);
      setAuthenticated(false);
    };

    s.on("connect", handleConnect);
    s.on("authenticated", handleAuthenticated);
    s.on("disconnect", handleDisconnect);

    // If already connected, authenticate immediately
    if (s.connected) {
      setConnected(true);
      s.emit("authenticate", sessionToken);
    } else {
      s.connect();
    }

    return () => {
      s.off("connect", handleConnect);
      s.off("authenticated", handleAuthenticated);
      s.off("disconnect", handleDisconnect);
    };
  }, [user, sessionToken]);

  // Listen for messages
  useEffect(() => {
    if (!user) return;
    const s = getSocket();

    const handleNewMessage = (msg: ChatMessage) => {
      if (String(msg.senderId) === selectedUserId || String(msg.receiverId) === selectedUserId) {
        setMessages((prev) => {
          // Avoid duplicates
          const exists = prev.some(m => m.createdAt === msg.createdAt && m.senderId === msg.senderId && m.content === msg.content);
          return exists ? prev : [...prev, msg];
        });
      }
    };

    const handleMessageSent = (msg: ChatMessage) => {
      setMessages((prev) => {
        const exists = prev.some(m => m.createdAt === msg.createdAt && m.senderId === msg.senderId && m.content === msg.content);
        return exists ? prev : [...prev, msg];
      });
    };

    const handleTyping = (data: { userId: string }) => {
      if (String(data.userId) === selectedUserId) setIsTyping(true);
    };

    const handleStopTyping = (data: { userId: string }) => {
      if (String(data.userId) === selectedUserId) setIsTyping(false);
    };

    s.on("new_message", handleNewMessage);
    s.on("message_sent", handleMessageSent);
    s.on("user_typing", handleTyping);
    s.on("user_stop_typing", handleStopTyping);

    return () => {
      s.off("new_message", handleNewMessage);
      s.off("message_sent", handleMessageSent);
      s.off("user_typing", handleTyping);
      s.off("user_stop_typing", handleStopTyping);
    };
  }, [user, selectedUserId]);

  // Load DB messages when conversation changes
  useEffect(() => {
    if (dbMessages) {
      setMessages(
        dbMessages.map((m: any) => ({
          ...m,
          senderId: String(m.senderId),
          receiverId: String(m.receiverId),
          createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
        }))
      );
    }
  }, [dbMessages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !user || !selectedUserId) return;

    if (!authenticated) {
      toast_error("Not connected to chat. Please wait...");
      return;
    }

    const s = getSocket();
    s.emit("private_message", { receiverId: selectedUserId, content: input.trim() });
    setInput("");
    clearTimeout(typingTimeout.current);
    s.emit("stop_typing", { receiverId: selectedUserId });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!selectedUserId || !authenticated) return;
    const s = getSocket();
    s.emit("typing", { receiverId: selectedUserId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      s.emit("stop_typing", { receiverId: selectedUserId });
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleSelectConversation = (uid: string) => {
    setSelectedUserId(uid);
    navigate(`/chat/${uid}`);
  };

  const friendIds = friends?.map((f: any) =>
    String(f.requesterId) === user?.id ? String(f.addresseeId) : String(f.requesterId)
  ) || [];
  const conversationIds = Array.from(
    new Set([...(conversationPartners || []).map(String), ...friendIds])
  ).filter((id) => id !== user?.id);

  if (!user) return (
    <Layout>
      <div className="flex items-center justify-center h-64 text-muted-foreground">Please sign in to use chat</div>
    </Layout>
  );

  const showChatOnMobile = !!selectedUserId;

  return (
    <Layout>
      <div className="flex" style={{ height: "calc(100dvh - 56px - 64px)" }}>

        {/* Conversation List */}
        <div className={`${showChatOnMobile ? "hidden lg:flex" : "flex"} lg:flex flex-col w-full lg:w-72 border-r border-border bg-card`}>
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-lg" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}>Messages</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full ${authenticated ? "bg-green-500" : connected ? "bg-yellow-500" : "bg-gray-400"}`} />
              <span className="text-xs text-muted-foreground">
                {authenticated ? "Connected" : connected ? "Authenticating..." : "Connecting..."}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {conversationIds.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">No conversations yet</p>
                <p className="text-xs mt-1">Add friends to start chatting</p>
              </div>
            )}
            {conversationIds.map((uid: string) => (
              <ConversationItem
                key={uid}
                userId={uid}
                isSelected={selectedUserId === uid}
                onClick={() => handleSelectConversation(uid)}
              />
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${showChatOnMobile ? "flex" : "hidden lg:flex"} flex-1 flex-col`}>
          {selectedUserId && targetUser ? (
            <>
              {/* Header */}
              <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 bg-card">
                <button onClick={() => { setSelectedUserId(null); navigate("/chat"); }} className="lg:hidden p-1.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground flex-shrink-0">
                  <ArrowLeft size={20} />
                </button>
                <Link href={`/profile/${selectedUserId}`}>
                  <img
                    src={targetUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUserId}`}
                    alt=""
                    className="sn-avatar cursor-pointer flex-shrink-0"
                    style={{ width: 38, height: 38 }}
                    onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${targetUser.name || "U"}`; }}
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{targetUser.name}</p>
                  {isTyping && <p className="text-xs text-primary animate-pulse">typing...</p>}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <p>No messages yet</p>
                    <p className="text-xs mt-1">Say hello! 👋</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isOwn = String(msg.senderId) === user.id;
                  return (
                    <div key={i} className={`flex ${isOwn ? "justify-end" : "justify-start"} items-end gap-2`}>
                      {!isOwn && (
                        <img
                          src={targetUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId}`}
                          alt=""
                          className="sn-avatar flex-shrink-0"
                          style={{ width: 26, height: 26 }}
                          onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${targetUser.name || "U"}`; }}
                        />
                      )}
                      <div
                        className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isOwn ? "text-white rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"
                        }`}
                        style={isOwn ? { background: "linear-gradient(135deg, oklch(0.55 0.22 264), oklch(0.6 0.2 290))" } : {}}
                      >
                        <p className="break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isOwn ? "text-white/60" : "text-muted-foreground"}`}>
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex justify-start items-end gap-2">
                    <div className="bg-secondary px-4 py-2.5 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1">
                        {[0, 150, 300].map((d) => (
                          <div key={d} className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 sm:p-4 border-t border-border bg-card">
                {!authenticated && (
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    {connected ? "Authenticating..." : "Connecting to chat..."}
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={authenticated ? "Type a message..." : "Connecting..."}
                    className="sn-input flex-1"
                    disabled={!authenticated}
                    autoComplete="off"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || !authenticated}
                    className="sn-btn sn-btn-primary px-4 flex-shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 hidden lg:flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose from your friends or start a new chat</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// Inline toast for non-blocking error
function toast_error(msg: string) {
  console.error("[Chat]", msg);
}

function ConversationItem({ userId, isSelected, onClick }: { userId: string; isSelected: boolean; onClick: () => void }) {
  const { data: user } = trpc.users.getById.useQuery({ id: userId }, { staleTime: 300_000, retry: false });
  if (!user) return null;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 active:scale-[0.98] ${
        isSelected ? "bg-primary/10 text-primary" : "hover:bg-secondary"
      }`}
    >
      <img
        src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
        alt=""
        className="sn-avatar flex-shrink-0"
        style={{ width: 44, height: 44 }}
        onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name || "U"}`; }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{user.name}</p>
        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
      </div>
    </button>
  );
}
