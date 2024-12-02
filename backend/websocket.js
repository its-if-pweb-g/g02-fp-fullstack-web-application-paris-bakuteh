const WebSocket = require('ws');
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URL = `mongodb+srv://Ferzen_K:${encodeURIComponent(process.env.MONGO_PASSWORD)}@fp-pweb.lhejd.mongodb.net/?retryWrites=true&w=majority&appName=FP-PWEB`;
let db = null;
let chat_collection = null;
let users = new Map(); // Map to store connected users and their WebSocket connections

async function connectToDatabase() {
  const client = await MongoClient.connect(MONGO_URL);
  db = client.db();
  chat_collection = db.collection('chats');
}

connectToDatabase();

function setupWebSocket(server){
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        // Extract userId
        const params = new URLSearchParams(req.url.split('?')[1]);
        const userId = params.get('userId');

        if(!userId){
            ws.close(); // Close the connection if user ID is missing
            return;
        }

        console.log(`User connected: ${userId}`);
        users.set(userId, ws);
    
        ws.on('message', async (data) => {
            const messageData = JSON.parse(data);

            if(messageData.type === 'send-message'){
                // Send message logic
                const { sender, recipientId, message } = messageData;
                console.log(`Received message from ${sender} to ${recipientId}: ${message}`);

                // Save message to MongoDB
                const chatMessage = {
                    sender,
                    recipientId,
                    message,
                    timestamp: new Date(),
                    readyBy: [], // Initially empty, will be updated when recipient reads it
                };

                await chat_collection.updateOne(
                    { participants: { $all: [sender, recipientId] } }, // Find chat between participants
                    { $push: { messages: chatMessage } },
                    { upsert: true } // Creates the chat if it doesn't exist yet
                );

                const recipientWs = users.get(recipientId);

                // Send message to recipient if they're online
                if(recipientWs && recipientWs.readyState === WebSocket.OPEN){
                    recipientWs.send(JSON.stringify({...chatMessage, type: 'send-message'}));
                }

                else if(messageData.type === 'read-receipt'){
                    // Read receipt logic
                    const { messageId, recipientId } = messageData;

                    await chat_collection.updateOne(
                        { 'messages._id': new ObjectId(messageId) },
                        { $addToSet: { 'messages.$.readyBy': recipientId} }
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
            }
        });
    
        ws.on('close', () => {
            console.log(`User disconnected: ${userId}`);
            users.delete(userId);
        });
    });
}

module.exports = setupWebSocket;