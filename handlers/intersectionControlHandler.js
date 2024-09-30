const { UserDeviceState } = require("../models/appModel");
const catchAsync = require("../utils/catchAsync");

exports.intersectionControlRequestHandler = catchAsync(
  async (ws, clients, payload) => {
    console.log("Received intersection request data from Client", payload);

    // Get the deviceState from the database using the deviceID
    const deviceState = await UserDeviceState.findOne({
      DeviceID: payload.DeviceID,
    });

    // Check the action and send the appropriate message to the hardware

    return clients.forEach((client) => {
      if (client.clientType !== payload.DeviceID) return;
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
