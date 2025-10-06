const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

let activeChats = [];
let chatIdCounter = 1;

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('support-agent-join', () => {
    console.log('Support agent joined');
    socket.emit('active-chats', activeChats);
  });

  socket.on('client-request-support', (customerInfo) => {
    console.log('Client requested support:', customerInfo);
    const chat = {
      id: chatIdCounter++,
      customer: customerInfo,
      messages: [],
      status: 'active',
      createdAt: new Date()
    };
    activeChats.push(chat);
    io.emit('new-chat', chat); // Notify all support agents
    socket.emit('support-connected', { chatId: chat.id }); // Notify the client
    console.log('Chat created and emitted:', chat.id);
  });

  socket.on('join-chat-room', (chatId) => {
    socket.join(`chat-${chatId}`);
  });

  socket.on('send-message', ({ chatId, message }) => {
    const chat = activeChats.find(c => c.id === chatId);
    if (chat) {
      chat.messages.push(message);
      io.to(`chat-${chatId}`).emit('chat-message', { chatId, message });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
