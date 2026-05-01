'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Search, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { formatRelativeTime } from '@/lib/utils';
import type { Conversation, Message } from '@/types';

export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user]);

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => api.get('/chat/conversations').then(r => r.data.data),
    enabled: !!user
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ['messages', activeConv],
    queryFn: () => api.get(`/chat/conversations/${activeConv}/messages`).then(r => r.data.data),
    enabled: !!activeConv,
    refetchInterval: false
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/chat/conversations/${activeConv}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeConv] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessage('');
    }
  });

  useEffect(() => {
    if (activeConv && socket) {
      socket.emit('join_conversation', activeConv);
      socket.on('receive_message', (msg) => {
        queryClient.invalidateQueries({ queryKey: ['messages', activeConv] });
      });
    }
    return () => { socket?.off('receive_message'); };
  }, [activeConv, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !activeConv) return;
    sendMutation.mutate(message);
  };

  const activeConvData = conversations?.find(c => c._id === activeConv);
  const otherParticipant = activeConvData?.participants?.find(
    (p: any) => p._id !== user?._id
  ) as any;

  if (!user) return null;

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden flex h-[calc(100vh-120px)]">
          {/* Sidebar */}
          <div className="w-80 border-r dark:border-gray-800 flex flex-col">
            <div className="p-4 border-b dark:border-gray-800">
              <h2 className="font-bold text-lg mb-3">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 border dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-gray-800 outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {!conversations?.length ? (
                <div className="p-6 text-center text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : conversations.filter(c =>
                !search || (c.participants as any[]).some(p => p.name?.toLowerCase().includes(search.toLowerCase()))
              ).map(conv => {
                const other = (conv.participants as any[]).find(p => p._id !== user._id);
                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConv(conv._id)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${activeConv === conv._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 flex-shrink-0">
                      {other?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{other?.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {(conv.property as any)?.title || 'Property enquiry'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatRelativeTime(conv.updatedAt)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          {activeConv ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b dark:border-gray-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">
                  {otherParticipant?.name?.[0] || '?'}
                </div>
                <div>
                  <div className="font-semibold">{otherParticipant?.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{otherParticipant?.role}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence>
                  {messages?.map(msg => {
                    const isMe = (msg.sender as any)?._id === user._id;
                    return (
                      <motion.div
                        key={msg._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${isMe
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                        }`}>
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                            {formatRelativeTime(msg.createdAt)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t dark:border-gray-800">
                <div className="flex gap-3">
                  <input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 border dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 outline-none focus:border-blue-500"
                  />
                  <Button onClick={handleSend} disabled={!message.trim() || sendMutation.isPending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm mt-1">Choose from your conversations on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
