const express = require('express');
const http = require('http');

const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = {};

io.on('connection', (socket) => {
    const playerName = socket.handshake.auth.name || "Anonymous";
    
    console.log('Player connected:', socket.id);

    // Initialize player state
    players[socket.id] = {
        x: Math.random() * 500,
        y: Math.random() * 500,
        name: playerName,
        color: "#" + Math.floor(Math.random()*16777215).toString(16)
    };

    // Notify the new player of existing players
    socket.emit('currentPlayers', players);

    // Notify all players of the new player
    socket.broadcast.emit('newPlayer', {
        id: socket.id,
        ...players[socket.id] //x, y, color
    });

    console.log('New player connected:', playerName);

    // Update pos
    socket.on('move', (data) => {
        if (players[socket.id]) {

            players[socket.id].x = data.x;
            players[socket.id].y = data.y;

            // Broadcast updated position to all players
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                x: data.x,
                y: data.y
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);

        delete players[socket.id];

        io.emit('playerDisconnected', socket.id);
    });
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});