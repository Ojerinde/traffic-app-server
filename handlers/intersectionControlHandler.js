const catchAsync = require("../utils/catchAsync");

exports.intersectionControlRequestHandler = catchAsync(
  async (ws, clients, payload) => {
    console.log("Received intersection request data from Client", payload);
    return clients.forEach((client) => {
      if (client.clientType !== payload.DeviceID) return;
      console.log("Sending Message to Hardware", payload.DeviceID);
      client.send(
        JSON.stringify({
          Event: "ctrl",
          Type: "state",
          Param: {
            DeviceID: payload.DeviceID,
            Auto: payload.action,
          },
        })
      );
    });
  }
);

exports.intersectionControlHandler = catchAsync(
  async (ws, clients, payload) => {
    console.log("Received intersection data from Hardware", payload);
  }
);
