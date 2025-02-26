const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

let players = {};

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  players[socket.id] = {
    x: Math.random() * 500,
    y: Math.random() * 400,
    color: getRandomColor(),
    name: `Player${Object.keys(players).length + 1}`,
    trail: [],
  };

  io.emit("updatePlayers", players);

  socket.on("move", (data) => {
    if (players[socket.id]) {
      let player = players[socket.id];

      // Move main player
      let prevX = player.x;
      let prevY = player.y;
      player.x += data.dx;
      player.y += data.dy;

      // Move train trail
      for (let i = player.trail.length - 1; i > 0; i--) {
        player.trail[i].x = player.trail[i - 1].x;
        player.trail[i].y = player.trail[i - 1].y;
      }
      if (player.trail.length > 0) {
        player.trail[0].x = prevX;
        player.trail[0].y = prevY;
      }

      checkCollision(socket.id);
      io.emit("updatePlayers", players);
    }
  });

  const checkCollision = (moverId) => {
    for (let id in players) {
      if (id !== moverId) {
        let p1 = players[moverId];
        let p2 = players[id];

        if (
          p1.x < p2.x + 20 &&
          p1.x + 20 > p2.x &&
          p1.y < p2.y + 20 &&
          p1.y + 20 > p2.y
        ) {
          console.log(`${p1.name} touched ${p2.name}`);
          
          // Add out player as trail
          p1.trail.push({ x: p2.x, y: p2.y, color: p2.color });

          delete players[id]; // Out opponent
          io.emit("updatePlayers", players);
          return;
        }
      }
    }
  };

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit("updatePlayers", players);
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
