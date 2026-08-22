const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Excalidraw Collaboration Server running");
});

// CN-004: Restrict CORS to known origins and Vercel deployments
const ALLOWED_ORIGINS = [
  "https://sketion.vercel.app",
  "https://my-excalidraw-nine.vercel.app",
  "http://localhost:3001",
  "http://localhost:3000",
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
];

// CN-005 + CN-013: Rate limiter to prevent message flooding
function createRateLimiter(maxEvents, windowMs) {
  const counts = new Map();
  return function isAllowed(id) {
    const now = Date.now();
    const entry = counts.get(id) || { count: 0, reset: now + windowMs };
    if (now > entry.reset) {
      entry.count = 0;
      entry.reset = now + windowMs;
    }
    if (entry.count >= maxEvents) return false;
    entry.count++;
    counts.set(id, entry);
    return true;
  };
}

const chatLimiter = createRateLimiter(20, 10000);     // 20 messages per 10s
const broadcastLimiter = createRateLimiter(60, 1000); // 60 updates per 1s

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        ALLOWED_ORIGINS.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
  },
});


// CN-001: Active collaboration room registry for strict server-side authorization
const activeRooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId, requestedRole, roomKey) => {
    socket.join(roomId);
    socket.data = socket.data || {};
    
    // Si la sala no existe en el registro del servidor, el primer socket que la abre es el host (editor)
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, {
        hostId: socket.id,
        roomKey: roomKey || null,
        clients: new Map([[socket.id, "editor"]]),
      });
      socket.data.role = "editor";
    } else {
      const roomInfo = activeRooms.get(roomId);
      // Solo permitir rol editor si es el anfitrión o si no se especificó restricción de viewer/commenter
      if (socket.id === roomInfo.hostId) {
        socket.data.role = "editor";
      } else if (requestedRole === "viewer") {
        socket.data.role = "viewer";
      } else if (requestedRole === "commenter") {
        socket.data.role = "commenter";
      } else {
        // Si no se envió rol restrictivo, hereda editor por defecto en enlaces estándar
        socket.data.role = "editor";
      }
      roomInfo.clients.set(socket.id, socket.data.role);
    }

    console.log(`[Collab] User ${socket.id} joined room ${roomId} with role: ${socket.data.role}`);

    const room = io.sockets.adapter.rooms.get(roomId);
    const clients = Array.from(room || []);
    io.to(roomId).emit("room-user-change", clients);

    socket.emit("init-room");
    socket.to(roomId).emit("new-user", socket.id);
  });

  socket.on("server-broadcast", (roomId, encryptedBuffer, iv) => {
    if (!broadcastLimiter(socket.id)) return; // CN-005: rate limit
    // Bloquear estrictamente edición si el socket tiene rol viewer o commenter
    if (socket.data?.role === "viewer" || socket.data?.role === "commenter") return;
    socket.to(roomId).emit("client-broadcast", encryptedBuffer, iv);
  });

  socket.on("server-volatile-broadcast", (roomId, encryptedBuffer, iv) => {
    if (!broadcastLimiter(socket.id)) return; // CN-005: rate limit
    // Bloquear estrictamente edición volátil si el socket tiene rol viewer o commenter
    if (socket.data?.role === "viewer" || socket.data?.role === "commenter") return;
    socket.to(roomId).emit("client-broadcast", encryptedBuffer, iv);
  });

  socket.on("server-chat", (roomId, data) => {
    if (!chatLimiter(socket.id)) return; // CN-013: rate limit chat messages
    socket.to(roomId).emit("client-chat", data);
  });

  socket.on("server-comment-create", (roomId, encryptedBuffer, iv) => {
    // Viewers no pueden crear comentarios
    if (socket.data?.role === "viewer") return;
    socket.to(roomId).emit("client-comment-create", encryptedBuffer, iv);
  });

  socket.on("server-comment-resolve", (roomId, encryptedBuffer, iv) => {
    // Viewers no pueden resolver comentarios
    if (socket.data?.role === "viewer") return;
    socket.to(roomId).emit("client-comment-resolve", encryptedBuffer, iv);
  });

  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        const room = io.sockets.adapter.rooms.get(roomId);
        const clients = Array.from(room || []).filter(
          (id) => id !== socket.id,
        );
        socket.to(roomId).emit("room-user-change", clients);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const [roomId, roomInfo] of activeRooms.entries()) {
      roomInfo.clients.delete(socket.id);
      if (roomInfo.clients.size === 0) {
        activeRooms.delete(roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Collaboration server listening on port ${PORT}`);
});
