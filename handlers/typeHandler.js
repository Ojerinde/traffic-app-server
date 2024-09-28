const catchAsync = require("../utils/catchAsync");

exports.typeDataHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received info data from Hardware", payload);
  return clients.forEach((client) => {
    if (client.clientType === payload.DeviceID) return;
    console.log(
      "Sending Message to all clients",
      ws.clientType,
      payload.DeviceID
    );

    client.send(
      JSON.stringify({
        event: "info_feedback",
        payload,
      })
    );
  });
});
