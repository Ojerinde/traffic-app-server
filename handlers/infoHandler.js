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
          Rtc: Math.floor(Date.now() / 1000 + 3600),
        },
      })
    );
  });
});

exports.infoDataHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received info data from Hardware", payload);
  const { DeviceID, North, East, West, South, Rtc, Plan, Period, JunctionId } =
    payload || {};

  if (!DeviceID) {
    return;
  }

  const currentTime = Math.floor(Date.now() / 1000 + 3600);
  // const readableTime = new Date(currentTime * 1000).toLocaleTimeString();
  const timeDifference = currentTime - Rtc;

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
    deviceInfo.North = North;
    deviceInfo.East = East;
    deviceInfo.West = West;
    deviceInfo.South = South;
    deviceInfo.Rtc = Rtc;
    deviceInfo.Plan = Plan;
    deviceInfo.Period = Period;
    deviceInfo.JunctionId = JunctionId;
    await deviceInfo.save();
  } else {
    deviceInfo = await UserDeviceInfo.create({
      DeviceID,
      North,
      East,
      West,
      South,
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
