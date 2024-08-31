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

    // Temporary property to store client type
    ws.clientType = null;

    ws.on("message", (message) => {
      const data = JSON.parse(message);
      console.log(`${data?.event} event received from client`);

      switch (data?.event) {
        case "identify":
          if (data.clientType) ws.clientType = data.clientType;
          console.log(`Client identified as: ${ws.clientType}`);
          break;

        default:
          console.log("Unknown event:", data.event);
      }
    });

    ws.on("ping", (buffer) => {
      console.log("Received ping from hardware", buffer);

      const idUtf8 = buffer.toString("utf8");

      const message = JSON.stringify({
        event: "ping_received",
        source: { type: "hardware", id: idUtf8 },
        timestamp: new Date(),
      });

      wss.clients.forEach((client) => {
        console.log("client", client.clientType);
        if (
          client.readyState === WebSocket.OPEN &&
          client.clientType !== null
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
