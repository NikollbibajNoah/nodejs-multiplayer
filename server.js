const express = require('express');
const http = require('http');

const Player = require('./player');

const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Attributes
const host = '192.168.1.136';

let players = {};

io.on('connection', (socket) => {
    const playerName = socket.handshake.auth.name || "Anonymous";
    
    console.log('Player connected:', socket.id);

    // Initialize player state
    players[socket.id] = new Player(socket.id, playerName);

    // Notify the new player of existing players
    socket.emit('currentPlayers', Object.fromEntries(
        Object.entries(players).map(([id, player]) => [id, player.toJSON()])
    ));

    // Notify all players of the new player
    socket.broadcast.emit('newPlayer', {
        id: socket.id,
        ...players[socket.id].toJSON() //x, y, color
    });

    console.log('New player connected:', playerName);

    // Update pos
    socket.on('move', (data) => {
        if (players[socket.id]) {

            players[socket.id].move(data.x, data.y);

            // Broadcast updated position to all players
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                x: data.x,
                y: data.y
            });
        }
    });

    socket.on('chatMessage', (msg) => {
        io.emit('chatMessage', {
            id: socket.id,
            name: players[socket.id].name,
            message: msg,
            color: players[socket.id].color
        });
    })

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);

        delete players[socket.id];

        io.emit('playerDisconnected', socket.id);
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log(`Server running on http://${host}:3000`);
});