const catchAsync = require("../utils/catchAsync");

exports.downloadRequestHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received download request data from Client", payload);

  const dayToNum = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };
  // console.log("Download",{
  //   Event: "ctrl",
  //   Type: "prog",
  //   Param: {
  //     DeviceID: payload.DeviceID,
  //     Plan: dayToNum[payload.plan],
  //   },
  // });

  // Send the pattern strings to the hardware
  clients.forEach((client) => {
    if (client.clientType !== payload.DeviceID) return;
    client.send(
      JSON.stringify({
        Event: "ctrl",
        Type: "prog",
        Param: {
          DeviceID: payload.DeviceID,
          Plan: dayToNum[payload.plan],
        },
      })
    );
  });
});

exports.downloadHandler = catchAsync(async (ws, clients, payload) => {
  return clients.forEach((client) => {
    if (client.clientType === payload.DeviceID) return;
    client.send(
      JSON.stringify({
        event: "download_feedback",
        payload,
      })
    );
  });
});
