module.exports = function(conn) {
  var route = require('express').Router();
  var formidable = require('formidable');
  var AWS = require('aws-sdk');
  AWS.config.region = 'ap-northeast-2';
  var admin = require("firebase-admin");

  var serviceAccount = require("../feed100-158308-firebase-adminsdk-y80ka-3bfaf63af8.json");

  admin.initializeApp({
   credential: admin.credential.cert(serviceAccount),
   databaseURL: "https://feed100-158308.firebaseio.com"
  });

  route.post('/upload/:folder', (req, res, next) => {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
        var s3 = new AWS.S3();
        var params = {
             Bucket:'elasticbeanstalk-ap-northeast-2-035223481599',
             Key:req.params.folder+'/'+(+new Date())+files.ex_filename.name,
             ACL:'public-read',
             Body: require('fs').createReadStream(files.ex_filename.path)
        }
        if(files.ex_filename.size != 0) {
          s3.upload(params, function(err, data){
            var result='';
            if(err) {
              console.log(err);
               return next(err);
            }
            else {
              result = data.Location;
              res.send(result);
            }
          });
        }
        else {
          res.send('');
        }

    });
  });

  route.post('/move', (req, res, next) => {
    var sliceUrl = req.body.img.split('/tmp/');
    sliceUrl = decodeURIComponent(sliceUrl[1]);
    var s3 = new AWS.S3();
    var params = {
         Bucket:'elasticbeanstalk-ap-northeast-2-035223481599',
         CopySource:req.body.img,
         Key:'images/'+sliceUrl,
         ACL:'public-read',
    };
    s3.copyObject(params, function(err, data){
      if(err) {
        console.log(err);
        return next(err);
      }
      else {
        var params = {
             Bucket:'elasticbeanstalk-ap-northeast-2-035223481599',
             Key:'tmp/'+sliceUrl,
        }
        s3.deleteObject(params, function(err, data){
          if(err) {
            console.log(err);
            return next(err);
          }
          else {
            res.send(req.body.img);
          }
        });
      }
    });
  });

  route.get('/user', (req, res, next) => {
    var user_id = req.decoded.user_id;
    function selectByUserId() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM users_table LEFT JOIN levels_table
          ON users_table.level = levels_table.level
          WHERE user_id = ?`;
          conn.read.query(sql, user_id, (err, results) => {
            if(err) reject(err);
            else {
              delete results[0].password;
              delete results[0].salt;
              resolve([results[0]]);
            }
          });
        }
      );
    }

    selectByUserId()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select user by user_id",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/newsfeeds', (req, res, next) => {
    var user_id = req.decoded.user_id;
    function selectNewsfeeds() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM newsfeeds_table ORDER BY newsfeed_id DESC`;
          conn.read.query(sql, user_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }

    selectNewsfeeds()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select newsfeeds",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/newsfeed/:newsfeed_id', (req, res, next) => {
    var newsfeed_id = req.params.newsfeed_id;
    var user_id = req.decoded.user_id;
    function updateNewsfeedViewNum() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          UPDATE newsfeeds_table SET newsfeed_view_num = newsfeed_view_num + 1
          WHERE newsfeed_id = ?`;
          conn.write.query(sql, newsfeed_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve();
            }
          });
        }
      )
    }
    function selectNewsfeedById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM newsfeed_like_table WHERE newsfeed_id = ?) as newsfeed_like_num,
          (SELECT COUNT(*) FROM newsfeed_like_table WHERE user_id = ? and newsfeed_id = ?) as isLike
          FROM newsfeeds_table WHERE newsfeed_id = ?`;
          conn.read.query(sql, [newsfeed_id, user_id, newsfeed_id, newsfeed_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      );
    }
    function selectCommentById(params) {
      var data = params[0];
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM newsfeed_comments_table LEFT JOIN users_table
          ON newsfeed_comments_table.user_id = users_table.user_id
          WHERE newsfeed_comments_table.newsfeed_id = ? ORDER BY newsfeed_comment_id DESC`;
          conn.read.query(sql, newsfeed_id, (err, results) => {
            if(err) reject(err);
            else {
              data.newsfeed_comments = results;
              data.newsfeed_comment_num = results.length;
              resolve([data]);
            }
          });
        }
      )
    }

    updateNewsfeedViewNum()
    .then(selectNewsfeedById)
    .then(selectCommentById)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select newsfeeds",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.post('/newsfeed/like', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var newsfeed_id = req.body.newsfeed_id;
    function selectNewsfeedLikeById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM newsfeed_like_table
          WHERE user_id = ? and newsfeed_id = ?`;
          conn.read.query(sql, [user_id, newsfeed_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      )
    }
    function insertOrDeleteNewsfeedlike(params) {
      return new Promise(
        (resolve, reject) => {
          if(!params[0]) {
            var sql = `
            INSERT INTO newsfeed_like_table SET user_id = ?, newsfeed_id = ?`;
            conn.write.query(sql, [user_id, newsfeed_id], (err, results) => {
              if(err) reject(err);
              else {
                resolve();
              }
            });
          }
          else {
            var sql = `
            DELETE FROM newsfeed_like_table WHERE user_id = ? and newsfeed_id = ?`;
            conn.write.query(sql, [user_id, newsfeed_id], (err, results) => {
              if(err) reject(err);
              else {
                resolve();
              }
            });
          }
        }
      )
    }
    function selectSyncronizedLikeNumAndIsLike() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT COUNT(*) as newsfeed_like_num,
          (SELECT COUNT(*) FROM newsfeed_like_table WHERE user_id = ? and newsfeed_id = ?) as isLike
          FROM newsfeed_like_table WHERE newsfeed_id = ?`;
          conn.read.query(sql, [user_id, newsfeed_id, newsfeed_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      );
    }

    selectNewsfeedLikeById()
    .then(insertOrDeleteNewsfeedlike)
    .then(selectSyncronizedLikeNumAndIsLike)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "insert or delete newsfeed like num",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.post('/newsfeed/comment', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var newsfeed_id = req.body.newsfeed_id;
    var newsfeed_comment_content = req.body.newsfeed_comment_content;

    function insertNewsfeedComment() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          INSERT INTO newsfeed_comments_table
          SET user_id = ?, newsfeed_id = ?, newsfeed_comment_content = ?`;
          conn.write.query(sql, [user_id, newsfeed_id, newsfeed_comment_content], (err, results) => {
            if(err) reject(err);
            else {
              resolve();
            }
          });
        }
      )
    }
    function selectSyncronizedNewsfeedComment() {
      var data = {}
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM newsfeed_comments_table LEFT JOIN users_table
          ON newsfeed_comments_table.user_id = users_table.user_id
          WHERE newsfeed_comments_table.newsfeed_id = ? ORDER BY newsfeed_comment_id DESC`;
          conn.read.query(sql, newsfeed_id, (err, results) => {
            if(err) reject(err);
            else {
              data.newsfeed_comments = results;
              data.newsfeed_comment_num = results.length;
              resolve([data]);
            }
          });
        }
      )
    }

    insertNewsfeedComment()
    .then(selectSyncronizedNewsfeedComment)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "insert comment",
          "data" : params[0]
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

  return route;
}
