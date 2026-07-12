import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PageTitle } from '../../components/member/MemberUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getAllMembers } from '../../lib/memberApi';
import { supabase } from '../../lib/supabase';

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_member_id: string;
  body: string;
  created_at: string;
  sender?: { full_name: string; avatar_url: string | null };
}

interface Conversation {
  id: string;
  conversation_type: string;
  title: string | null;
  related_team_id: string | null;
  last_message_at: string | null;
}

export default function Chat() {
  const { member, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [showNewChat, setShowNewChat] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!member) return;
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation:conversations!inner (
          id, conversation_type, title, related_team_id, last_message_at
        )
      `)
      .eq('member_id', member.id);
    if (error) { setError(true); return; }
    const convs = (data ?? []).map((row: any) => row.conversation).filter(Boolean);
    convs.sort((a: Conversation, b: Conversation) =>
      (b.last_message_at ?? b.id).localeCompare(a.last_message_at ?? a.id)
    );
    setConversations(convs);
    if (convs.length > 0 && !activeConv) setActiveConv(convs[0]);
  }, [member, activeConv]);

  // Load members for new chat
  useEffect(() => {
    getAllMembers().then(setAllMembers).catch(() => {});
  }, []);

  // Initial load
  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
  }, [member]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select(`
        id, conversation_id, sender_member_id, body, created_at,
        sender:members!messages_sender_member_id_fkey ( full_name, avatar_url )
      `)
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(100);
    setMessages((data ?? []) as unknown as ChatMessage[]);
  }, []);

  useEffect(() => {
    if (activeConv) loadMessages(activeConv.id);
  }, [activeConv, loadMessages]);

  // Realtime: new messages
  useEffect(() => {
    if (!activeConv) return;
    const channel = supabase
      .channel(`messages:${activeConv.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConv.id}` },
        (payload) => {
          const newMsg = payload.new as any;
          // Fetch sender info
          supabase.from('members').select('full_name, avatar_url').eq('id', newMsg.sender_member_id).maybeSingle()
            .then(({ data: sender }) => {
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, { ...newMsg, sender: sender ?? undefined }];
              });
            });
          // Mark as read if I'm not the sender
          if (member && newMsg.sender_member_id !== member.id) {
            supabase.from('message_read_receipts').upsert({
              message_id: newMsg.id,
              member_id: member.id,
            }).then();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConv, member]);

  // Realtime: typing indicators via presence
  useEffect(() => {
    if (!activeConv || !member) return;
    const channel = supabase.channel(`typing:${activeConv.id}`, {
      config: { presence: { key: member.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach(p => {
            if (p.member_id) online.add(p.member_id);
            if (p.is_typing && p.member_id !== member.id) {
              setTypingUsers(prev => new Set([...prev, p.member_id]));
            }
          });
        });
        setOnlineUsers(online);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((p: any) => {
          setTypingUsers(prev => { const n = new Set(prev); n.delete(p.member_id); return n; });
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ member_id: member.id, is_typing: false });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [activeConv, member]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !member || !activeConv) return;
    const body = newMessage.trim();
    setNewMessage('');
    try {
      await supabase.from('messages').insert({
        conversation_id: activeConv.id,
        sender_member_id: member.id,
        body,
      });
      await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', activeConv.id);
      // Stop typing
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      const channel = supabase.channel(`typing:${activeConv.id}`);
      await channel.track({ member_id: member.id, is_typing: false });
    } catch {
      setNewMessage(body);
    }
  };

  // Typing indicator
  const handleTyping = (value: string) => {
    setNewMessage(value);
    if (!member || !activeConv) return;
    const channel = supabase.channel(`typing:${activeConv.id}`);
    channel.track({ member_id: member.id, is_typing: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channel.track({ member_id: member.id, is_typing: false });
    }, 2000);
  };

  // Start direct chat
  const startDirectChat = async (otherMemberId: string) => {
    if (!member) return;
    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversation_participants')
      .select(`
        conversation:conversations!inner (id, conversation_type, title, related_team_id, last_message_at)
      `)
      .eq('member_id', member.id)
      .eq('conversation.conversation_type', 'direct');
    for (const row of existing ?? []) {
      const conv = (row as any).conversation;
      if (!conv) continue;
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('member_id')
        .eq('conversation_id', conv.id);
      if (participants?.length === 2 && participants.some(p => p.member_id === otherMemberId)) {
        setActiveConv(conv);
        setShowNewChat(false);
        return;
      }
    }
    // Create new direct conversation
    const { data: conv } = await supabase.from('conversations').insert({
      conversation_type: 'direct',
      created_by_member_id: member.id,
    }).select().single();
    if (!conv) return;
    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, member_id: member.id },
      { conversation_id: conv.id, member_id: otherMemberId },
    ]);
    setActiveConv(conv);
    setShowNewChat(false);
    await loadConversations();
  };

  // Send broadcast
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !broadcastMsg.trim()) return;
    const { data: conv } = await supabase.from('conversations').insert({
      conversation_type: 'broadcast',
      title: `Broadcast by ${member.full_name}`,
      created_by_member_id: member.id,
    }).select().single();
    if (!conv) return;
    // Add all active members as participants
    const participants = allMembers.map(m => ({ conversation_id: conv.id, member_id: m.id }));
    await supabase.from('conversation_participants').insert(participants);
    await supabase.from('messages').insert({
      conversation_id: conv.id,
      sender_member_id: member.id,
      body: broadcastMsg.trim(),
    });
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conv.id);
    setBroadcastMsg('');
    setShowBroadcast(false);
    setActiveConv(conv);
    await loadConversations();
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load chat." />;

  const getConvTitle = (conv: Conversation) => {
    if (conv.title) return conv.title;
    if (conv.conversation_type === 'direct') {
      // Find other participant's name
      return 'Direct Message';
    }
    return conv.conversation_type.charAt(0).toUpperCase() + conv.conversation_type.slice(1);
  };

  const isOnline = (memberId: string) => onlineUsers.has(memberId);
  const isTyping = typingUsers.size > 0;

  return (
    <div>
      <PageTitle title="Live Chat" subtitle="Connect with other members in real time" action={
        <div className="flex gap-2">
          <button onClick={() => setShowBroadcast(s => !s)} className="btn-outline">Broadcast</button>
          <button onClick={() => setShowNewChat(s => !s)} className="btn-primary">New Chat</button>
        </div>
      } />

      {/* Broadcast form */}
      {showBroadcast && (
        <form onSubmit={handleBroadcast} className="card p-4 mb-4 flex gap-3">
          <input type="text" value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} placeholder="Broadcast message to all members..." className="input flex-1" required />
          <button type="submit" className="btn-primary">Send</button>
        </form>
      )}

      {/* New chat picker */}
      {showNewChat && (
        <div className="card p-4 mb-4 max-h-64 overflow-y-auto">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Start a direct chat with:</p>
          <div className="space-y-1">
            {allMembers.filter(m => m.id !== member?.id).map(m => (
              <button key={m.id} onClick={() => startDirectChat(m.id)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-primary-600 text-white grid place-items-center text-sm font-semibold">{m.full_name.charAt(0)}</div>
                  {isOnline(m.id) && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-900" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{m.full_name}</p>
                  <p className="text-xs text-slate-500">{m.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden flex h-[calc(100vh-280px)] min-h-[400px]">
        {/* Conversation list */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 hidden sm:flex">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-500">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-sm text-slate-400 p-4 text-center">No conversations yet. Start a new chat!</p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full flex items-center gap-3 p-3 text-left border-b border-slate-100 dark:border-slate-800/50 transition-colors ${activeConv?.id === conv.id ? 'bg-primary-50 dark:bg-primary-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <div className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${conv.conversation_type === 'direct' ? 'bg-blue-100 dark:bg-blue-950/50' : conv.conversation_type === 'broadcast' ? 'bg-amber-100 dark:bg-amber-950/50' : 'bg-primary-100 dark:bg-primary-950/50'}`}>
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={conv.conversation_type === 'direct' ? 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' : conv.conversation_type === 'broadcast' ? 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6' : 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'} />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{getConvTitle(conv)}</p>
                    <p className="text-xs text-slate-400 capitalize">{conv.conversation_type}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeConv ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${activeConv.conversation_type === 'direct' ? 'bg-blue-100 dark:bg-blue-950/50' : activeConv.conversation_type === 'broadcast' ? 'bg-amber-100 dark:bg-amber-950/50' : 'bg-primary-100 dark:bg-primary-950/50'}`}>
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={activeConv.conversation_type === 'direct' ? 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' : activeConv.conversation_type === 'broadcast' ? 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6' : 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">{getConvTitle(activeConv)}</p>
                  {isTyping ? (
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <span className="flex gap-0.5">{[0, 1, 2].map(i => <span key={i} className="w-1 h-1 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />)}</span>
                      someone is typing...
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 capitalize">{activeConv.conversation_type}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-slate-400">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isOwn = msg.sender_member_id === member?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${isOwn ? 'order-2' : ''}`}>
                          {!isOwn && msg.sender && (
                            <p className="text-xs text-slate-500 mb-1 ml-1">{msg.sender.full_name}</p>
                          )}
                          <div className={`px-4 py-2 rounded-2xl ${isOwn ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm shadow-sm'}`}>
                            <p className="text-sm break-words">{msg.body}</p>
                          </div>
                          <p className={`text-xs text-slate-400 mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            {isOwn && <span className="ml-1 text-primary-500">✓✓</span>}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  placeholder="Type a message..."
                  className="input flex-1"
                />
                <button type="submit" disabled={!newMessage.trim()} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="Select a conversation" message="Choose a conversation from the list or start a new chat." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
