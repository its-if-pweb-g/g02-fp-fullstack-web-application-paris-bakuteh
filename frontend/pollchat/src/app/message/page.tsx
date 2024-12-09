'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../../services/api';
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import Navbar from '../../components/Navbar';

interface ChatMessage {
  _id: string;
  sender: string;
  recipient: string;
  message: string;
  timestamp: string;
  readBy: string[];
}

interface MessageData {
  type: 'send-message' | 'read-receipt' | 'fetch-messages';
  token?: string;
  sender: string;
  recipient?: string;
  message?: string;
  messageId?: string;
  _id?: string;
  tempId?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

interface DecodedToken {
  id: string;
  username: string;
  exp: number;
}

type ChatLogs = Record<string, ChatMessage[]>;

export default function ChatPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentChatRecipient, setCurrentChatRecipient] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLog, setChatLog] = useState<ChatLogs>({});
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [user, setUser] = useState<{ id: string; username: string; email: string} | null>(null);

  const router = useRouter();

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        const currentTime = Math.floor(Date.now() / 1000);

        if (decoded.exp < currentTime) {
          // Token expired, redirect to login
          localStorage.removeItem('token');
          router.push('/login');
        }

        //If token is valid, then fetch user details
        else{
          api.fetchUserDetails(decoded.id)
            .then((userData) => setUser(userData))
            .catch((err) => {
              console.error(err);
              router.push('/login');
            });
          setToken(token);
          setUserId(decoded.id);
        }
      } catch (error) {
        // Invalid token, redirect to login
        localStorage.removeItem('token');
        router.push('/login');
      }
    } else {
      // No token, redirect to login
      router.push('/login');
    }
  }, [router]);

  // Fetch token and user ID if authentication is passed + current user
  useEffect(() => {
    if(token){
      const fetchUsers = async () => {
        try {
          const userList = await api.getUsers(token);
          setUsers(userList);
          setFilteredUsers(userList);
        } catch (err) {
          console.error('Failed to fetch users:', err);
        }
      };

      fetchUsers();
    }
  }, [token, userId]);

  useEffect(() => {
    if (token) {
      const connectWebSocket = () => {
        ws.current = new WebSocket(`ws://localhost:5000/?token=${token}`);
        ws.current.onopen = () => console.log('WebSocket connected');
        ws.current.onmessage = (event) => handleWebSocketMessage(event);
        ws.current.onclose = () => setTimeout(connectWebSocket, 5000);
        ws.current.onerror = console.error;
      };
      connectWebSocket();
      return () => ws.current?.close();
    }
  }, [token]);

  const handleWebSocketMessage = (event: MessageEvent) => {
    try {
      const data: MessageData = JSON.parse(event.data);

      if (data.type === 'send-message' && data._id && data.tempId) {
        const chatId = data.sender === userId ? data.recipient! : data.sender;

        setChatLog((prevLogs) => ({
          ...prevLogs,
          [chatId]: prevLogs[chatId]?.map((msg) =>
            msg._id === data.tempId ? { ...msg, _id: data._id! } : msg
          ) || [],
        }));
      } else if (data.type === 'fetch-messages' && Array.isArray(data.message)) {
        setMessages(data.message);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    setFilteredUsers(
      users.filter((user) =>
        user.username.toLowerCase().includes(query.toLowerCase())
      )
    );
  };

  const handleSelectUser = (recipient: User) => {
    setCurrentChatRecipient(recipient);
    setMessages([]); // Clear messages for the new chat

    console.log('currentUser:', user);
    console.log('currentChatRecipient:', recipient);

    // Request chat history for the selected user
    if (user) {
      api.fetchChatMessages(user.id, recipient.id)
        .then((chatMessages) => {
          setMessages(chatMessages); // Update state with the fetched messages
        })
        .catch((err) => {
          console.error('Error fetching chat history:', err);
        });
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentChatRecipient || !user || !ws.current) return;

    const tempId = `${Date.now()}-${user.id}`;

    const chatMessage: ChatMessage = {
      _id: tempId,
      sender: user.id,
      recipient: user.id,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      readBy: [],
    };

    ws.current.send(JSON.stringify({
      type: 'send-message',
      sender: user.id,
      recipient: currentChatRecipient.id,
      message: newMessage.trim(),
      tempId,
    }));

    setChatLog((prevLogs) => ({
      ...prevLogs,
      [currentChatRecipient.id]: [...(prevLogs[currentChatRecipient.id] || []), chatMessage],
    }));
    setNewMessage('');
  };

  useEffect(() => {
    if (currentChatRecipient) {
      const unreadMessages = messages.filter(
        (msg) => !msg.readBy.includes(userId)
      );
      unreadMessages.forEach((msg) => {
        ws.current?.send(
          JSON.stringify({
            type: 'read-receipt',
            messageId: msg._id,
            sender: userId,
          })
        );
      });
    }
  }, [messages]);

  return (
    <>
      <Navbar currentPath="/message" currentUsername={user?.username || ''} currentEmail={user?.email || ''}/>
      <div className="flex h-screen">

        {/* Sidebar */}
        <div className="w-1/6 bg-gray-800 text-white p-4">
          <input
            type="text"
            className="w-full p-2 rounded-md bg-gray-700 text-white mb-4"
            placeholder="Search users"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <ul className="space-y-2">
            {filteredUsers.map((user, index) => (
              <li
                key={user.id || index}
                onClick={() => handleSelectUser(user)}
                className={`p-2 rounded-md cursor-pointer ${
                  user.id === currentChatRecipient?.id
                    ? 'bg-blue-500'
                    : 'hover:bg-gray-700'
                }`}
              >
                {user.username}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col bg-gray-100">
          {currentChatRecipient ? (
            <>

              {/* Chat Header */}
              <div className="p-4 bg-blue-500 text-white font-semibold">
                <h3>Chat with {currentChatRecipient.username}</h3>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.sender === userId ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg max-w-xs ${
                        msg.sender === userId
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-black'
                      }`}
                    >
                      <p>{msg.message}</p>
                      <small className="block text-xs text-gray-600">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 flex items-center bg-white border-t">
                <input
                  type="text"
                  className="flex-1 p-2 rounded-md border border-gray-300 text-black"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                  onClick={handleSendMessage}>Send</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a user to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
