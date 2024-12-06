'use client';

import React, {useEffect, useState, useRef} from "react";
import { getUserId } from "../../../services/api";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface ChatMessage{
    _id: string;
    sender: string;
    recipientId: string;
    message: string;
    timestamp: string;
    readyBy: string[];
    type?: 'send-message' | 'read-receipt'; // Add type as optional field
}

interface DecodedToken {
    id: string;
    username: string;
    exp: number;
  }

type ChatLogs = Record<string, ChatMessage[]>;

export default function ChatPage(){
    const [message, setMessage] = useState('');
    const [chatLog, setChatLog] = useState<ChatLogs>({});
    const [userId, setUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [selectedChat, setSelectedChat] = useState<string | null>(null); // Track selected chat
    const [newChatUserId, setNewChatUserId] = useState<string>('');
    
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

    // Fetch token and user ID if authentication is passed
    useEffect(() => {
        const tokenFromStorage = localStorage.getItem('token');
        setToken(tokenFromStorage)

        if(tokenFromStorage){
            getUserId() // Call the API service to get the user ID
            .then((id) => {
            setUserId(id); // Set user ID from API
            })
            .catch((error) => {
            console.error('Error fetching user ID:', error);
            });
        }
    }, []);

    useEffect(() => {
        if(token && userId){
            ws.current = new WebSocket(`ws://localhost:5000?token=${token}`);

            ws.current.onopen = () => {
                console.log('connected to WebSocket');
            };

            ws.current.onmessage = (event) => {
                const data: ChatMessage = JSON.parse(event.data);
                const chatId = data.recipientId === userId ? data.sender : data.recipientId;

                if(data.type === 'read-receipt'){
                    setChatLog((prevLogs) => ({
                        ...prevLogs,
                        [chatId]: prevLogs[chatId]?.map((msg) => 
                            msg._id === data._id
                            ? { ...msg, readyBy: [ ...msg.readyBy, data.recipientId] }
                            : msg
                        ),
                    }));
                }
                else{
                    setChatLog((prevLogs) => ({
                        ...prevLogs,
                        [chatId]: [...(prevLogs[chatId] || []), data],
                    }));

                    sendReadReceipt(data._id, chatId);
                }
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.current.onclose = () => {
                console.log('WebSocket connection closed.');
            };

            return () => {
                ws.current?.close();
            };
        }
    }, [token, userId]);

    const createNewChat = () => {
        if(!newChatUserId) return;

        // Check if chat already exists
        if(!chatLog[newChatUserId]){
            setChatLog((prevLogs) => ({
                ...prevLogs,
                [newChatUserId]: [], // Initialize new chat with an empty array
            }));

            setSelectedChat(newChatUserId); // Automatically selects the new chat
        }

        setNewChatUserId(''); // Clear input field
    };

    const sendReadReceipt = (messageId: string, chatId: string) => {
        if(ws.current && ws.current.readyState === WebSocket.OPEN){
            ws.current.send(
                JSON.stringify({
                    type: 'read-receipt',
                    _id: messageId,
                    recipientId: userId,
                    chatId,
                })
            );
        }
    };

    const sendMessage = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN && selectedChat) {
            const newMessage: ChatMessage = {
                _id: new Date().toISOString(), // Temporary ID
                sender: userId!,
                recipientId: selectedChat,
                message,
                timestamp: new Date().toISOString(),
                readyBy: [],
            };


            ws.current.send(
                JSON.stringify({
                type: 'send-message',
                ...newMessage,
                })
            );
    
          // Add sent message to chat log immediately
          setChatLog((prevLogs) => ({
            ...prevLogs,
            [selectedChat]: [...(prevLogs[selectedChat] || []), newMessage],
          }));

          setMessage('');
        } 
        else {
          console.error('WebSocket is not open or chat is not selected.');
        }
      };

    return (
        <div>
            {/* List of conversations */}
            <div>
                <h2>Chats</h2>
                <ul>
                    {Object.keys(chatLog).map((chatId) => (
                        <li
                        key={chatId}
                        onClick={() => setSelectedChat(chatId)}
                        style={{
                            cursor: 'pointer',
                            fontWeight: selectedChat === chatId ? 'bold' : 'normal',
                        }}
                        >
                            Chat with {chatId}
                        </li>
                    ))}
                </ul>

                {/* New Chat creation */}
                <div>
                    <input 
                    type="text"
                    value={newChatUserId}
                    onChange={(e) => setNewChatUserId(e.target.value)}
                    placeholder="Enter User ID to chat with"
                    />
                    <button onClick={createNewChat}>Create New Chat</button>
                </div>
            </div>

            {/* Chat Messages */}
            <div>
                <h2>Chat Log</h2>
                {selectedChat && chatLog[selectedChat] ? ( // Check if selected chat exists
                    <>
                        <div>
                            {chatLog[selectedChat]?.map((msg, index) => (
                                <div key={index}>
                                    <strong>{msg.sender}</strong>: {msg.message}
                                    <span style={{ fontSize: '0.8em', color: 'gray' }}>
                                        {' '}
                                        - {new Date(msg.timestamp).toLocaleTimeString()}
                                        {msg.readyBy.includes(userId ?? '') && ' ✓ Read'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..." 
                        />
                        <button onClick={sendMessage}>Send</button>
                    </>
                ) : (
                    <p>Please select a chat to view messages.</p>
                )}
            </div>
        </div>
    );
}