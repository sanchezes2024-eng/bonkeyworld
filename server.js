const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// Store user positions and data in memory
const users = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join', ({ nickname, room }) => {
    const finalNickname = nickname || 'anonymous';
    const finalRoom = room || 'default';
    
    socket.join(finalRoom);
    users[socket.id] = {
      nickname: finalNickname,
      room: finalRoom,
      x: 100,
      y: 100,
      socketId: socket.id
    };
    
    // Notify others
    io.to(finalRoom).emit('updateUsers', users);
    
    // Send join confirmation back to user
    socket.emit('joined', { nickname: finalNickname, room: finalRoom });
  });

  socket.on('move', (position) => {
    if (users[socket.id]) {
      users[socket.id].x = position.x;
      users[socket.id].y = position.y;
      io.to(users[socket.id].room).emit('updateUsers', users);
    }
  });

  socket.on('chatMessage', (data) => {
    // Broadcast to room
    io.to(data.room).emit('message', data);
    
    // Send speech event for eSpeak to read
    io.to(data.room).emit('speech', {
      name: data.name,
      msg: data.msg,
      from: data.socketId
    });
  });

  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const room = users[socket.id].room;
      delete users[socket.id];
      io.to(room).emit('updateUsers', users);
    }
  });
});

server.listen(3000, () => {
  console.log('Bonkeyworld running on http://localhost:3000');
});