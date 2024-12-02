import { Server as WebSocketServer, WebSocket } from 'ws';
import { MongoClient, ObjectId, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL!;
const DATABASE_NAME = process.env.DATABASE_NAME!;

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
    sender: string;
    recipientId?: string;
    message?: string;
    messageId?: string;
    senderId?: string;
}

interface ChatDocument {
    participants: string[];
    messages: ChatMessage[];
}

export default function setupWebSocket(server: any): void {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws: WebSocket, req) => {
        // Extract userId
        const query = req.url ? new URLSearchParams(req.url.split('?')[1]) : null;
        const userId = query ? query.get('userId') : null;

        if(!userId){
            ws.close(); // Close the connection if user ID is missing
            return;
        }

        console.log(`User connected: ${userId}`);
        users.set(userId, ws);
    
        ws.on('message', async (data: string) => {
            try {
                const messageData = JSON.parse(data) as MessageData;

                if (messageData.type === 'send-message' && messageData.recipientId && messageData.message) {
                    // Send message logic
                    const { sender, recipientId, message } = messageData;
                    console.log(`Received message from ${sender} to ${recipientId}: ${message}`);

                    // Save message to MongoDB
                    const chatMessage: ChatMessage = {
                        sender,
                        recipientId,
                        message,
                        timestamp: new Date(),
                        readBy: [], // Initially empty, will be updated when recipient reads it
                    };

                    await chatCollection.updateOne(
                        { participants: { $all: [sender, recipientId] } }, // Find chat between participants
                        {
                            $setOnInsert: { participants: [sender, recipientId], messages: [] }, // Set participants if new
                            $push: { messages: chatMessage }, // Add message to chat
                        },
                        { upsert: true } // Creates the chat if it doesn't exist yet
                    );

                    const recipientWs = users.get(recipientId);

                    // Send message to recipient if they're online
                    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                        recipientWs.send(JSON.stringify({ ...chatMessage, type: 'send-message' }));
                    }
                } else if (messageData.type === 'read-receipt' && messageData.messageId && messageData.senderId) {
                    // Read receipt logic
                    const { messageId, recipientId } = messageData;

                    await chatCollection.updateOne(
                        { 'messages._id': new ObjectId(messageId) },
                        { $addToSet: { 'messages.$.readBy': recipientId } }
                    );

                    // Notify sender that their message has been read
                    const senderWs = users.get(messageData.senderId);
                    if(senderWs && senderWs.readyState === WebSocket.OPEN){
                        senderWs.send(
                            JSON.stringify({
                                type: 'read-receipt',
                                messageId,
                                recipientId,
                            })
                        );
                    }
                }
            } catch (error) {
                console.error("Error handling message:", error);
            }
        });
    
        ws.on('close', () => {
            console.log(`User disconnected: ${userId}`);
            users.delete(userId);
        });
    });
}
