const { createServer } = require("http");
const WebSocket = require("ws");
require("dotenv").config();

const app = require("./app");
const connectToMongoDB = require("./db");

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

let wss;

// Initialize WebSocket server
function initWebSocketServer() {
  wss = new WebSocket.Server({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("A client is connected");

    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: "ping" }));
      }
    }, 10000);

    // Handle incoming messages
    ws.on("message", (message) => {
      const data = JSON.parse(message);
      console.log(`${data?.event} event received from client`);

      if (data?.event === "pong") {
        console.log("Pong received from client");
      }

      switch (data?.event) {
        case "test":
          console.log("Test request received from web app");
          break;

        // Feedback from ESP32 device
        case "test_response":
          console.log("Test response received from device");
          break;

        default:
          console.log("Unknown event:", data.event);
      }
    });

    ws.on("close", () => {
      console.log("A client disconnected");
      clients.delete(ws);
    });
  });

  // Handle server shutdown
  httpServer.on("close", () => {
    wss.close(() => {
      console.log("WebSocket server closed");
      clearInterval(interval);
    });
  });
}

connectToMongoDB()
  .then(() => {
    console.log("Connection to MongoDB is successful.");
    httpServer.listen(PORT, () => {
      console.log("Secure websocket server running on port ->", PORT);
      initWebSocketServer();
    });
  })
  .catch((error) => {
    console.log(
      error.message || error,
      "Connection to MongoDB was unsuccessful."
    );
  });
