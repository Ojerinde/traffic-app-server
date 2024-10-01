const { UserDeviceInfo } = require("../models/appModel");
const catchAsync = require("../utils/catchAsync");

exports.infoDataHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received info data from Hardware", payload);
  const { DeviceID, Bat, Temp, Rtc } = payload || {};

  if (!DeviceID) {
    return;
  }

  let deviceInfo = await UserDeviceInfo.findOne({ DeviceID });

  if (deviceInfo) {
    deviceInfo.Bat = Bat;
    deviceInfo.Temp = Temp;
    deviceInfo.Rtc = Rtc;
    await deviceInfo.save();
  } else {
    deviceInfo = await UserDeviceInfo.create({ DeviceID, Bat, Temp, Rtc });
  }
  return clients.forEach((client) => {
    // if (client.clientType === payload.DeviceID) return;
    client.send(
      JSON.stringify({
        event: "info_feedback",
        payload,
      })
    );
  });
});
