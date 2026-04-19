const { Server } = require("socket.io");

const io = new Server(3000, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket: any) => {
    console.log("a user connected");

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });

    socket.on("chat message", (msg: string) => {
        console.log("message: " + msg);
        io.emit("chat message", msg);
    });
});