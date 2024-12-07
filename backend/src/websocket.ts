import { Server as WebSocketServer, WebSocket } from 'ws';
import { MongoClient, ObjectId, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL!;
const DATABASE_NAME = process.env.DATABASE_NAME!;
const JWT_SECRET = process.env.JWT_SECRET!;

let db: Db;
let chatCollection: Collection<ChatDocument>;

const users = new Map<string, WebSocket>(); // Map to store connected users and their WebSocket connections

MongoClient.connect(MONGO_URL)
    .then((client) => {
        db = client.db(DATABASE_NAME);
        chatCollection = db.collection('chats');
        console.log(`Connected to MongoDB database: ${DATABASE_NAME}`);
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    });

interface ChatMessage {
    sender: string;
    recipientId: string;
    message: string;
    timestamp: Date;
    readBy: string[];
}
  
interface MessageData {
    type: 'send-message' | 'read-receipt';
    token?: string;
    sender: string;
    recipientId?: string;
    message?: string;
    messageId?: string;
}

interface ChatDocument {
    participants: string[];
    messages: ChatMessage[];
}

interface AuthPayload {
    id: string;
    username: string;
    role: string;
}

// Function to verify and decode JWT
const verifyToken = (token: string): AuthPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch {
        return null;
    }
};

export default function setupWebSocket(server: any): void {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket, req) => {
        // Extract userId
        const query = req.url ? new URLSearchParams(req.url.split('?')[1]) : null;
        const token = query ? query.get('token') : null;

        if (!token) {
            ws.close(1008, 'Unauthorized: No token provided'); // Close connection with code 1008
            return;
        }

        const user = verifyToken(token);
        if (!user) {
            ws.close(1008, 'Unauthorized: Invalid token'); // Close connection with code 1008
            return;
        }

        const userId = user.id;
        console.log(`User connected: ${user.username} (${userId})`);
        users.set(userId, ws);

        ws.on('message', async (data: string) => {
            try {
                const messageData = JSON.parse(data) as MessageData;

                if (messageData.type === 'send-message' && messageData.recipientId && messageData.message) {
                    // Send message logic
                    const { sender, recipientId, message } = messageData;

                    // Save message to MongoDB
                    const chatMessage: ChatMessage = {
                        sender,
                        recipientId,
                        message,
                        timestamp: new Date(),
                        readBy: [], // Initially empty, will be updated when recipient reads it
                    };

                    // Check if a chat between participants exists
                    const existingChat = await chatCollection.findOne({ participants: { $all: [sender, recipientId] } });
                    if (existingChat) {
                        // Chat exists, update it by pushing the new message
                        await chatCollection.updateOne(
                            { participants: { $all: [sender, recipientId] } }, // Find chat between participants
                            { $push: { messages: chatMessage } } // Add message to chat
                        );
                    } else {
                        // Chat does not exist, create a new document
                        await chatCollection.insertOne({
                            participants: [sender, recipientId],
                            messages: [chatMessage],
                        });
                    }

                    const recipientWs = users.get(recipientId);

                    // Send message to recipient if they're online
                    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                        recipientWs.send(JSON.stringify({ type: 'send-message', ...chatMessage }));
                    }
                } else if (messageData.type === 'read-receipt' && messageData.messageId) {
                    // Read receipt logic
                    const { messageId, sender } = messageData;

                    await chatCollection.updateOne(
                        { 'messages._id': new ObjectId(messageId) },
                        { $addToSet: { 'messages.$.readBy': sender } }
                    );

                    // Notify sender that their message has been read
                    const senderWs = users.get(messageData.sender);
                    if(senderWs && senderWs.readyState === WebSocket.OPEN){
                        senderWs.send(
                            JSON.stringify({
                                type: 'read-receipt',
                                messageId,
                                recipientId: userId,
                            })
                        );
                    }
                } else {
                    ws.send(JSON.stringify({ error: 'Invalid message type or missing fields' }));
                }
            } catch (error) {
                console.error('Error handling message:', error);
                ws.send(JSON.stringify({ error: 'Failed to process message' }));
            }
        });
    
        ws.on('close', () => {
            console.log(`User disconnected: ${user.username} (${userId})`);
            users.delete(userId);
        });

        ws.on('error', (error) => {
            console.error(`WebSocket error for user ${user.username} (${userId}):`, error);
        });
    });

    console.log('WebSocket server is ready');
}
