const { UserDeviceActivity } = require("../models/appModel");
const catchAsync = require("../utils/catchAsync");

exports.activityHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received Activity data from Hardware", payload);

  const { DeviceID, Plan, Period, JunctionId } = payload || {};

  let deviceActivity = await UserDeviceActivity.findOne({ DeviceID });

  if (deviceActivity) {
    deviceActivity.Plan = Plan;
    deviceActivity.Period = Period;
    deviceActivity.JunctionId = JunctionId;
    await deviceActivity.save();
    console.log(`Updated device activity for DeviceID: ${DeviceID}`);
  } else {
    deviceActivity = await UserDeviceActivity.create({
      DeviceID,
      Plan,
      Period,
      JunctionId,
    });
    console.log(`Created new device activity for DeviceID: ${DeviceID}`);
  }
  return clients.forEach((client) => {
    if (client.clientType === payload.DeviceID) return;
    console.log(
      "Sending Prog Message to all clients except for",
      ws.clientType,
      payload.DeviceID
    );
    client.send(
      JSON.stringify({
        event: "prog_feedback",
        payload,
      })
    );
  });
});
