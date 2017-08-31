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
             Key:'feed100/'+req.params.folder+'/'+(+new Date())+files.ex_filename.size,
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
              res.json(
                {
                  "success" : true,
                  "message" : "upload success",
                  "data" : result
                });
            }
          });
        }
        else {
          res.json(
            {
              "success" : false,
              "message" : "upload fail",
            });
        }

    });
  });

  route.post('/move', (req, res, next) => {
    var images = req.body.images;
    var promises = [];

    function moveFile(image) {
      return new Promise(
        (resolve, reject) => {
          var sliceUrl = image.split('/tmp/');
          sliceUrl = decodeURIComponent(sliceUrl[1]);
          console.log(sliceUrl);
          var s3 = new AWS.S3();
          var params = {
               Bucket:'elasticbeanstalk-ap-northeast-2-035223481599',
               CopySource:image,
               Key:'feed100/images/'+sliceUrl,
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
                   Key:'feed100/tmp/'+sliceUrl,
              }
              s3.deleteObject(params, function(err, data){
                if(err) {
                  console.log(err);
                  return next(err);
                }
                else {
                  resolve();
                }
              });
            }
          });
        }
      )
    }

    for(var i=0; i<images.length; i++) {
      var promise = moveFile(images[i]);
      promises.push(promise);
    }

    Promise.all(promises)
    .then(() => {
      res.json(
        {
          "success" : true,
          "message" : "move files success",
          "data" : images
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/companies', (req, res, next) => {
    function selectCompanies() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM users_table WHERE role = ?`;
          conn.read.query(sql, "company", (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      )
    }

    selectCompanies()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select companies",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
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

    function selectParticipationProjectById(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
          as participant_num
          FROM project_participants_table
          LEFT JOIN projects_table
          ON project_participants_table.project_id = projects_table.project_id
          LEFT JOIN users_table
          ON projects_table.company_id = users_table.user_id
          WHERE project_participants_table.user_id = ?`;
          conn.read.query(sql, user_id, (err, results) => {
            if(err) reject(err);
            else {
              var proceedingProjects = [];
              var rewardProjects = [];
              var endProjects = [];
              if(results.length > 0) {
                for(var i=0; i<results.length; i++) {
                  if(new Date(results[i].project_end_date) > new Date()) {
                    proceedingProjects.push(results[i]);
                    if(i == results.length-1) {
                      params[0].proceeding_projects = proceedingProjects;
                      params[0].reward_projects = rewardProjects;
                      params[0].end_projects = endProjects;
                      resolve([params[0]]);
                    }
                  }
                  else {
                    if(!results[i].project_reward_date) {
                      rewardProjects.push(results[i]);
                      if(i == results.length-1) {
                        params[0].proceeding_projects = proceedingProjects;
                        params[0].reward_projects = rewardProjects;
                        params[0].end_projects = endProjects;
                        resolve([params[0]]);
                      }
                    }
                    else {
                      endProjects.push(results[i]);
                      if(i == results.length-1) {
                        params[0].proceeding_projects = proceedingProjects;
                        params[0].reward_projects = rewardProjects;
                        params[0].end_projects = endProjects;
                        resolve([params[0]]);
                      }
                    }
                  }
                }
              }
              else {
                params[0].proceeding_projects = proceedingProjects;
                params[0].reward_projects = rewardProjects;
                params[0].end_projects = endProjects;
                resolve([params[0]]);
              }
            }
          });
        }
      );
    }

    selectByUserId()
    .then(selectParticipationProjectById)
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
    function selectNewsfeeds() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM newsfeeds_table ORDER BY newsfeed_id DESC`;
          conn.read.query(sql, (err, results) => {
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
          "message" : "select newsfeed",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.post('/newsfeed', (req, res, next) => {
    var newsfeedData = {
      newsfeed_nickname : req.body.newsfeed_nickname,
      newsfeed_avatar_image : req.body.newsfeed_avatar_image,
      newsfeed_source : req.body.newsfeed_source,
      newsfeed_main_image : req.body.newsfeed_main_image,
      newsfeed_name : req.body.newsfeed_name,
      newsfeed_summary : req.body.newsfeed_summary,
      newsfeed_story : JSON.stringify(req.body.newsfeed_story)
    }
    function insertNewsfeed() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          INSERT INTO newsfeeds_table SET ?`;
          conn.write.query(sql, newsfeedData, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      )
    }

    insertNewsfeed()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "insert newsfeed success",
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

  route.get('/projects', (req, res, next) => {
    function selectProjects() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
          as participant_num
          FROM projects_table LEFT JOIN users_table
          ON projects_table.company_id = users_table.user_id
          ORDER BY projects_table.project_id DESC`;
          conn.read.query(sql, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }

    selectProjects()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select projects",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/project/:project_id', (req, res, next) => {
    var project_id = req.params.project_id;

    function updateProjectViewNum() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          UPDATE projects_table SET project_view_num = project_view_num +1
          WHERE project_id = ?`;
          conn.write.query(sql, project_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve();
            }
          });
        }
      )
    }

    function selectProjectById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
          as participant_num
          FROM projects_table LEFT JOIN users_table
          ON projects_table.company_id = users_table.user_id
          WHERE project_id = ?`;
          conn.read.query(sql, project_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      );
    }

    updateProjectViewNum()
    .then(selectProjectById)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select project",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.post('/project', (req, res, next) => {
    var projectData = {
      company_id : req.body.company_id,
      project_main_image : req.body.project_main_image,
      project_name : req.body.project_name,
      project_summary : req.body.project_summary,
      project_story : JSON.stringify(req.body.project_story),
      max_participant_num : req.body.max_participant_num,
      project_start_date : req.body.project_start_date,
      project_end_date : req.body.project_end_date,
      project_link : req.body.project_link,
      project_hashtags : JSON.stringify(req.body.project_hashtags),
      project_participation_gender_conditions : JSON.stringify(req.body.project_participation_gender_conditions),
      project_participation_age_conditions : JSON.stringify(req.body.project_participation_age_conditions),
      project_participation_job_conditions : JSON.stringify(req.body.project_participation_job_conditions),
      project_participation_region_conditions : JSON.stringify(req.body.project_participation_region_conditions),
      project_participation_marriage_conditions : JSON.stringify(req.body.project_participation_marriage_conditions),
      project_participation_objective_conditions : JSON.stringify(req.body.project_participation_objective_conditions)
    }
    function insertProject() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          INSERT INTO projects_table SET ?`;
          conn.write.query(sql, projectData, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      )
    }

    insertProject()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "insert project success",
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
