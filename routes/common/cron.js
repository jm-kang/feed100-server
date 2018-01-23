module.exports = function(app, conn, admin) {
  var cron = require('node-cron');
  var route = require('express').Router();
  var request = require('request');
  var AWS = require('aws-sdk');
  AWS.config.region = 'ap-northeast-2';

  var opts = {  
    credentials: new AWS.EC2MetadataCredentials()// default to use the credentials for the ec2 instance
  };
  
  var elasticbeanstalk = new AWS.ElasticBeanstalk(opts);
  var ec2 = new AWS.EC2(opts);
  var metadata = new AWS.MetadataService(opts);
  
  function runTaskOnMaster(name, taskToRun) {
    console.log('Beginning task: ' + name);
  
    return new Promise( (resolve, reject) => {
      metadata.request('/latest/meta-data/instance-id', (err, InstanceId) => {
        if (err) {return reject(err);}
        return resolve(InstanceId)
      });
    })
    .then((currentInstanceId) => {
      console.log('InstanceId', currentInstanceId);
      return new Promise( (resolve, reject) => {    
        var params = {
          Filters: [
            {
              Name: 'resource-id',
              Values: [currentInstanceId]
            }
          ]
        };
  
        ec2.describeTags(params, (err, data) => {
          if (err) {return reject('dt ' + err);}
  
          var envIdTag = data.Tags.find(t => t.Key === 'elasticbeanstalk:environment-id');
          if (envIdTag === null) {
            return reject('Failed to find the value of "elasticbeanstalk:environment-id" tag.');
          }

          elasticbeanstalk.describeEnvironmentResources({EnvironmentId: envIdTag.Value}, function (err, data) {
            if (err) { return reject('de ' + err); }
            if (currentInstanceId !== data.EnvironmentResources.Instances[0].Id) { return resolve(false); }
            return resolve(true);
          });
        });
      });
    })
    .then( (isMaster) => {
      if (!isMaster) {
        console.log('Not running task as not master EB instance.');
      } else {
        console.log('Identified as master EB instance. Running task.');
        taskToRun();
      }
    })
    .catch( (err) => console.log(err));
  }
  
  cron.schedule('0 0 * * *', function() {
    console.log('cron started', new Date());
    if ('development' == app.get('env')) {
      var url = 'http://localhost:3000/common/cron/alarm';
      request(url, function (error, response, body) {
        if(error) {
          console.log('cron error:', error); // Print the error if one occurred
        }
      });
    }
    else if ('production' == app.get('env')) {
      runTaskOnMaster( 'Task 1', () => {
        var url = 'https://www.feed100.me/common/cron/alarm';
        request(url, function (error, response, body) {
          if(error) {
            console.log('cron error:', error); // Print the error if one occurred
          }
        });
      });
    }
  }).start();

  route.get('/alarm', (req, res, next) => {
    function selectUserIdAndTokensBeforeTwo() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT company_id as user_id, device_token, 1 as is_company, project_id FROM projects_table
          LEFT JOIN users_token_table
          ON projects_table.company_id = users_token_table.user_id
          WHERE now() + INTERVAL 1 DAY < project_end_date and project_end_date <= now() + INTERVAL 2 DAY`;
          conn.read.query(sql, (err, results) => {
            if(err) reject(err);
            else {
              insertAlarmAndPush(0, results);
            }
          });
          var user_ids = [];
          function insertAlarmAndPush(i, list) {
            if(i < list.length) {
              var alarm_user_id = list[i].user_id;
              var project_id = list[i].project_id;
              var device_token = list[i].device_token;
              var is_company = list[i].is_company;
              var alarmData = {
                user_id : alarm_user_id,
                project_id : project_id,
                alarm_link : 'warnProject',
                alarm_tag : '인터뷰 마감',
              }
              if(is_company) {
                alarmData.alarm_content = '프로젝트 인터뷰 마감 하루 전입니다.';
                if(device_token) {
                  sendFCM(device_token, alarmData.alarm_content);
                }
                if(user_ids.indexOf(alarm_user_id + '/' + project_id) < 0) {
                  var sql = `
                  INSERT INTO alarms_table SET ?`;
                  conn.write.query(sql, [alarmData], (err, results) => {
                    if(err) reject(err);
                    else {
                      user_ids.push(alarm_user_id + '/' + project_id);
                      insertAlarmAndPush(++i, list);
                    }
                  });
                }
                else {
                  insertAlarmAndPush(++i, list);
                }
              }
            }
            else {
              resolve();
            }
          }
        }
      )
    }
    function selectUserIdAndTokensBeforeOne() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT project_participants_table.user_id, device_token, 0 as is_company, project_participants_table.project_id
          FROM project_participants_table
          LEFT JOIN projects_table
          ON project_participants_table.project_id = projects_table.project_id
          LEFT JOIN users_token_table
          ON project_participants_table.user_id = users_token_table.user_id
          WHERE now() < project_end_date and project_end_date <= now() + INTERVAL 1 DAY`;
          conn.read.query(sql, (err, results) => {
            if(err) reject(err);
            else {
              insertAlarmAndPush(0, results);
            }
          });
          var user_ids = [];
          function insertAlarmAndPush(i, list) {
            if(i < list.length) {
              var alarm_user_id = list[i].user_id;
              var project_id = list[i].project_id;
              var device_token = list[i].device_token;
              var is_company = list[i].is_company;
              var alarmData = {
                user_id : alarm_user_id,
                project_id : project_id,
                alarm_link : 'warnProject',
                alarm_tag : '프로젝트 마감',
              }
              if(!is_company) {
                alarmData.alarm_content = '프로젝트 종료 하루 전입니다.';
                if(device_token) {
                  sendFCM(device_token, alarmData.alarm_content);
                }
                if(user_ids.indexOf(alarm_user_id + '/' + project_id) < 0) {
                  var sql = `
                  INSERT INTO alarms_table SET ?`;
                  conn.write.query(sql, [alarmData], (err, results) => {
                    if(err) reject(err);
                    else {
                      user_ids.push(alarm_user_id + '/' + project_id);
                      insertAlarmAndPush(++i, list);
                    }
                  });
                }
                else {
                  insertAlarmAndPush(++i, list);
                }
              }
            }
            else {
              resolve();
            }
          }
        }
      )
    }
    function selectUserIdAndTokensBeforeZero() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT project_participants_table.user_id, device_token, 0 as is_company, project_participants_table.project_id
          FROM project_participants_table
          LEFT JOIN projects_table
          ON project_participants_table.project_id = projects_table.project_id
          LEFT JOIN users_token_table
          ON project_participants_table.user_id = users_token_table.user_id
          WHERE now() >= project_end_date and project_end_date > now() - INTERVAL 1 DAY`;
          conn.read.query(sql, (err, results) => {
            if(err) reject(err);
            else {
              insertAlarmAndPush(0, results);
            }
          });
          var user_ids = [];
          function insertAlarmAndPush(i, list) {
            if(i < list.length) {
              var alarm_user_id = list[i].user_id;
              var project_id = list[i].project_id;
              var device_token = list[i].device_token;
              var is_company = list[i].is_company;
              var alarmData = {
                user_id : alarm_user_id,
                project_id : project_id,
                alarm_link : 'endProject',
                alarm_tag : '프로젝트 완료',
              }
              if(!is_company) {
                alarmData.alarm_content = '프로젝트가 종료되었습니다. 보상을 받아보세요!';
                if(device_token) {
                  sendFCM(device_token, alarmData.alarm_content);
                }
                if(user_ids.indexOf(alarm_user_id + '/' + project_id) < 0) {
                  var sql = `
                  INSERT INTO alarms_table SET ?`;
                  conn.write.query(sql, [alarmData], (err, results) => {
                    if(err) reject(err);
                    else {
                      user_ids.push(alarm_user_id + '/' + project_id);
                      insertAlarmAndPush(++i, list);
                    }
                  });
                }
                else {
                  insertAlarmAndPush(++i, list);
                }
              }
            }
            else {
              resolve();
            }
          }
        }
      )
    }

    selectUserIdAndTokensBeforeTwo()
    .then(selectUserIdAndTokensBeforeOne)
    .then(selectUserIdAndTokensBeforeZero)
    .then(() => {
      res.json(
        {
          "success" : true,
          "message" : "alarm router success",
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  function sendFCM(device_token, content) {
    // This registration token comes from the client FCM SDKs.
    var registrationToken = device_token;

    // See the "Defining the message payload" section below for details
    // on how to define a message payload.
    var payload = {
      notification: {
        body: content,
        sound: "default"
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
      if(response.failureCount) {
        if(response.results[0].error.errorInfo.code == "messaging/registration-token-not-registered") {
          deleteDeviceToken(device_token);
        }
      }
    })
    .catch(function(error) {
      console.log("Error sending message:", error);
      return;
    });
  }

  function deleteDeviceToken(device_token) {
    return new Promise(
      (resolve, reject) => {
        var sql = `
        DELETE FROM users_token_table WHERE device_token = ?
        `;
        conn.write.query(sql, device_token, (err, results) => {
          if(err) reject(err);
          else {
            console.log('device token has deleted');
            resolve([results]);
          }
        });
      }
    );
  }

  return route;
};
