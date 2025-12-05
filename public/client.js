let socket;

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

let players = {};
let myId = null;
const speed = 5;

let playerName = "";

const inputField = document.getElementById('nameInput');
const button = document.getElementById('startBtn');

const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendBtn');

button.addEventListener('click', connect);
sendButton.addEventListener('click', () => {
    sendMessage(chatInput.value);
    chatInput.value = "";
});

function connect() {
    const enteredName = inputField.value.trim();

    if (enteredName === "") {
        alert("Please enter a name to start the game.");
        return;
    }

    playerName = enteredName;

    socket = io({
        auth: {
            name: enteredName
        }
    });

    socket.on('connect', () => {
        console.log('Connected to server:', enteredName);
    });
        
    socket.on('connect', () => {
        myId = socket.id;
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

    requestAnimationFrame(gameloop);
}

gameloop();