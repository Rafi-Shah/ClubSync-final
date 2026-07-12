import { useEffect, useRef, useState } from 'react';
import { PageTitle, Badge, Modal, Input, formatDateTime } from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import { getConversations, getMessages, sendMessage, getAllMembers } from '../../lib/adminApi';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

interface Conversation {
  id: string;
  title: string;
  conversation_type: string;
  last_message_at: string | null;
  created_by_member_id: string | null;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_member_id: string;
  body: string;
  created_at: string;
  sender: { id: string; full_name: string; avatar_url: string | null } | null;
}

interface Member {
  id: string;
  full_name: string;
  email: string;
}

export default function LiveChat() {
  const { member } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msgLoading, setMsgLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatMemberId, setNewChatMemberId] = useState('');
  const [creating, setCreating] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [convs, mems] = await Promise.all([getConversations(), getAllMembers()]);
      setConversations(convs as Conversation[]);
      setMembers(mems as Member[]);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, []);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    setMsgLoading(true);
    (async () => {
      try {
        const msgs = await getMessages(selectedId);
        setMessages(msgs as Message[]);
      } catch (e: any) {
        setError(e.message ?? 'Failed to load messages.');
      } finally {
        setMsgLoading(false);
      }
    })();
  }, [selectedId]);

  // Realtime subscription on messages for the selected conversation
  useEffect(() => {
    if (!selectedId) return;
    const channel = supabase
      .channel(`messages-${selectedId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedId}` },
        async (payload) => {
          // Fetch the full message with sender relation
          const newMsg = payload.new as Message;
          // Fetch sender info if not present
          let sender = newMsg.sender;
          if (!sender && newMsg.sender_member_id) {
            const { data: s } = await supabase
              .from('members')
              .select('id, full_name, avatar_url')
              .eq('id', newMsg.sender_member_id)
              .maybeSingle();
            sender = s as any;
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, { ...newMsg, sender: sender ?? null }];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!draft.trim() || !selectedId || !member) return;
    setSending(true);
    const body = draft.trim();
    setDraft('');
    try {
      const msg = await sendMessage(selectedId, member.id, body);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg as Message]));
      // Update conversation last_message_at locally
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, last_message_at: new Date().toISOString() } : c))
      );
    } catch (e: any) {
      setError(e.message ?? 'Failed to send message.');
      setDraft(body);
    } finally {
      setSending(false);
    }
  }

  async function handleCreateDirectChat() {
    if (!newChatMemberId || !member) return;
    setCreating(true);
    try {
      const selectedMember = members.find((m) => m.id === newChatMemberId);
      const title = selectedMember ? selectedMember.full_name : 'Direct Chat';
      const { data, error: insErr } = await supabase
        .from('conversations')
        .insert({ conversation_type: 'direct', title, created_by_member_id: member.id })
        .select()
        .single();
      if (insErr) throw insErr;
      // Add both participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: data.id, member_id: member.id },
        { conversation_id: data.id, member_id: newChatMemberId },
      ]);
      const newConv = data as Conversation;
      setConversations((prev) => [newConv, ...prev]);
      setSelectedId(data.id);
      setMobileShowChat(true);
      setShowNewChat(false);
      setNewChatMemberId('');
    } catch (e: any) {
      setError(e.message ?? 'Failed to create conversation.');
    } finally {
      setCreating(false);
    }
  }

  function selectConversation(id: string) {
    setSelectedId(id);
    setMobileShowChat(true);
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  if (loading) {
    return (
      <div>
        <PageTitle title="Live Chat" subtitle="Direct and group conversations" />
        <LoadingState message="Loading conversations..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageTitle title="Live Chat" subtitle="Direct and group conversations" />
        <ErrorState message={error} onRetry={refresh} />
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        title="Live Chat"
        subtitle="Direct and group conversations"
        action={
          <button onClick={() => setShowNewChat(true)} className="btn btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </span>
          </button>
        }
      />

      <div className="card overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Conversation list sidebar */}
          <div
            className={`${
              mobileShowChat ? 'hidden' : 'flex'
            } w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 dark:border-slate-800`}
          >
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4">
                  <EmptyState title="No conversations" message="Start a new chat to begin messaging." />
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      selectedId === conv.id ? 'bg-primary-50 dark:bg-primary-950/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate flex-1">
                        {conv.title}
                      </p>
                      <Badge status={conv.conversation_type} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {conv.last_message_at ? formatDateTime(conv.last_message_at) : 'No messages yet'}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message panel */}
          <div className={`${mobileShowChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col`}>
            {selectedConversation ? (
              <>
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {selectedConversation.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge status={selectedConversation.conversation_type} />
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
                  {msgLoading ? (
                    <LoadingState message="Loading messages..." />
                  ) : messages.length === 0 ? (
                    <EmptyState title="No messages" message="Send a message to start the conversation." />
                  ) : (
                    messages.map((msg) => {
                      const isOwn = member && msg.sender_member_id === member.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-primary-600 text-white rounded-br-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {!isOwn && msg.sender && (
                              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-0.5">
                                {msg.sender.full_name}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? 'text-primary-100' : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {formatDateTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !draft.trim()}
                      className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-600 text-white grid place-items-center hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 grid place-items-center">
                <EmptyState title="Select a conversation" message="Choose a conversation from the list to view messages." />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      <Modal open={showNewChat} onClose={() => setShowNewChat(false)} title="New Direct Chat">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Select a member to start a direct conversation with.
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Member</label>
            <select
              value={newChatMemberId}
              onChange={(e) => setNewChatMemberId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">Select a member...</option>
              {members
                .filter((m) => m.id !== member?.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.email})
                  </option>
                ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowNewChat(false)} className="btn-outline">
              Cancel
            </button>
            <button
              onClick={handleCreateDirectChat}
              disabled={creating || !newChatMemberId}
              className="btn btn-primary"
            >
              {creating ? 'Creating...' : 'Start Chat'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
