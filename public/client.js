let socket;

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

let players = {};
let myId = null;
const speed = 5;

let playerName = "";
let roomName = "";

const inputField = document.getElementById('nameInput');
const roomInputField = document.getElementById('roomInput');
const button = document.getElementById('startBtn');

const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendBtn');

button.addEventListener('click', connect);
sendButton.addEventListener('click', () => {
    sendMessage(chatInput.value);
    chatInput.value = "";
});

let startX, startY;

canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];

    startX = touch.clientX;
    startY = touch.clientY;
});


canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();

    const touch = e.touches[0];

    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    input.up = dy < -30;
    input.down = dy > 30;
    input.left = dx < -30;
    input.right = dx > 30;
});

canvas.addEventListener('touchend', (e) => {
    input.up = input.down = input.left = input.right = false;
});


function connect() {
    const enteredName = inputField.value.trim();
    const enteredRoom = roomInputField.value.trim().toUpperCase();

    if (enteredName === "") {
        alert("Please enter a name to start the game.");
        return;
    }

    playerName = enteredName;
    roomName = enteredRoom || null;

    socket = io({
        auth: {
            name: enteredName,
            room: enteredRoom
        }
    });
        
    socket.on('connect', () => {
        myId = socket.id;
        console.log('Connected to server:', enteredName, 'in room:', enteredRoom);
    });

    socket.on('currentPlayers', (data) => {
        players = data;
    });

    socket.on('newPlayer', (data) => {
        players[data.id] = data;

        console.log('New player connected:', playerName);
    });

    socket.on('chatMessage', (data) => {
        const chat = document.getElementById('chatBox');
        chat.innerHTML += `<div><span style="color:${data.color}">${data.name}:</span> ${data.message}</div>`;
    })

    socket.on('playerMoved', (data) => {
        if (players[data.id]) {
            players[data.id].x = data.x;
            players[data.id].y = data.y;
        }
    });

    socket.on('playerDisconnected', (id) => {
        delete players[id];
    });


    document.getElementById('overlay').style.display = 'none';
}

function resizeCanvas() {
    if (isMobile()) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        canvas.width = 800;
        canvas.height = 600;
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function sendMessage(msg) {
    socket.emit('chatMessage', msg);
}

let input = {
    up: false,
    down: false,
    left: false,
    right: false
};

document.addEventListener('keydown', (e) => {
    if (e.key === "w") input.up = true;
    if (e.key === "s") input.down = true;
    if (e.key === "a") input.left = true;
    if (e.key === "d") input.right = true;
});


document.addEventListener('keyup', (e) => {
    if (e.key === "w") input.up = false;
    if (e.key === "s") input.down = false;
    if (e.key === "a") input.left = false;
    if (e.key === "d") input.right = false;
});

function isMobile() {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

function gameloop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const me = players[myId];

    if (me) {
        if (input.up) me.y -= speed;
        if (input.down) me.y += speed;
        if (input.left) me.x -= speed;
        if (input.right) me.x += speed;

        socket.emit('move', {
            x: me.x,
            y: me.y
        });
    }

    for (let id in players) {
        const p = players[id];

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 12, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = "white";
        ctx.font = "18px Arial";
        ctx.fillText(p.name, p.x - 18, p.y - 18);
    }

    ctx.fillStyle = "white";
    ctx.font = "14px Arial";
    ctx.fillText(`Room: ${roomName}`, 10, 20);

    requestAnimationFrame(gameloop);
}

gameloop();