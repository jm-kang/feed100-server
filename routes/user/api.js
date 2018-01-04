module.exports = function(conn, admin) {
  var route = require('express').Router();

  route.get('/user', (req, res, next) => {
    var user_id = req.decoded.user_id;
    function selectByUserId() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          levels_table.level, levels_table.required_experience_point, levels_table.level_class,
          next_level_table.level as next_level,
          next_level_table.required_experience_point as next_required_experience_point,
          next_level_table.level_class as next_level_class
          FROM users_table
          LEFT JOIN levels_table
          ON users_table.level = levels_table.level
          LEFT JOIN levels_table as next_level_table
          ON next_level_table.level = levels_table.level + 1
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
    function updateLevel(params) {
      return new Promise(
        (resolve, reject) => {
          if(params[0].experience_point >= params[0].required_experience_point) {
            if(params[0].required_experience_point == 0) { // 최고 레벨일 경우
              var new_level = params[0].level;
              var new_experience_point = 0;
            }
            else if(params[0].next_required_experience_point == 0) { // 최고 레벨로 업하는 경우
              var new_level = params[0].level + 1;
              var new_experience_point = 0;
            }
            else {
              var new_level = params[0].level + 1;
              var new_experience_point = params[0].experience_point - params[0].required_experience_point;
            }
            var sql = `
            UPDATE users_table SET level = ?, experience_point = ?
            WHERE user_id = ?`;
            conn.write.query(sql, [new_level, new_experience_point, user_id], (err, results) => {
              if(err) reject(err);
              else {
                if(params[0].required_experience_point != 0) { // 최고 레벨이 아니면
                  params[0].level_class = params[0].next_level_class;
                  params[0].required_experience_point = params[0].next_required_experience_point;
                }
                params[0].level = new_level;
                params[0].experience_point = new_experience_point;
                resolve([params[0]]);
              }
            });
          }
          else {
            resolve([params[0]]);
          }
        }
      )
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
          WHERE project_participants_table.user_id = ?
          ORDER BY projects_table.project_id DESC`;
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
    .then(updateLevel)
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

  route.put('/user/profile', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var gender = req.body.gender;
    var age = req.body.age;
    var job = req.body.job;
    var region = req.body.region;
    var marriage = req.body.marriage;
    var interests = req.body.interests;
    var avatar_image = req.body.avatar_image;

    function selectUserById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `SELECT avatar_image FROM users_table WHERE user_id = ?`;
          conn.read.query(sql, user_id, (err, results) => {
            if(err) reject(err);
            else {
              const images = ['assets/img/user-avatar-image.png',
              'assets/img/user-avatar-image-man1.png', 'assets/img/user-avatar-image-man2.png', 'assets/img/user-avatar-image-man3.png',
              'assets/img/user-avatar-image-woman1.png', 'assets/img/user-avatar-image-woman2.png', 'assets/img/user-avatar-image-woman3.png'];
              if(images.indexOf(results[0].avatar_image) < 0) {
                resolve(results[0].avatar_image);
              }
              else {
                resolve(avatar_image);
              }
            }
          });
        }
      )
    }
    function updateUserProfile(avatar_image) {
      return new Promise(
        (resolve, reject) => {
          var userData = {
            gender : gender,
            age : age,
            job : job,
            region : region,
            marriage : marriage,
            interests : JSON.stringify(interests),
            avatar_image : avatar_image
          }
          var sql = `UPDATE users_table SET ? WHERE user_id = ?`;
          conn.write.query(sql, [userData, user_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      )
    }

    selectUserById()
    .then(updateUserProfile)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "update profile",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.put('/user/account', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var avatar_image = req.body.avatar_image
    var nickname = req.body.nickname;
    var introduction = req.body.introduction;

    function updateUserAccount() {
      return new Promise(
        (resolve, reject) => {
          var sql = `UPDATE users_table SET avatar_image = ?, nickname = ?, introduction = ? WHERE user_id = ?`;
          conn.write.query(sql, [avatar_image, nickname, introduction, user_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      )
    }

    updateUserAccount()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "update account",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/user/home', (req, res, next) => {
    // 진행중 전부, 새 프로젝트 3, 새 뉴스피드 5
    var user_id = req.decoded.user_id;
    function selectProceedingProjectByUserId() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
          as participant_num
          FROM projects_table
          LEFT JOIN project_participants_table
          ON projects_table.project_id = project_participants_table.project_id
          LEFT JOIN users_table
          ON projects_table.company_id = users_table.user_id
          WHERE project_end_date > now() and project_participants_table.user_id = ?
          ORDER BY projects_table.project_id DESC`;
          conn.read.query(sql, user_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }
    function selectProjects(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
          as participant_num
          FROM projects_table LEFT JOIN users_table
          ON projects_table.company_id = users_table.user_id
          WHERE is_private = false
          ORDER BY projects_table.project_id DESC LIMIT 3`;
          conn.read.query(sql, (err, results) => {
            if(err) reject(err);
            else {
              var data = {
                proceeding_projects : params[0],
                new_projects : results
              }
              resolve([data]);
            }
          });
        }
      );
    }
    function selectNewsfeeds(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM newsfeeds_table
          WHERE is_private = false
          ORDER BY newsfeed_id DESC LIMIT 5`;
          conn.read.query(sql, (err, results) => {
            if(err) reject(err);
            else {
              params[0].new_newsfeeds = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }

    selectProceedingProjectByUserId()
    .then(selectProjects)
    .then(selectNewsfeeds)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select user home data",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });
  });

  route.get('/user/project/:project_id', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var project_id = req.params.project_id;

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
    function selectProjectById(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (project_end_date < now() && project_end_date + INTERVAL 2 DAY > now())
          as is_judge_proceeding,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
          as participant_num
          FROM projects_table LEFT JOIN users_table
          ON projects_table.company_id = users_table.user_id
          WHERE project_id = ?`;
          conn.read.query(sql, project_id, (err, results) => {
            if(err) reject(err);
            else {
              params[0].project_info = results[0];
              if(new Date(results[0].project_end_date) > new Date()) {
                params[0].project_info.isProceeding = true;
              }
              else {
                params[0].project_info.isProceeding = false;
              }
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function selectProjectParticipationInfoById(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM project_participants_table
          WHERE project_id = ? and user_id = ?`;
          conn.read.query(sql, [project_id, user_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].project_participation_info = results[0];
              resolve([params[0]]);
            }
          });
        }
      );
    }

    selectByUserId()
    .then(selectProjectById)
    .then(selectProjectParticipationInfoById)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select user & project & project_participation info",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/user/alarms', (req, res, next) => {
    var user_id = req.decoded.user_id;
    function updateAlarmIsNew() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          UPDATE alarms_table SET alarm_is_new = 0
          WHERE user_id = ?`;
          conn.read.query(sql, user_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }
    function selectAlarms() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM alarms_table LEFT JOIN projects_table
          ON alarms_table.project_id = projects_table.project_id
          WHERE user_id = ? ORDER BY alarm_id DESC`;
          conn.read.query(sql, user_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }

    updateAlarmIsNew()
    .then(selectAlarms)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select alarms",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.post('/user/alarm/read', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var alarm_id = req.body.alarm_id;
    function updateAlarmIsRead() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          UPDATE alarms_table SET alarm_is_read = 1
          WHERE alarm_id = ?`;
          conn.write.query(sql, alarm_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve();
            }
          });
        }
      )
    }
    function selectAlarms() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM alarms_table LEFT JOIN projects_table
          ON alarms_table.project_id = projects_table.project_id
          WHERE user_id = ? ORDER BY alarm_id DESC`;
          conn.read.query(sql, user_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }

    updateAlarmIsRead()
    .then(selectAlarms)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "update alarm_is_read and select alarms",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/user/alarm&interview/num', (req, res, next) => {
    var user_id = req.decoded.user_id;
    function selectAlarmAndInterviewNum() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT COUNT(*) as interview_num,
          (SELECT COUNT(*) FROM alarms_table WHERE user_id = ? and alarm_is_new = 1) as alarm_num
          FROM interviews_table
          WHERE project_participant_id in
          (SELECT project_participant_id
          FROM project_participants_table
          LEFT JOIN projects_table
          ON project_participants_table.project_id = projects_table.project_id
          WHERE user_id = ? and interview_response is null and project_end_date > now())`;
          conn.read.query(sql, [user_id, user_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      );
    }

    selectAlarmAndInterviewNum()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select alarm and interview num",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/user/interviews', (req, res, next) => {
    var user_id = req.decoded.user_id;
    function selectInterviews() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) as interview_num FROM interviews_table as a
          LEFT JOIN project_participants_table as b
          ON a.project_participant_id = b.project_participant_id
          LEFT JOIN projects_table as c
          ON b.project_id = c.project_id
          WHERE b.project_participant_id= project_participants_table.project_participant_id and a.interview_response is null and c.project_end_date > now())
          as interview_num
          FROM interviews_table
          LEFT JOIN (SELECT COUNT(*) as ordinal, project_participant_id FROM interviews_table GROUP BY project_participant_id DESC) as ordinal_table
          ON interviews_table.project_participant_id =  ordinal_table.project_participant_id
          LEFT JOIN project_participants_table
          ON interviews_table.project_participant_id = project_participants_table.project_participant_id
          LEFT JOIN projects_table
          ON project_participants_table.project_id = projects_table.project_id
          WHERE interviews_table.project_participant_id in (SELECT project_participant_id FROM project_participants_table WHERE user_id = ?)
          and interview_id in (SELECT MAX(interview_id) FROM interviews_table GROUP BY project_participant_id)
          ORDER BY interview_id DESC`;
          conn.read.query(sql, user_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }

    selectInterviews()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select interviews",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/user/interview/:project_id', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var project_id = req.params.project_id;
    function selectProjectById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT project_name FROM projects_table WHERE project_id = ?`;
          conn.read.query(sql, [project_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      )
    }
    function selectInterviewById(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM interviews_table
          LEFT JOIN project_participants_table
          ON interviews_table.project_participant_id = project_participants_table.project_participant_id
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          LEFT JOIN projects_table
          ON project_participants_table.project_id = projects_table.project_id
          WHERE project_participants_table.user_id = ? and project_participants_table.project_id = ?`;
          conn.read.query(sql, [user_id, project_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].interviews = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }

    selectProjectById()
    .then(selectInterviewById)
    .then((params) => {
      res.send(
        {
          "success" : true,
          "message" : "select interview",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.post('/user/interview/:interview_id', (req, res, next) => {
    var interview_id = req.params.interview_id;
    var interview_response = req.body.interview_response;
    var interview_response_images = req.body.interview_response_images;

    function insertInterviewResponse() {
      return new Promise(
        (resolve, reject) => {
          var responseData = {
            interview_id : interview_id,
            interview_response : interview_response,
            interview_response_images : (interview_response_images == null) ? null : JSON.stringify(interview_response_images)
          }
          var sql = `
          UPDATE interviews_table SET ?, interview_is_new = 1, interview_response_registration_date = now() WHERE interview_id = ?`;
          conn.write.query(sql, [responseData, interview_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      )
    }
    function selectUserIdAndTokens(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT company_id as user_id, device_token, 1 as is_company, project_id FROM projects_table
          LEFT JOIN users_token_table
          ON projects_table.company_id = users_token_table.user_id
          WHERE project_id =
          (SELECT project_id FROM project_participants_table
          LEFT JOIN interviews_table
          ON project_participants_table.project_participant_id = interviews_table.project_participant_id
          WHERE interview_id = ?)`;
          conn.read.query(sql, [interview_id], (err, results) => {
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
                alarm_link : 'newInterview',
                alarm_tag : '새 인터뷰',
              }
              if(is_company) {
                alarmData.alarm_content = '새로운 인터뷰 답변이 도착했습니다. 확인해주세요!';
                if(device_token) {
                  sendFCM(device_token, alarmData.alarm_content);
                }
                if(user_ids.indexOf(alarm_user_id) < 0) {
                  var sql = `
                  INSERT INTO alarms_table SET ?`;
                  conn.write.query(sql, [alarmData], (err, results) => {
                    if(err) reject(err);
                    else {
                      user_ids.push(alarm_user_id);
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
              resolve([params[0]]);
            }
          }
        }
      )
    }


    insertInterviewResponse()
    .then(selectUserIdAndTokens)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "insert interview response",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/redeem/:project_code', (req, res, next) => {
    var project_code = req.params.project_code;

    function selectProjectByCode() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT project_id FROM projects_table WHERE project_code = ?`;
          conn.read.query(sql, project_code, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      );
    }

    selectProjectByCode()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select project id",
          "data" : (params[0]) ? params[0] : "{}"
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
          SELECT * FROM newsfeeds_table
          WHERE is_private = false
          ORDER BY newsfeed_id DESC`;
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
          WHERE is_private = false
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

  route.get('/project/home/:project_id', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var project_id = req.params.project_id;

    function selectProjectById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM interviews_table
          LEFT JOIN project_participants_table
          ON interviews_table.project_participant_id = project_participants_table.project_participant_id
          WHERE user_id = ? and project_id = ? and interview_response is null)
          as interview_num,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
          as participant_num
          FROM projects_table LEFT JOIN users_table
          ON projects_table.company_id = users_table.user_id
          WHERE project_id = ?`;
          conn.read.query(sql, [user_id, project_id, project_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      );
    }
    function selectProjectFeedbacks(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM opinions_table
          WHERE feedback_id = project_participants_table.project_participant_id and is_empathy = true)
          as empathy_num,
          (SELECT COUNT(*) FROM opinions_table
          WHERE feedback_id = project_participants_table.project_participant_id and is_empathy = false)
          as non_empathy_num,
          (SELECT COUNT(*) FROM opinions_table
          WHERE feedback_id = project_participants_table.project_participant_id and project_participant_id =
          (SELECT project_participant_id FROM project_participants_table WHERE user_id = ? and project_id = ?))
          as is_my_opinion,
          (IF(project_participants_table.user_id = ?, true, false))
          as is_my_feedback
          FROM project_participants_table
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          WHERE project_id = ?
          ORDER BY empathy_num ASC, empathy_num - non_empathy_num ASC`;
          conn.read.query(sql, [user_id, project_id, user_id, project_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].feedbacks = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function chooseBestFeedback(params) {
      return new Promise(
        (resolve, reject) => {
          var max_best_num = Math.floor(params[0].max_participant_num / 10);
          var feedbacks = params[0].feedbacks;
          var bestFeedbacks = [];
          var feedbacksLen = feedbacks.length;

          searchBestFeedback(resolve, params, feedbacksLen-1, max_best_num, feedbacks, bestFeedbacks);
        }
      )
    }
    function searchBestFeedback(resolve, params, i, max_best_num, feedbacks, bestFeedbacks) {
      if(i >= 0) {
        if(feedbacks[i].empathy_num > feedbacks[i].non_empathy_num && max_best_num > 0) {
          feedbacks[i].is_best = true;
          bestFeedbacks.push(feedbacks.splice(i, 1)[0]);
          searchBestFeedback(resolve, params, --i, --max_best_num, feedbacks, bestFeedbacks);
        }
        else {
          feedbacks[i].is_best = false;
          searchBestFeedback(resolve, params, --i, max_best_num, feedbacks, bestFeedbacks);
        }
      }
      else {
        params[0].feedbacks = bestFeedbacks.concat(feedbacks.reverse());
        resolve([params[0]]);
      }
    }

    selectProjectById()
    .then(selectProjectFeedbacks)
    .then(chooseBestFeedback)
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

  route.get('/project/side-menu/:project_id', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var project_id = req.params.project_id;
    function selectUserById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM users_table
          LEFT JOIN levels_table
          ON users_table.level = levels_table.level
          WHERE user_id = ?`;
          conn.read.query(sql, user_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]])
            }
          });
        }
      )
    }

    function selectProjectById(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM interviews_table
          LEFT JOIN project_participants_table
          ON interviews_table.project_participant_id = project_participants_table.project_participant_id
          WHERE user_id = ? and project_id = ? and interview_response is not null)
          as completed_interview_num,
          (SELECT COUNT(*) FROM interviews_table
          LEFT JOIN project_participants_table
          ON interviews_table.project_participant_id = project_participants_table.project_participant_id
          WHERE user_id = ? and project_id = ? and interview_response is null)
          as interview_num,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
          as participant_num
          FROM projects_table
          WHERE project_id = ?`;
          conn.read.query(sql, [user_id, project_id, user_id, project_id, project_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].project = results[0];
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function selectProjectFeedbacks(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM opinions_table
          WHERE feedback_id = project_participants_table.project_participant_id and is_empathy = true)
          as empathy_num,
          (SELECT COUNT(*) FROM opinions_table
          WHERE feedback_id = project_participants_table.project_participant_id and is_empathy = false)
          as non_empathy_num,
          (SELECT COUNT(*) FROM opinions_table
          WHERE feedback_id = project_participants_table.project_participant_id and project_participant_id =
          (SELECT project_participant_id FROM project_participants_table WHERE user_id = ? and project_id = ?))
          as is_my_opinion,
          (IF(project_participants_table.user_id = ?, true, false))
          as is_my_feedback
          FROM project_participants_table
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          WHERE project_id = ?
          ORDER BY empathy_num ASC, empathy_num - non_empathy_num ASC`;
          conn.read.query(sql, [user_id, project_id, user_id, project_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].feedbacks = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }
    var myOpinionNum = 0;
    var myFeedback;
    function chooseBestFeedback(params) {
      return new Promise(
        (resolve, reject) => {
          var max_best_num = Math.floor(params[0].max_participant_num / 10);
          var feedbacks = params[0].feedbacks;
          var bestFeedbacks = [];
          var feedbacksLen = feedbacks.length;

          searchBestFeedback(resolve, params, feedbacksLen-1, max_best_num, feedbacks, bestFeedbacks);
        }
      )
    }
    function searchBestFeedback(resolve, params, i, max_best_num, feedbacks, bestFeedbacks) {
      if(i >= 0) {
        if(feedbacks[i].is_my_opinion) {
          myOpinionNum++;
        }
        if(feedbacks[i].is_my_feedback) {
          myFeedback = feedbacks[i];
        }
        if(feedbacks[i].empathy_num > feedbacks[i].non_empathy_num && max_best_num > 0) {
          feedbacks[i].is_best = true;
          bestFeedbacks.push(feedbacks.splice(i, 1)[0]);
          searchBestFeedback(resolve, params, --i, --max_best_num, feedbacks, bestFeedbacks);
        }
        else {
          feedbacks[i].is_best = false;
          searchBestFeedback(resolve, params, --i, max_best_num, feedbacks, bestFeedbacks);
        }
      }
      else {
        delete params[0].feedbacks;
        params[0].my_opinion_num = myOpinionNum;
        params[0].feedback = myFeedback;
        resolve([params[0]]);
      }
    }

    selectUserById()
    .then(selectProjectById)
    .then(selectProjectFeedbacks)
    .then(chooseBestFeedback)
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

  route.get('/project/report/:project_id', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var project_id = req.params.project_id;

    function selectReport() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *
          FROM project_participants_table
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          LEFT JOIN projects_table
          ON project_participants_table.project_id = projects_table.project_id
          WHERE project_participants_table.user_id = ? and project_participants_table.project_id = ?
          `;
          conn.read.query(sql, [user_id, project_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      )
    }

    selectReport()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select report",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.put('/project/report/:project_id', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var project_id = req.params.project_id;
    var project_report_images = req.body.project_report_images;
    var project_report_story_summary_content = req.body.project_report_story_summary_content;
    var project_report_pros_content = req.body.project_report_pros_content;
    var project_report_cons_content = req.body.project_report_cons_content;
    var project_report_overall_opinion_content = req.body.project_report_overall_opinion_content;

    function updateReport() {
      return new Promise(
        (resolve, reject) => {
          var reportData = {
            project_report_images : (project_report_images == null) ? null : JSON.stringify(project_report_images),
            project_report_story_summary_content : project_report_story_summary_content,
            project_report_pros_content : project_report_pros_content,
            project_report_cons_content : project_report_cons_content,
            project_report_overall_opinion_content : project_report_overall_opinion_content
          }
          var sql = `
          UPDATE project_participants_table SET ?, project_report_registration_date = now()
          WHERE user_id = ? and project_id = ?`;
          conn.write.query(sql, [reportData, user_id, project_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      )
    }
    function selectUserIdAndTokens(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT company_id as user_id, device_token, 1 as is_company, project_id FROM projects_table
          LEFT JOIN users_token_table
          ON projects_table.company_id = users_token_table.user_id
          WHERE project_id = ?`;
          conn.read.query(sql, [project_id], (err, results) => {
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
                alarm_link : 'newReport',
                alarm_tag : '새 심층 피드백',
              }
              if(is_company) {
                alarmData.alarm_content = '새로운 심층 피드백이 작성되었습니다. 확인해주세요!';
                if(device_token) {
                  sendFCM(device_token, alarmData.alarm_content);
                }
                if(user_ids.indexOf(alarm_user_id) < 0) {
                  var sql = `
                  INSERT INTO alarms_table SET ?`;
                  conn.write.query(sql, [alarmData], (err, results) => {
                    if(err) reject(err);
                    else {
                      user_ids.push(alarm_user_id);
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
              resolve([params[0]]);
            }
          }
        }
      )
    }

    updateReport()
    .then(selectUserIdAndTokens)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "update project report",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/project/participation/:project_id', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var project_id = req.params.project_id;

    function selectPreCondition() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          project_end_date > now()
          as is_proceeding,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = ?) >= max_participant_num
          as is_max,
          (SELECT COUNT(*) FROM project_participation_history_table WHERE user_id = ? and project_id = ? and is_approved = false)
          as is_not_approved
          FROM projects_table WHERE project_id = ?`;
          conn.read.query(sql, [project_id, user_id, project_id, project_id], (err, results) => {
            if(err) reject(err);
            else {
              if(!results[0].is_proceeding) {
                res.json(
                  {
                    "success" : true,
                    "message" : "project is not proceeding"
                  });
              }
              else if(results[0].is_max) {
                res.json(
                  {
                    "success" : true,
                    "message" : "project is max"
                  });
              }
              else if(results[0].is_not_approved) {
                res.json(
                  {
                    "success" : true,
                    "message" : "is not approved"
                  });
              }
              else {
                resolve([results[0]]);
              }
            }
          });
        }
      )
    }

    selectPreCondition()
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

  route.post('/project/participation', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var project_id = req.body.project_id;
    var project_participation_objective_conditions = req.body.project_participation_objective_conditions;
    function selectUserById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM users_table WHERE user_id = ?`;
          conn.read.query(sql, user_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      )
    }
    function selectProjectById(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM projects_table WHERE project_id = ?`;
          conn.read.query(sql, project_id, (err, results) => {
            if(err) reject(err);
            else {
              var isApprovedArray = [];
              isApprovedArray.push(isApprovedProfile(0, true, params[0].gender, JSON.parse(results[0].project_participation_gender_conditions)));
              isApprovedArray.push(isApprovedProfile(0, true, params[0].age, JSON.parse(results[0].project_participation_age_conditions)));
              isApprovedArray.push(isApprovedProfile(0, true, params[0].job, JSON.parse(results[0].project_participation_job_conditions)));
              isApprovedArray.push(isApprovedProfile(0, true, params[0].region, JSON.parse(results[0].project_participation_region_conditions)));
              isApprovedArray.push(isApprovedProfile(0, true, params[0].marriage, JSON.parse(results[0].project_participation_marriage_conditions)));
              isApprovedArray.push(isApprovedAnswer(0, true, project_participation_objective_conditions));
              console.log(isApprovedArray);
              resolve([isApprovedArray[0] && isApprovedArray[1] && isApprovedArray[2] && isApprovedArray[3] && isApprovedArray[4] && isApprovedArray[5]]);
            }
          });
        }
      )

      function isApprovedProfile(i, isApproved, profile, options) {
        if(i < options.length && isApproved) {
          if((options[i].condition && options[i].condition == profile) || (options[i].option && options[i].option == profile)) {
            if(options[i].isApproved) {
              return isApprovedProfile(++i, true, profile, options);
            }
            else {
              return isApprovedProfile(++i, false, profile, options);
            }
          }
          else {
            return isApprovedProfile(++i, true, profile, options);
          }
        }
        else {
          console.log(profile, isApproved);
          return isApproved;
        }
      }
      function isApprovedAnswer(i, isApproved, options) {
        if(i < options.length && isApproved) {
          var isTrue = isApprovedProfile(0, true, options[i].value, options[i].options);
          return isApprovedAnswer(++i, isTrue, options);
        }
        else {
          console.log(options, isApproved);
          return isApproved;
        }
      }
    }
    function deleteProjectParticipation(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          DELETE FROM project_participation_history_table WHERE user_id = ? and project_id = ?`;
          conn.write.query(sql, [user_id, project_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([params[0]]);
            }
          });
        }
      )
    }
    function insertProjectParticipation(params) {
      return new Promise(
        (resolve, reject) => {
          var participationData = {
            user_id : user_id,
            project_id : project_id,
            is_approved : params[0],
            project_participation_objective_conditions : JSON.stringify(project_participation_objective_conditions)
          }
          var sql = `
          INSERT INTO project_participation_history_table
          (user_id, project_id, is_approved, project_participation_objective_conditions, introduction, gender, age, job, region, marriage, interests)
          SELECT ?, ?, ?, ?, introduction, gender, age, job, region, marriage, interests FROM users_table WHERE user_id = ?`;
          conn.write.query(sql, [participationData.user_id, participationData.project_id, participationData.is_approved, participationData.project_participation_objective_conditions, user_id], (err, results) => {
            if(err) console.log(err, sql);
            else {
              resolve([params[0]]);
            }
          });
        }
      )
    }

    selectUserById()
    .then(selectProjectById)
    .then(deleteProjectParticipation)
    .then(insertProjectParticipation)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "insert project participation",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.post('/project/feedback', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var project_id = req.body.project_id;
    var project_feedback = req.body.project_feedback;
    var project_feedback_hashtags = req.body.project_feedback_hashtags;
    var project_feedback_images = req.body.project_feedback_images;
    var project_first_impression_rate = req.body.project_first_impression_rate;

    function selectPreCondition() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT project_end_date > now()
          as is_proceeding,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = ?) >= max_participant_num
          as is_max,
          (SELECT COUNT(*) FROM project_participants_table WHERE user_id = ? and project_id = ?)
          as is_participated
          FROM projects_table WHERE project_id = ?`;
          conn.read.query(sql, [project_id, user_id, project_id, project_id], (err, results) => {
            if(err) reject(err);
            else {
              console.log(results);
              if(!results[0].is_proceeding) {
                res.json(
                  {
                    "success" : true,
                    "message" : "project is not proceeding"
                  });
              }
              else if(results[0].is_max) {
                res.json(
                  {
                    "success" : true,
                    "message" : "project is max"
                  });
              }
              else if(results[0].is_participated) {
                res.json(
                  {
                    "success" : true,
                    "message" : "you are already participated"
                  });
              }
              else {
                resolve([{}, project_feedback_images]);
              }
            }
          });
        }
      )
    }
    function insertProjectFeedback(params) {
      return new Promise(
        (resolve, reject) => {
          var feedbackData = {
            user_id : user_id,
            project_id : project_id,
            project_feedback : JSON.stringify(project_feedback),
            project_feedback_hashtags : JSON.stringify(project_feedback_hashtags),
            project_feedback_images : (project_feedback_images == null) ? null : JSON.stringify(project_feedback_images),
            project_first_impression_rate : project_first_impression_rate
          }
          console.log(feedbackData);
          var sql = `
          INSERT INTO project_participants_table SET ?, project_feedback_registration_date = now()`;
          conn.write.query(sql, [feedbackData], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      )
    }
    function selectUserIdAndTokens(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT company_id as user_id, device_token, 1 as is_company FROM projects_table
          LEFT JOIN users_token_table
          ON projects_table.company_id = users_token_table.user_id
          WHERE project_id = ?
          UNION ALL
          SELECT project_participants_table.user_id, device_token, 0 as is_company
          FROM project_participants_table
          LEFT JOIN users_token_table
          ON project_participants_table.user_id = users_token_table.user_id
          WHERE project_id = ? and project_participants_table.user_id != ?`;
          conn.read.query(sql, [project_id, project_id, user_id], (err, results) => {
            if(err) reject(err);
            else {
              insertAlarmAndPush(0, results);
            }
          });
          var user_ids = [];
          function insertAlarmAndPush(i, list) {
            if(i < list.length) {
              var alarm_user_id = list[i].user_id;
              var device_token = list[i].device_token;
              var is_company = list[i].is_company;
              var alarmData = {
                user_id : alarm_user_id,
                project_id : project_id,
                alarm_link : 'newFeedback',
                alarm_tag : '새 피드백',
              }
              if(is_company) {
                alarmData.alarm_content = '프로젝트에 새로운 피드백이 등록되었습니다.';
                if(device_token) {
                  sendFCM(device_token, alarmData.alarm_content);
                }
                if(user_ids.indexOf(alarm_user_id) < 0) {
                  var sql = `
                  INSERT INTO alarms_table SET ?`;
                  conn.write.query(sql, [alarmData], (err, results) => {
                    if(err) reject(err);
                    else {
                      user_ids.push(alarm_user_id);
                      insertAlarmAndPush(++i, list);
                    }
                  });
                }
                else {
                  insertAlarmAndPush(++i, list);
                }
              }
              else {
                alarmData.alarm_content = '새로운 피드백이 등록되었습니다. 토론에 참여해주세요!';
                if(device_token) {
                  sendFCM(device_token, alarmData.alarm_content);
                }
                if(user_ids.indexOf(user_id) < 0) {
                  var sql = `
                  INSERT INTO alarms_table SET ?`;
                  conn.write.query(sql, [alarmData], (err, results) => {
                    if(err) reject(err);
                    else {
                      user_ids.push(user_id);
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
              resolve([params[0]]);
            }
          }
        }
      )
    }

    selectPreCondition()
    .then(insertProjectFeedback)
    .then(selectUserIdAndTokens)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "insert project feedback",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/project/:project_id/feedback/:feedback_id', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var project_id = req.params.project_id;
    var feedback_id = req.params.feedback_id;

    function selectProjectById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM interviews_table
          LEFT JOIN project_participants_table
          ON interviews_table.project_participant_id = project_participants_table.project_participant_id
          WHERE user_id = ? and project_id = ? and interview_response is null)
          as interview_num,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
          as participant_num
          FROM projects_table LEFT JOIN users_table
          ON projects_table.company_id = users_table.user_id
          WHERE project_id = ?`;
          conn.read.query(sql, [user_id, project_id, project_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      );
    }
    function selectProjectFeedbacks(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM opinions_table
          WHERE feedback_id = project_participants_table.project_participant_id and is_empathy = true)
          as empathy_num,
          (SELECT COUNT(*) FROM opinions_table
          WHERE feedback_id = project_participants_table.project_participant_id and is_empathy = false)
          as non_empathy_num,
          (SELECT COUNT(*) FROM opinions_table
          WHERE feedback_id = project_participants_table.project_participant_id and project_participant_id =
          (SELECT project_participant_id FROM project_participants_table WHERE user_id = ? and project_id = ?))
          as is_my_opinion,
          (IF(project_participants_table.user_id = ?, true, false))
          as is_my_feedback
          FROM project_participants_table
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          WHERE project_id = ?
          ORDER BY empathy_num ASC, empathy_num - non_empathy_num ASC`;
          conn.read.query(sql, [user_id, project_id, user_id, project_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].feedbacks = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function chooseBestFeedback(params) {
      return new Promise(
        (resolve, reject) => {
          var max_best_num = Math.floor(params[0].max_participant_num / 10);
          var feedbacks = params[0].feedbacks;
          var bestFeedbacks = [];
          var feedbacksLen = feedbacks.length;

          searchBestFeedback(resolve, params, feedbacksLen-1, max_best_num, feedbacks, bestFeedbacks);
        }
      )
    }
    function searchBestFeedback(resolve, params, i, max_best_num, feedbacks, bestFeedbacks) {
      if(i >= 0) {
        if(feedbacks[i].empathy_num > feedbacks[i].non_empathy_num && max_best_num > 0) {
          feedbacks[i].is_best = true;
          bestFeedbacks.push(feedbacks.splice(i, 1)[0]);
          searchBestFeedback(resolve, params, --i, --max_best_num, feedbacks, bestFeedbacks);
        }
        else {
          feedbacks[i].is_best = false;
          searchBestFeedback(resolve, params, --i, max_best_num, feedbacks, bestFeedbacks);
        }
      }
      else {
        params[0].feedbacks = bestFeedbacks.concat(feedbacks.reverse());
        resolve([params[0]]);
      }
    }
    function selectFeedbackById(params) {
      return new Promise(
        (resolve, reject) => {
          var feedbacks = params[0].feedbacks;
          feedbacks.filter((obj) => {
            return obj.project_participant_id == feedback_id;
          })
          .map((obj) => {
            delete params[0].feedbacks;
            params[0].feedback = obj;
            resolve([params[0]]);
          });
        }
      );
    }
    function selectOpinionsByFeedbackId(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM opinions_table
          LEFT JOIN project_participants_table
          ON opinions_table.project_participant_id = project_participants_table.project_participant_id
          LEFT JOIN users_table ON project_participants_table.user_id = users_table.user_id
          WHERE feedback_id = ?
          ORDER BY opinion_registration_date DESC;`;
          conn.read.query(sql, [feedback_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].opinions = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }

    selectProjectById()
    .then(selectProjectFeedbacks)
    .then(chooseBestFeedback)
    .then(selectFeedbackById)
    .then(selectOpinionsByFeedbackId)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select feedback",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.post('/project/feedback/opinion', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var feedback_id = req.body.feedback_id;
    console.log(user_id, feedback_id);
    function selectPreCondition() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT project_end_date > now() as is_proceeding,
          (SELECT project_participant_id FROM project_participants_table WHERE user_id = ? and project_id = projects_table.project_id)
          as project_participant_id,
          (SELECT COUNT(*) FROM opinions_table WHERE feedback_id = ?
          and project_participant_id = (SELECT project_participant_id FROM project_participants_table WHERE user_id = ? and project_id = projects_table.project_id))
          as is_writing
          FROM projects_table LEFT JOIN project_participants_table
          ON projects_table.project_id = project_participants_table.project_id
          WHERE project_participants_table.project_participant_id = ?`;
          conn.read.query(sql, [user_id, feedback_id, user_id, feedback_id], (err, results) => {
            if(err) reject(err);
            else {
              console.log(results);
              if(results[0].is_writing) {
                res.json(
                  {
                    "success" : true,
                    "message" : "opinion is already writed"
                  });
              }
              else if(!results[0].is_proceeding) {
                res.json(
                  {
                    "success" : true,
                    "message" : "project is not proceeding"
                  });
              }
              else {
                resolve([results[0].project_participant_id, req.body.opinion_image]);
              }
            }
          });
        }
      )
    }
    function insertOpinion(params) {
      var project_participant_id = params[0];
      var images = params[1];
      var opinion_image = (images == null) ? null : images[0];
      return new Promise(
        (resolve, reject) => {
          var opinionData = {
            project_participant_id : project_participant_id,
            feedback_id : req.body.feedback_id,
            is_empathy : req.body.is_empathy,
            opinion : req.body.opinion,
            opinion_image : opinion_image
          }
          var sql = `
          INSERT INTO opinions_table SET ?`;
          conn.write.query(sql, opinionData, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      )
    }

    selectPreCondition()
    .then(insertOpinion)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "insert opinion success",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.post('/project/reward/:project_id', (req, res, next) => {
    // point 계산 (bestFeedback?, interview_num?)
    // participants_table => satisfaction_rate, recommendation_rate, point 및 exp 등록
    // point 및 exp 추가
    // 레벨업 조건 검사 -> /user router에서 get할 때 검사해서 레벨업
    // client로 point, exp 정보 전송.
    var user_id = req.decoded.user_id;
    var project_id = req.params.project_id;
    var satisfaction_rate = req.body.satisfaction_rate;
    var recommendation_rate = req.body.recommendation_rate;
    const feedback_reward = 1000;
    const opinion_reward = 100;
    const interview_reward = 500;
    const best_feedback_reward = 1000;
    const report_reward = 1000;
    const selection_report_reward = 4000;

    function selectProjectById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM interviews_table
          LEFT JOIN project_participants_table
          ON interviews_table.project_participant_id = project_participants_table.project_participant_id
          WHERE user_id = ? and project_id = ? and interview_response is not null)
          as completed_interview_num,
          (SELECT COUNT(*) FROM interviews_table
          LEFT JOIN project_participants_table
          ON interviews_table.project_participant_id = project_participants_table.project_participant_id
          WHERE user_id = ? and project_id = ? and interview_response is null)
          as interview_num,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
          as participant_num
          FROM projects_table
          WHERE project_id = ?`;
          conn.read.query(sql, [user_id, project_id, user_id, project_id, project_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      );
    }
    function selectProjectFeedbacks(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM opinions_table
          WHERE feedback_id = project_participants_table.project_participant_id and is_empathy = true)
          as empathy_num,
          (SELECT COUNT(*) FROM opinions_table
          WHERE feedback_id = project_participants_table.project_participant_id and is_empathy = false)
          as non_empathy_num,
          (SELECT COUNT(*) FROM opinions_table
          WHERE feedback_id = project_participants_table.project_participant_id and project_participant_id =
          (SELECT project_participant_id FROM project_participants_table WHERE user_id = ? and project_id = ?))
          as is_my_opinion,
          (IF(project_participants_table.user_id = ?, true, false))
          as is_my_feedback
          FROM project_participants_table
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          WHERE project_id = ?
          ORDER BY empathy_num ASC, empathy_num - non_empathy_num ASC`;
          conn.read.query(sql, [user_id, project_id, user_id, project_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].feedbacks = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }
    var myOpinionNum = 0;
    var myFeedback;
    function chooseBestFeedback(params) {
      return new Promise(
        (resolve, reject) => {
          var max_best_num = Math.floor(params[0].max_participant_num / 10);
          var feedbacks = params[0].feedbacks;
          var bestFeedbacks = [];
          var feedbacksLen = feedbacks.length;

          searchBestFeedback(resolve, params, feedbacksLen-1, max_best_num, feedbacks, bestFeedbacks);
        }
      )
    }
    function searchBestFeedback(resolve, params, i, max_best_num, feedbacks, bestFeedbacks) {
      if(i >= 0) {
        if(feedbacks[i].is_my_opinion) {
          myOpinionNum++;
        }
        if(feedbacks[i].is_my_feedback) {
          myFeedback = feedbacks[i];
        }
        if(feedbacks[i].empathy_num > feedbacks[i].non_empathy_num && max_best_num > 0) {
          feedbacks[i].is_best = true;
          bestFeedbacks.push(feedbacks.splice(i, 1)[0]);
          searchBestFeedback(resolve, params, --i, --max_best_num, feedbacks, bestFeedbacks);
        }
        else {
          feedbacks[i].is_best = false;
          searchBestFeedback(resolve, params, --i, max_best_num, feedbacks, bestFeedbacks);
        }
      }
      else {
        delete params[0].feedbacks;
        params[0].my_opinion_num = myOpinionNum;
        params[0].feedback = myFeedback;

        feedback_point = feedback_reward + ((params[0].feedback.is_best) ? best_feedback_reward : 0);
        opinion_point = opinion_reward * params[0].my_opinion_num;
        interview_point = interview_reward * params[0].completed_interview_num;
        report_point = 0;
        if(params[0].feedback.project_report_registration_date) {
          report_point = report_reward + ((params[0].feedback.project_report_is_select) ? selection_report_reward : 0);
        }
        project_point = feedback_point + opinion_point + interview_point + report_point;
        experience_point = ((project_point / 100).toFixed(0)) * 1 // string to number;

        // 인터뷰 응답 안했으면 포인트 0
        var data = {
          project_participant_id : params[0].feedback.project_participant_id,
          feedback_is_best : params[0].feedback.is_best,
          report_is_select : params[0].feedback.project_report_is_select,
          feedback_point : feedback_point,
          opinion_point : opinion_point,
          interview_point : interview_point,
          report_point : report_point,
          project_point : project_point,
          experience_point : experience_point,
          interview_num : params[0].interview_num,
          point : (params[0].interview_num == 0) ? project_point : 0
        }
        resolve([data]);
      }
    }
    function updateRewardInfo(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `UPDATE project_participants_table SET
          project_satisfaction_rate = ?, project_recommendation_rate = ?, experience_point = ?, point = ?, project_reward_date = now()
          WHERE project_participant_id = ? and project_reward_date is null`;
          conn.write.query(sql, [satisfaction_rate, recommendation_rate, params[0].experience_point, params[0].point, params[0].project_participant_id], (err, results) => {
            if(err) rollback(reject, err);
            else {
              console.log(results);
              if(results.changedRows) {
                resolve([params[0]]);
              }
              else {
                res.json(
                  {
                    "success" : true,
                    "message" : "is already rewarded",
                    "data" : params[0]
                  });
                rollback(reject, err);
              }
            }
          });
        }
      )
    }
    function updateUserPointAndExp(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `UPDATE users_table SET
          experience_point = experience_point + ?, point = point + ?
          WHERE user_id = ?`;
          conn.write.query(sql, [params[0].experience_point, params[0].point, user_id], (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([params[0]]);
            }
          });
        }
      )
    }

    selectProjectById()
    .then(selectProjectFeedbacks)
    .then(chooseBestFeedback)
    .then(beginTransaction)
    .then(updateRewardInfo)
    .then(updateUserPointAndExp)
    .then(endTransaction)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "project reward",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

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
    sendFCM(req.body.device_token, "Hello FEED100");
    res.send('send');
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
    })
    .catch(function(error) {
      console.log("Error sending message:", error);
      return;
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
