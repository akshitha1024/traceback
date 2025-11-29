'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
    loadConversations(user.id);
    
    // Check if we need to start a new conversation from query params
    const conversationId = searchParams.get('conversation');
    const itemId = searchParams.get('item_id');
    const itemTitle = searchParams.get('item_title');
    const otherEmail = searchParams.get('other_email');
    const otherName = searchParams.get('other_name');
    
    if (conversationId && itemId && otherEmail) {
      // Fetch other user ID from email
      fetchUserIdAndStartConversation(user, conversationId, itemId, itemTitle, otherEmail, otherName);
    }
  }, [router, searchParams]);
  
  const fetchUserIdAndStartConversation = async (user, conversationId, itemId, itemTitle, otherEmail, otherName) => {
    try {
      // Fetch user ID by email
      const response = await fetch(`http://localhost:5000/api/user-by-email?email=${encodeURIComponent(otherEmail)}`);
      const data = await response.json();
      
      if (data.user) {
        const newConv = {
          conversation_id: conversationId,
          item_id: itemId,
          item_type: 'FOUND',
          item_title: itemTitle || 'Item',
          other_user_id: data.user.id,
          other_user_name: otherName || data.user.full_name,
          other_user_email: otherEmail,
          last_message: '',
          last_message_time: new Date().toISOString(),
          unread_count: 0
        };
        setSelectedConversation(newConv);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.conversation_id);
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        loadMessages(selectedConversation.conversation_id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages/conversations?user_id=${userId}`);
      const data = await response.json();
      setConversations(data.conversations || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/messages?conversation_id=${conversationId}`);
      const data = await response.json();
      setMessages(data.messages || []);
      
      // Mark unread messages as read
      const unreadMessages = data.messages.filter(
        m => m.receiver_id === currentUser.id && m.is_read === 0
      );
      for (const msg of unreadMessages) {
        await fetch(`http://localhost:5000/api/messages/${msg.message_id}/read`, {
          method: 'PUT'
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation.conversation_id,
          sender_id: currentUser.id,
          sender_name: currentUser.name,
          sender_email: currentUser.email,
          receiver_id: selectedConversation.other_user_id,
          receiver_name: selectedConversation.other_user_name,
          receiver_email: selectedConversation.other_user_email,
          message_text: newMessage,
          item_id: selectedConversation.item_id,
          item_type: selectedConversation.item_type,
          item_title: selectedConversation.item_title
        })
      });

      if (response.ok) {
        setNewMessage('');
        loadMessages(selectedConversation.conversation_id);
        loadConversations(currentUser.id); // Refresh conversation list
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Messages</h1>

        <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-gray-400 text-center">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-gray-400 text-center">
                  <p className="mb-2">No messages yet</p>
                  <p className="text-sm">Start a conversation from your claims in the dashboard!</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition ${
                      selectedConversation?.conversation_id === conv.conversation_id ? 'bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-white">{conv.other_user_name}</h3>
                      <span className="text-xs text-gray-500">{formatTime(conv.last_message_time)}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-1 truncate">{conv.last_message}</p>
                    <p className="text-xs text-gray-500 truncate">
                      Re: {conv.item_title}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                        {conv.unread_count} new
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-700 bg-gray-800">
                    <h2 className="text-lg font-semibold text-white">{selectedConversation.other_user_name}</h2>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => {
                      const isSender = msg.sender_id === currentUser.id;
                      return (
                        <div key={msg.message_id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isSender ? 'bg-blue-600' : 'bg-gray-700'} rounded-lg p-3`}>
                            <p className="text-white">{msg.message_text}</p>
                            <p className="text-xs text-gray-300 mt-1">
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t border-gray-700 bg-gray-800">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 bg-gray-900 text-white border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {sending ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-lg">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm">
            <Link href="/about" className="hover:text-gray-300 transition-colors">About</Link>
            <Link href="/how-it-works" className="hover:text-gray-300 transition-colors">How It Works</Link>
            <Link href="/faq" className="hover:text-gray-300 transition-colors">FAQ</Link>
            <Link href="/report-bug" className="hover:text-gray-300 transition-colors">Report Bug / Issue</Link>
            <Link href="/contact" className="hover:text-gray-300 transition-colors">Contact</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
          </div>
          <div className="mt-4 text-gray-400 text-xs">
            © 2025 TraceBack — Made for campus communities. Built by Team Bravo (Fall 2025), Kent State University.
          </div>
        </div>
      </footer>
    </div>
  );
}
