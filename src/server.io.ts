import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(cors());
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // Adjust according to your needs
    methods: ['GET', 'POST'],
  },
});

// Hardcoded room names
const rooms = ['stock-1', 'stock-2', 'stock-3'];

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('subscribe', (room) => {
    if (rooms.includes(room)) {
      console.log('subscribe', room);
      socket.join(room);
    }
  });

  socket.on('unsubscribe', (room) => {
    console.log('unsubscribe', room);
    socket.leave(room);
  });

  socket.on('send_message', (data) => {
    console.log('send_message', data);
    if (rooms.includes(data.room)) {
      socket.to(data.room).emit('message', data);
    }
  });

  socket.on('send_global_message', (data) => {
    console.log('send_global_message', data);
    socket.broadcast.emit('receive_global_message', data);
  });

  socket.on('disconnect', () => {
    console.log(`User Disconnected: ${socket.id}`);
  });
});

// Emit a message to each room every interval
const emitMessagesToRooms = () => {
  rooms.forEach((room) => {
    setInterval(() => {
      const message = {
        channel: room,
        message: `New message in ${room} at ${new Date().toLocaleTimeString()}`,
      };
      io.to(room).emit('message', message);
    }, 1000); // Adjust interval as needed
  });
};

server.listen(3001, () => {
  console.log('SERVER IS RUNNING');
  emitMessagesToRooms();
});
