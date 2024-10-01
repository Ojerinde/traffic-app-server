const { UserDeviceState } = require("../models/appModel");
const catchAsync = require("../utils/catchAsync");

exports.intersectionControlRequestHandler = catchAsync(
  async (ws, clients, payload) => {
    console.log("Received intersection request data from Client", payload);

    // Get the deviceState from the database using the DeviceID
    const deviceState = await UserDeviceState.findOne({
      DeviceID: payload.DeviceID,
    });

    if (!deviceState) {
      console.error(`Device with ID ${payload.DeviceID} not found.`);
      return;
    }

    let newActionValue;
    let additionalParams = {};

    switch (payload.action) {
      case "Auto":
        newActionValue = !deviceState.Auto;
        break;
      case "Manual":
        newActionValue = !deviceState.Manual;
        if (payload.duration) additionalParams.duration = payload.duration;
        if (payload.signalString)
          additionalParams.signalString = payload.signalString;
        break;
      case "Hold":
        newActionValue = !deviceState.Hold;
        break;
      case "Next":
        newActionValue = !deviceState.Next;
        break;
      case "Restart":
        newActionValue = !deviceState.Restart;
        break;
      case "Power":
        newActionValue = !deviceState.Power;
        break;
      case "Reset":
        newActionValue = !deviceState.Reset;
        break;
      default:
        console.error(`Unknown action: ${payload.action}`);
        return;
    }

    clients.forEach((client) => {
      if (client.clientType !== payload.DeviceID) return;
      client.send(
        JSON.stringify({
          Event: "ctrl",
          Type: "state",
          Param: {
            DeviceID: payload.DeviceID,
            [payload.action]: newActionValue,
            ...additionalParams,
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
