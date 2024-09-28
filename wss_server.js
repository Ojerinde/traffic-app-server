const { createServer } = require("https");
const WebSocket = require("ws");
const fs = require("fs");
require("dotenv").config();

const app = require("./app");
const connectToMongoDB = require("./db");
const { typeDataHandler } = require("./handlers/typeHandler");
const { signalDataHandler } = require("./handlers/signHandler");

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

      // Web application logic
      if (data.event) {
        console.log(data?.event, "recieved form client");
        switch (data?.event) {
          case "identify":
            console.log(`Client identified as:`, data);
            ws.clientType = data.clientID;
            break;

          default:
            console.log("Unknown event:", data.event);
        }
      }

      // Hardware logic
      if (data?.Event === "data") {
        console.log(`${data?.Type} data received from hardware`);
        switch (data?.Type) {
          case "identify":
            console.log(`Hardware identified as:`, data.Param.ClientID);
            ws.clientType = data.Param.ClientID;
            console.log(ws.clientType);

            break;
          case "info":
            typeDataHandler(ws, wss.clients, data?.Param);
            break;
          case "sign":
            signalDataHandler(ws, wss.clients, data?.Param);
            break;
          case "state":
            console.log(`State Param`, data?.Param);
            break;

          default:
            console.log("Unknown event:", data?.Event);
        }
      }
    });

    ws.on("ping", (buffer) => {
      const idUtf8 = buffer.toString("utf8");

      const message = JSON.stringify({
        event: "ping_received",
        source: { type: "hardware", id: idUtf8 },
        timestamp: new Date(),
      });

      wss.clients.forEach((client) => {
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
