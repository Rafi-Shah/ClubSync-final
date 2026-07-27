import { useEffect, useRef, useState } from 'react';
import { PageTitle, Badge, Modal, Input, formatDateTime } from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import {
  getConversations,
  createGroupChat,
  getMessages,
  sendMessage,
  getAllMembers,
  getConversationParticipants,
  addParticipant,
} from '../../lib/adminApi';
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

interface Participant {
  id: string;
  conversation_id: string;
  member_id: string;
  member: { id: string; full_name: string; avatar_url: string | null } | null;
}

export default function GroupChat() {
  const { member } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msgLoading, setMsgLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [addMemberId, setAddMemberId] = useState('');
  const [creating, setCreating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [convs, mems] = await Promise.all([getConversations(), getAllMembers()]);
      // 'team' is the DB-valid conversation_type used for group chats (see
      // createGroupChat in adminApi.ts — 'group' was never a valid value).
      const groupConvs = (convs as Conversation[]).filter((c) => c.conversation_type === 'team');
      setConversations(groupConvs);
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

  // Load messages and participants when a conversation is selected
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setParticipants([]);
      return;
    }
    setMsgLoading(true);
    (async () => {
      try {
        const [msgs, parts] = await Promise.all([
          getMessages(selectedId),
          getConversationParticipants(selectedId),
        ]);
        setMessages(msgs as Message[]);
        setParticipants(parts as Participant[]);
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
      .channel(`group-messages-${selectedId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedId}` },
        async (payload) => {
          const newMsg = payload.new as Message;
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

  function toggleMember(id: string) {
    const next = new Set(selectedMemberIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMemberIds(next);
  }

  async function handleCreateGroup() {
    if (!groupTitle.trim() || !member) return;
    setCreating(true);
    try {
      const conv = await createGroupChat(groupTitle.trim(), member.id);
      // Add selected participants + the creator
      const allIds = new Set(selectedMemberIds);
      allIds.add(member.id);
      await Promise.all(Array.from(allIds).map((mid) => addParticipant(conv.id, mid)));
      const newConv = conv as Conversation;
      setConversations((prev) => [newConv, ...prev]);
      setSelectedId(conv.id);
      setMobileShowChat(true);
      setShowCreateGroup(false);
      setGroupTitle('');
      setSelectedMemberIds(new Set());
    } catch (e: any) {
      setError(e.message ?? 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  }

  async function handleAddMember() {
    if (!addMemberId || !selectedId) return;
    setAdding(true);
    try {
      await addParticipant(selectedId, addMemberId);
      // Refresh participants
      const parts = await getConversationParticipants(selectedId);
      setParticipants(parts as Participant[]);
      setShowAddMember(false);
      setAddMemberId('');
    } catch (e: any) {
      setError(e.message ?? 'Failed to add member.');
    } finally {
      setAdding(false);
    }
  }

  function selectConversation(id: string) {
    setSelectedId(id);
    setMobileShowChat(true);
    setShowParticipants(false);
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId);
  const participantMemberIds = new Set(participants.map((p) => p.member_id));
  const availableToAdd = members.filter((m) => !participantMemberIds.has(m.id));

  if (loading) {
    return (
      <div>
        <PageTitle title="Group Chat" subtitle="Group conversations with multiple members" />
        <LoadingState message="Loading group chats..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageTitle title="Group Chat" subtitle="Group conversations with multiple members" />
        <ErrorState message={error} onRetry={refresh} />
      </div>
    );
  }

  return (
    <div>
      <PageTitle title="Group Chat" subtitle="Group conversations with multiple members" />

      <div className="card overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Group list sidebar */}
          <div
            className={`${
              mobileShowChat ? 'hidden' : 'flex'
            } w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 dark:border-slate-800`}
          >
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Group Chats</h2>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Group
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4">
                  <EmptyState title="No group chats" message="Create a group to start chatting." />
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

          {/* Chat panel */}
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {participants.length} participant{participants.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowParticipants((v) => !v)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="View participants"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.003-.001a9.043 9.043 0 01-.836-.558 4.125 4.125 0 003.42-7.493 4.125 4.125 0 00-3.42 7.493m6.726-1.107a4.125 4.125 0 10-7.533-2.493 4.125 4.125 0 007.533 2.493z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Add member"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  {/* Messages */}
                  <div className="flex-1 flex flex-col">
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
                  </div>

                  {/* Participants sidebar (expandable) */}
                  {showParticipants && (
                    <div className="w-64 border-l border-slate-200 dark:border-slate-800 flex flex-col">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          Participants ({participants.length})
                        </h4>
                        <button
                          onClick={() => setShowParticipants(false)}
                          className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {participants.length === 0 ? (
                          <p className="p-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                            No participants.
                          </p>
                        ) : (
                          participants.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 grid place-items-center text-xs font-semibold text-primary-600 dark:text-primary-400">
                                {p.member?.full_name?.charAt(0).toUpperCase() ?? '?'}
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                                {p.member?.full_name ?? 'Unknown'}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
                        <button
                          onClick={() => setShowAddMember(true)}
                          className="w-full btn-outline text-sm"
                        >
                          Add Member
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 grid place-items-center">
                <EmptyState title="Select a group" message="Choose a group chat from the list to view messages." />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      <Modal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} title="Create Group Chat">
        <div className="space-y-4">
          <Input
            label="Group Title"
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
            placeholder="e.g. Organizing Committee"
          />
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Select Members ({selectedMemberIds.size} selected)
              </label>
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
              {members
                .filter((m) => m.id !== member?.id)
                .map((m) => {
                  const checked = selectedMemberIds.has(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMember(m.id)}
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.full_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{m.email}</p>
                      </div>
                    </label>
                  );
                })}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowCreateGroup(false)} className="btn-outline">
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={creating || !groupTitle.trim()}
              className="btn btn-primary"
            >
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal open={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member to Group">
        <div className="space-y-4">
          {availableToAdd.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              All members are already in this group.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Select a member to add to <span className="font-semibold">{selectedConversation?.title}</span>.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Member</label>
                <select
                  value={addMemberId}
                  onChange={(e) => setAddMemberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select a member...</option>
                  {availableToAdd.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowAddMember(false)} className="btn-outline">
              Cancel
            </button>
            {availableToAdd.length > 0 && (
              <button
                onClick={handleAddMember}
                disabled={adding || !addMemberId}
                className="btn btn-primary"
              >
                {adding ? 'Adding...' : 'Add Member'}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}