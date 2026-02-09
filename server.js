const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
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
        socket.join(room);
        users[socket.id] = { nickname, room, x: 100, y: 100 };
        
        // Notify others
        io.to(room).emit('updateUsers', users);
    });

    socket.on('move', (position) => {
        if (users[socket.id]) {
            users[socket.id].x = position.x;
            users[socket.id].y = position.y;
            io.to(users[socket.id].room).emit('updateUsers', users);
        }
    });

    socket.on('chatMessage', (data) => {
        io.to(data.room).emit('message', data);
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
