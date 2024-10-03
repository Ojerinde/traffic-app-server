const { UserDeviceState } = require("../models/appModel");
const catchAsync = require("../utils/catchAsync");

exports.stateDataRequestHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received state request data from Client", payload);
  return clients.forEach((client) => {
    if (client.clientType !== payload.DeviceID) return;
    client.send(
      JSON.stringify({
        Event: "ctrl",
        Type: "state",
        Param: {
          DeviceID: payload.DeviceID,
        },
      })
    );
  });
});

exports.deviceStateHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received State data from Hardware", payload);

  const { DeviceID, Auto, Power, Manual, Next, Hold, Reset, Restart } =
    payload || {};

  if (!DeviceID) {
    return;
  }

  let deviceState = await UserDeviceState.findOne({ DeviceID });

  if (deviceState) {
    deviceState.Auto = Auto === "1" ? true : false;
    deviceState.Power = Power === "1" ? true : false;
    deviceState.Manual = Manual;
    deviceState.Next = Next;
    deviceState.Hold = Hold;
    deviceState.Reset = Reset;
    deviceState.Restart = Restart;
    await deviceState.save();
  } else {
    deviceState = await UserDeviceState.create({
      DeviceID,
      Auto: Auto === "1" ? true : false,
      Power: Power === "1" ? true : false,
      Manual,
      Next,
      Hold,
      Reset,
      Restart,
    });
  }
  return clients.forEach((client) => {
    if (client.clientType === payload.DeviceID) return;
    client.send(
      JSON.stringify({
        event: "state_feedback",
        payload,
      })
    );
  });
});
