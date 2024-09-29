const { UserDeviceState } = require("../models/appModel");
const catchAsync = require("../utils/catchAsync");

exports.deviceStateHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received State data from Hardware", payload);

  const { DeviceID, Auto, Power } = payload || {};

  if (!DeviceID) {
    return;
  }

  let deviceState = await UserDeviceState.findOne({ DeviceID });

  if (deviceState) {
    deviceState.Auto = Auto;
    deviceState.Power = Power;
    await deviceState.save();
    console.log(`Updated device state for DeviceID: ${DeviceID}`);
  } else {
    deviceState = await UserDeviceState.create({ DeviceID, Auto, Power });
    console.log(`Created new device state for DeviceID: ${DeviceID}`);
  }
  return clients.forEach((client) => {
    if (client.clientType === payload.DeviceID) return;
    console.log(
      "Sending State Message to all clients except for",
      ws.clientType,
      payload.DeviceID
    );
    client.send(
      JSON.stringify({
        event: "state_feedback",
        payload,
      })
    );
  });
});
