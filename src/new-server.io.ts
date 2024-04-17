import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

const app = express();
app.use(cors());
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Adjust according to your needs
    methods: ["GET", "POST"],
  },
  path: "/market/ws",
});

const defaultStocks = [
  "APPLE",
  "GOOGLE",
  "AMAZON",
  "FACEBOOK",
  "MICROSOFT",
  "TESLA",
  "NETFLIX",
  "NVIDIA",
  "AMD",
  "INTEL",
];
const randomNumber = (min = 1000.0, max = 1500.0) => {
  const randomNum = Math.random() * (max - min) + min;
  const roundedNum = Math.round(randomNum * 100) / 100;
  const price = roundedNum.toFixed(2);

  return parseFloat(price);
};
const intervals: Map<string, NodeJS.Timeout> = new Map();

const handleSocketEvent = (
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  // ================== unsubscribe ==================
  socket.on("unsubscribe", (channel: string) => {
    console.log("unsubscribe ==>", { channel });
    socket.leave(channel);
  });

  // ================== disconnect ==================
  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
  });

  // ================== subscribe: DEFAULT_STOCKS_LIST ==================
  socket.on("DEFAULT_STOCKS_LIST", () => {
    console.log("subscribe DEFAULT_STOCKS_LIST");

    const subjects = defaultStocks.map((stock) => {
      return `PRICING/${stock}`;
    });
    socket.emit("DEFAULT_STOCKS_LIST", subjects);

    defaultStocks.forEach((stock) => {
      // ================== subscribe: PRICING/{stock} ==================
      socket.on(`PRICING/${stock}`, () => {
        const subject = `PRICING/${stock}`;

        // not process when already joined
        if (!socket.rooms.has(subject)) {
          console.log(`subscribe ${subject}, client: ${socket.id}`);

          socket.join(subject);

          // clear interval if already exists
          if (intervals.has(subject)) {
            clearInterval(intervals.get(subject));
            intervals.delete(subject);
          }
          const interval = setInterval(() => {
            const price = randomNumber();
            io.to(subject).emit(subject, price);
          }, randomNumber(1000, 2000));

          intervals.set(subject, interval);
        }
      });
    });
  });
};

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // handle socket events once connected
  handleSocketEvent(socket);
});

server.listen(3001, () => {
  console.log("SERVER IS RUNNING");
});
