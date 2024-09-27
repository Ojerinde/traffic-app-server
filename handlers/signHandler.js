const catchAsync = require("../utils/catchAsync");

exports.signalDataHandler = catchAsync(async (ws, clients, payload) => {
  console.log("Received signal data from Hardware", payload);
  return clients.forEach((client) => {
    client.send(
      JSON.stringify({
        event: "type_feedback",
        payload,
      })
    );
  });
});
