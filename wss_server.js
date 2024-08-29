const { createServer } = require("https");
const WebSocket = require("ws");
const fs = require("fs");
require("dotenv").config();

const app = require("./app");
const connectToMongoDB = require("./db");

const PORT = 443;

const options = {
  key: fs.readFileSync(
    "/etc/letsencrypt/live/trafficapi.smartattendancesystem.com.ng/privkey.pem"
  ),
  cert: fs.readFileSync(
    "/etc/letsencrypt/live/trafficapi.smartattendancesystem.com.ng/fullchain.pem"
  ),
};

const httpsServer = createServer(options, app);

let wss;

// Initialize WebSocket server
function initWebSocketServer() {
  wss = new WebSocket.Server({ server: httpsServer, path: "/ws" });

  wss.on("connection", (ws) => {
    console.log("A client is connected");

    // Ping-Pong keep alive mechanism
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: "ping" }));
      }
    }, 10000);

    // Handle incoming messages
    ws.on("message", (message) => {
      const data = JSON.parse(message);
      console.log(`${data?.event} event received from client`);

      // Handling pong responses separately
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
      clearInterval(interval);
    });
  });

  // Handle server shutdown
  httpsServer.on("close", () => {
    wss.close(() => {
      console.log("WebSocket server closed");
    });
  });
}

connectToMongoDB()
  .then(() => {
    console.log("Connection to MongoDB is successful.");
    httpsServer.listen(PORT, () => {
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
