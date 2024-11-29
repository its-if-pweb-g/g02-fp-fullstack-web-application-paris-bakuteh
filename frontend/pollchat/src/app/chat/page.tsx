'use client';

import React, {useEffect, useState, useRef} from "react";
import { getUserId } from "../../../services/api";

interface ChatMessage{
    _id: string;
    sender: string;
    recipientId: string;
    message: string;
    timestamp: string;
    readyBy: string[];
    type?: 'send-message' | 'read-receipt'; // Add type as optional field
}

export default function ChatPage(){
    const [message, setMessage] = useState('');
    const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
    const ws = useRef<WebSocket | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);


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
    }, [token]);

    useEffect(() => {
        if(token && userId){
            ws.current = new WebSocket(`ws://localhost:5000?token=${token}`);

            ws.current.onopen = () => {
                console.log('connected to WebSocket');
            };

            ws.current.onmessage = (event) => {
                const data: ChatMessage = JSON.parse(event.data);

                if(data.type === 'read-receipt'){
                    setChatLog((prevLog) => 
                        prevLog.map((msg) => 
                            msg._id === data._id
                                ? { ...msg, readyBy: [...msg.readyBy, data.recipientId] }
                                : msg
                        )
                    );
                }
                else{
                    setChatLog((prevLog) => [...prevLog, data]);
                    sendReadReceipt(data._id);
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
    }, [token]);

    const sendReadReceipt = (messageId: string) => {
        if(ws.current && ws.current.readyState === WebSocket.OPEN){
            ws.current.send(
                JSON.stringify({
                    type: 'read-receipt',
                    _id: messageId,
                    recipientId: userId,
                })
            );
        }
    };

    const sendMessage = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          const recipientId = 'recipient-user-id'; // Update this to get recipient ID dynamically
    
          ws.current.send(
            JSON.stringify({
              type: 'send-message',
              sender: userId,
              recipientId,
              message,
            })
          );
    
          setMessage('');
        } else {
          console.error('WebSocket is not open.');
        }
      };

    return (
        <div>
            <div>
                {chatLog.map((msg, index) => (
                    <div key={index}>
                        <strong>{msg.sender}</strong>: {msg.message}
                        <span style={{ fontSize: '0.8em', color: 'gray '}}>
                            {' '}
                            - {new Date(msg.timestamp).toLocaleTimeString()}
                            {msg.readyBy.includes(userId) && ' ✓ Read'}
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
        </div>
    );
}