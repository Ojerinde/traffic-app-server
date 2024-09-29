const catchAsync = require("../utils/catchAsync");

exports.signalDataHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received signal data from Hardware", payload);
  return clients.forEach((client) => {
    if (client.clientType === payload.DeviceID) return;
    console.log(
      "Sending Sign Message to all clients except for",
      ws.clientType,
      payload.DeviceID
    );
    client.send(
      JSON.stringify({
        event: "sign_feedback",
        payload,
      })
    );
  });
});
