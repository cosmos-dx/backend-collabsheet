const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


app.get('/api/hello', (req, res) => {
  res.send('Hello World');
});

let roomData = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
    if (!roomData[roomId]) {
      roomData[roomId] = Array.from({ length: 50 }, () =>
        Array.from({ length: 17 }, () => ({
          value: "",
          isBold: false,
          username: "",
        }))
      );
    }

    socket.emit('initialData', roomData[roomId]);

    console.log(`${socket.id} joined room ${roomId}`);
  });

  socket.on('setUsername', (username) => {
    socket.username = username;
    io.to(socket.roomId).emit('userJoined', username);
  });

  socket.on('updateCell', (data) => {
    const { cellId, value, isBold, username } = data;
    const [row, col] = cellId.split('-').map(Number);

    if (!roomData[socket.roomId]) {
      roomData[socket.roomId] = Array.from({ length: 50 }, () =>
        Array.from({ length: 17 }, () => ({
          value: "",
          isBold: false,
          username: "",
        }))
      );
    }
    roomData[socket.roomId][row][col] = { value, isBold, username };

    io.to(socket.roomId).emit('cellUpdated', { cellId, value, isBold, username });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.username);
  });
});

server.listen(3001, () => {
  console.log('Server is running on port 3001');
});
