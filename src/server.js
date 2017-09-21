const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html ' });
  res.write(index);
  res.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1 ${port}`);

// pass in the http server into socketio and grab websocket as io
const io = socketio(app);

const users = [];

const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    // update number of users
    users.push(data);

    const joinMsg = {
      name: data.name,
      msg: `There are ${Object.keys(users).length} user(s) online`,
    };

    socket.name = data.name;
    socket.emit('msg', joinMsg);

    socket.join('room1');

    // announcement to everyone in the room
    const response = {
      name: 'server',
      msg: `${data.name} has joined the room.`,
    };
    socket.broadcast.to('room1').emit('msg', response);

    console.log(`${data.name} joined`);

    socket.emit('msg', { name: 'server', msg: 'You joined the room' });
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msgToServer', (data) => {
    // check what the message is, and do extra features if possible
    if (data.msg === '/me dances') { // dance event
      io.sockets.in('room1').emit('actionFromUser', { name: socket.name, msg: 'starts to dance!' });
    } else if (data.msg === '/me barrelroll') { // barrelroll event
      io.sockets.in('room1').emit('actionFromUser', { name: socket.name, msg: 'did a sick barrel roll!' });
    } else if (data.msg === '/time') { // get the current time
      const currentDate = new Date();
      const timeNow = `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`;
      socket.emit('timeReqFromUser', { time: timeNow });
    } else if (data.msg === '/me roll d6') { // roll a d6
      const randomNum = Math.floor(Math.random() * 6) + 1;
      io.sockets.in('room1').emit('actionFromUser', { name: socket.name, msg: `rolled a d6 and got ${randomNum}!` });
    } else if (data.msg === '/me roll d4') { // roll a d4
      const randomNum = Math.floor(Math.random() * 4) + 1;
      io.sockets.in('room1').emit('actionFromUser', { name: socket.name, msg: `rolled a d4 and got ${randomNum}!` });
    } else if (data.msg === '/me roll d20') { // roll a d20
      const randomNum = Math.floor(Math.random() * 20) + 1;
      io.sockets.in('room1').emit('actionFromUser', { name: socket.name, msg: `rolled a d20 and got ${randomNum}!` });
    } else {
      io.sockets.in('room1').emit('msgFromUser', { name: socket.name, msg: data.msg });
    }
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

  socket.leave('room1');
  users.pop(); // takes 1 user off of the array when they disconnect
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
