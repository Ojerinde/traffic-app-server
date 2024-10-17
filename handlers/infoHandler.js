const { UserDeviceInfo } = require("../models/appModel");
const catchAsync = require("../utils/catchAsync");

exports.infoDataRequestHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received info request data from Client", payload);
  return clients.forEach((client) => {
    if (client.clientType !== payload.DeviceID) return;
    client.send(
      JSON.stringify({
        Event: "ctrl",
        Type: "info",
        Param: {
          DeviceID: payload.DeviceID,
          Rtc: Math.floor(Date.now() / 1000),
        },
      })
    );
  });
});

exports.infoDataHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received info data from Hardware", payload);
  const { DeviceID, Bat, Temp, Rtc, Plan, Period, JunctionId } = payload || {};

  if (!DeviceID) {
    return;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeDifference = currentTime - Rtc;
  console.log("Test", currentTime, timeDifference, Rtc);
  if (timeDifference > 60 || timeDifference < -60) {
    clients.forEach((client) => {
      if (client.clientType === DeviceID) {
        client.send(
          JSON.stringify({
            Event: "ctrl",
            Type: "info",
            Param: {
              DeviceID: payload.DeviceID,
              Rtc: currentTime,
            },
          })
        );
      }
    });
    return;
  }

  let deviceInfo = await UserDeviceInfo.findOne({ DeviceID });

  if (deviceInfo) {
    deviceInfo.Bat = Bat;
    deviceInfo.Temp = Temp;
    deviceInfo.Rtc = Rtc;
    deviceInfo.Plan = Plan;
    deviceInfo.Period = Period;
    deviceInfo.JunctionId = JunctionId;
    await deviceInfo.save();
  } else {
    deviceInfo = await UserDeviceInfo.create({
      DeviceID,
      Bat,
      Temp,
      Rtc,
      Plan,
      Period,
      JunctionId,
    });
  }
  return clients.forEach((client) => {
    if (client.clientType === payload.DeviceID) return;
    client.send(
      JSON.stringify({
        event: "info_feedback",
        payload,
      })
    );
  });
});
