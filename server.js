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

    // Temporary property to store client type
    ws.clientType = null;

    ws.on("message", (message) => {
      const data = JSON.parse(message);
      console.log(`${data?.event} event received from client`);

      switch (data?.event) {
        case "identify":
          console.log(`Client identified as: ${ws.clientType}`);
          if (data.clientType) ws.clientType = data.clientType;
          break;

        default:
          console.log("Unknown event:", data.event);
      }
    });

    ws.on("ping", (event) => {
      console.log("Received ping from hardware", event);

      const message = JSON.stringify({
        event: "ping_received",
        source: "hardware",
        timestamp: new Date(),
      });

      wss.clients.forEach((client) => {
        console.log("client", client.clientType);
        if (
          client.readyState === WebSocket.OPEN &&
          client.clientType === "web_app"
        ) {
          client.send(message);
        }
      });
    });

    ws.on("close", () => {
      console.log("A client disconnected");
    });
  });

  // Handle server shutdown
  httpServer.on("close", () => {
    wss.close(() => {
      console.log("WebSocket server closed");
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
