import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import apiService, { Conversation, Message } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send, Chat } from '@mui/icons-material';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { format } from 'date-fns';

const Messages = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialConvId = searchParams.get('conversation');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  // Load conversations
  useEffect(() => {
    apiService.getConversations().then((convs) => {
      setConversations(convs);
      // If there's an initial conversation from URL, select it; otherwise select first
      if (!activeConvId && convs.length > 0) {
        setActiveConvId(convs[0]._id);
      }
    }).catch(() => {
      toast({ title: 'Failed to load conversations', variant: 'destructive' });
    }).finally(() => setLoadingConvs(false));
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    apiService.getMessages(activeConvId).then((msgs) => {
      setMessages(msgs);
    }).catch(() => {}).finally(() => setLoadingMsgs(false));
  }, [activeConvId]);

  // Socket.io: connect and listen for new messages
  useEffect(() => {
    const socket = connectSocket();

    const handleNewMessage = (msg: Message) => {
      if (msg.conversationId === activeConvId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      // Update last message preview in conversations list
      setConversations((prev) =>
        prev.map((c) =>
          c._id === msg.conversationId
            ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt }
            : c
        )
      );
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      disconnectSocket();
    };
  }, [activeConvId]);

  // Join/leave socket room when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    const socket = connectSocket();
    socket.emit('join_conversation', activeConvId);
    return () => {
      socket.emit('leave_conversation', activeConvId);
    };
  }, [activeConvId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeConvId || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      const msg = await apiService.sendMessage(activeConvId, text);
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConvId
            ? { ...c, lastMessage: text, lastMessageAt: msg.createdAt }
            : c
        )
      );
    } catch {
      toast({ title: 'Failed to send message', variant: 'destructive' });
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const getConvLabel = (conv: Conversation): string => {
    if (profile?.role === 'client') {
      const p = conv.providerId;
      return typeof p === 'object' ? p.businessName : 'Provider';
    }
    const c = conv.clientId;
    return typeof c === 'object' ? c.fullName : 'Client';
  };

  const getUnreadCount = (conv: Conversation): number => {
    if (profile?.role === 'client') return conv.clientUnread;
    return conv.providerUnread;
  };

  const activeConv = conversations.find((c) => c._id === activeConvId);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Red Hat Display, system-ui, -apple-system, sans-serif' }}>
            Messages
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[70vh]">
            {/* Conversations sidebar */}
            <Card className="shadow-sm border-0 overflow-hidden md:col-span-1 flex flex-col">
              <div className="px-4 py-3 text-white text-sm font-semibold" style={{ backgroundColor: '#025bae' }}>
                Conversations
              </div>
              <div className="overflow-y-auto flex-1">
                {loadingConvs ? (
                  <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">
                    <Chat className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const unread = getUnreadCount(conv);
                    const label = getConvLabel(conv);
                    const isActive = conv._id === activeConvId;
                    return (
                      <button
                        key={conv._id}
                        onClick={() => setActiveConvId(conv._id)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${isActive ? 'bg-blue-50 border-l-2' : ''}`}
                        style={isActive ? { borderLeftColor: '#025bae' } : {}}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                {label.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{label}</p>
                              <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                            </div>
                          </div>
                          {unread > 0 && (
                            <Badge className="ml-2 flex-shrink-0 text-xs px-1.5" style={{ backgroundColor: '#025bae' }}>
                              {unread}
                            </Badge>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Message thread */}
            <Card className="shadow-sm border-0 overflow-hidden md:col-span-2 flex flex-col">
              {activeConv ? (
                <>
                  {/* Chat header */}
                  <div className="px-4 py-3 text-white flex items-center gap-2" style={{ backgroundColor: '#025bae' }}>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-white/20 text-white">
                        {getConvLabel(activeConv).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold">{getConvLabel(activeConv)}</span>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMsgs ? (
                      <div className="text-center text-gray-400 text-sm pt-8">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm pt-8">No messages yet. Say hello!</div>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = msg.senderId === profile?._id;
                        return (
                          <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                                isOwn
                                  ? 'text-white rounded-br-sm'
                                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                              }`}
                              style={isOwn ? { backgroundColor: '#025bae' } : {}}
                            >
                              <p>{msg.content}</p>
                              <p className={`text-xs mt-1 ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>
                                {format(new Date(msg.createdAt), 'h:mm a')}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input */}
                  <div className="border-t border-gray-100 p-3 flex gap-2">
                    <Input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type a message..."
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      maxLength={2000}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!inputText.trim() || sending}
                      style={{ backgroundColor: '#025bae' }}
                      className="hover:opacity-90"
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Chat className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
