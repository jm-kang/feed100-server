module.exports = function(conn, admin) {
  var route = require('express').Router();

  route.post('/device-token', (req, res, next) => {
    var uuid = req.body.uuid;
    var device_token = req.body.device_token;
    var user_id = req.decoded.user_id;

    function insertDeviceToken() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          INSERT INTO users_token_table (uuid, device_token, user_id) VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE uuid = ?, device_token = ?, user_id = ?
          `;
          conn.write.query(sql, [uuid, device_token, user_id, uuid, device_token, user_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }

    insertDeviceToken()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.post('/send-test', (req, res, next) => {
    console.log(req.body);
    sendFCM(req.body.device_token, res);
  });

  function sendFCM(device_token, res) {
    // This registration token comes from the client FCM SDKs.
    var registrationToken = device_token;

    // See the "Defining the message payload" section below for details
    // on how to define a message payload.
    var payload = {
      notification: {
        body: 'Body of your push notification',
        sound : "default",
        badge : "0"
      }
    };

    // Set the message as high priority and have it expire after 24 hours.
    var options = {
      priority: "high",
    };

    // Send a message to the device corresponding to the provided
    // registration token.
    admin.messaging().sendToDevice(registrationToken, payload, options)
    .then(function(response) {
      // See the MessagingDevicesResponse reference documentation for
      // the contents of response.
      console.log("Successfully sent message:", response);
      console.log(response.results);
      res.send(response);
    })
    .catch(function(error) {
      console.log("Error sending message:", error);
      res.send(error);
    });
  }
  function beginTransaction(params) {
    return new Promise(
      (resolve, reject) => {
        conn.write.beginTransaction(
          (err) => {
            if(err) reject(err);
            else {
              resolve([params[0]]);
            }
          }
        );
      }
    );
  }
  function endTransaction(params) {
    return new Promise(
      (resolve, reject) => {
        conn.write.commit(
          (err) => {
            if(err) rollback(reject, err);
            else {
              resolve([params[0]]);
            }
          }
        );
      }
    )
  }
  function rollback(reject, err) {
    conn.write.rollback(() => {
      reject(err);
    });
  }

  return route;
}
