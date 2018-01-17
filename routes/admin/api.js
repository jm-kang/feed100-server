module.exports = function(conn, admin) {
  var route = require('express').Router();
  var voucher_codes = require('voucher-code-generator');

  /* web */
  route.get('/user', (req, res, next) => {
    var user_id = req.decoded.user_id;
    function selectByUserId() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *
          FROM users_table
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

  route.post('/project', (req, res, next) => {
    var code = voucher_codes.generate({
        length: 8,
        count: 1
    });

    var projectData = {
      company_id : req.body.company_id,
      project_code : code[0] + req.body.company_id,
      project_main_image : req.body.project_main_image,
      project_name : req.body.project_name,
      project_summary : req.body.project_summary,
      project_type : req.body.project_type,
      project_price : req.body.project_price,
      project_payment_date : req.body.project_payment_date,
      project_story : JSON.stringify(req.body.project_story),
      project_story_quiz : JSON.stringify(req.body.project_story_quiz),
      max_participant_num : req.body.max_participant_num,
      project_end_date : req.body.project_end_date,
      project_android_link : req.body.project_android_link,
      project_ios_link : req.body.project_ios_link,
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

  route.get('/reports', (req, res, next) => {

    function selectProjectReports(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *, project_name,
          IF(report_id, '심층 피드백',
          IF(interview_id, '인터뷰',
          IF(opinion_id, '토론', '피드백')))
          as what
          FROM project_report_history_table
          LEFT JOIN projects_table
          ON project_report_history_table.project_id = projects_table.project_id
          ORDER BY project_report_history_id DESC`;
          conn.read.query(sql, (err, results) => {
            if(err) reject(err);
            else {
              params[0].project_report = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function selectNewsfeedReports(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *, newsfeed_name
          FROM newsfeed_report_history_table
          LEFT JOIN newsfeeds_table
          ON newsfeed_report_history_table.newsfeed_id = newsfeeds_table.newsfeed_id
          ORDER BY newsfeed_report_history_id DESC`;
          conn.read.query(sql, (err, results) => {
            if(err) reject(err);
            else {
              params[0].newsfeed_report = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }

    selectProjectReports([{}])
    .then(selectNewsfeedReports)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select report history",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/point-histories', (req, res, next) => {

    function selectPointHistoryNotCompleted(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *
          FROM point_history_table
          WHERE is_accumulated = 0 and is_completed = 0
          ORDER BY point_history_id DESC`;
          conn.read.query(sql, (err, results) => {
            if(err) reject(err);
            else {
              params[0].isNotCompleted = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function selectPointHistoryCompleted(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *
          FROM point_history_table
          WHERE is_accumulated = 0 and is_completed = 1
          ORDER BY deposit_date DESC`;
          conn.read.query(sql, (err, results) => {
            if(err) reject(err);
            else {
              params[0].isCompleted = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }

    selectPointHistoryNotCompleted([{}])
    .then(selectPointHistoryCompleted)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select point history",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.put('/point-exchange', (req, res, next) => {
    var point_history_id = req.body.point_history_id;
    var admin_name = req.body.admin_name;
    var deposit_amount = req.body.deposit_amount;
    var deposit_date = req.body.deposit_date;
    var admin_data = {
      "is_completed" : true,
      "admin_name" : admin_name,
      "deposit_amount" : deposit_amount,
      "deposit_date" : deposit_date
    }

    function updatePointHistory() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          UPDATE point_history_table SET ? WHERE point_history_id = ?`;
          conn.read.query(sql, [admin_data, point_history_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }

    updatePointHistory()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "update point history",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/send-test/:device_token', (req, res, next) => {
    console.log(req.params.device_token);
    sendFCM(req.params.device_token, "Hello FEED100");
    res.send('send');
  });

  /* web */

  /* mobile */
  route.get('/admin', (req, res, next) => {
    var user_id = req.decoded.user_id;
    function selectByUserId() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *
          FROM users_table
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
          FROM projects_table
          LEFT JOIN users_table
          ON projects_table.company_id = users_table.user_id
          ORDER BY projects_table.project_id DESC`;
          conn.read.query(sql, (err, results) => {
            if(err) reject(err);
            else {
              var proceedingProjects = [];
              var endProjects = [];
              if(results.length > 0) {
                for(var i=0; i<results.length; i++) {
                  if(new Date(results[i].project_end_date) > new Date()) {
                    proceedingProjects.push(results[i]);
                    if(i == results.length-1) {
                      params[0].proceeding_projects = proceedingProjects;
                      params[0].end_projects = endProjects;
                      resolve([params[0]]);
                    }
                  }
                  else {
                    endProjects.push(results[i]);
                    if(i == results.length-1) {
                      params[0].proceeding_projects = proceedingProjects;
                      params[0].end_projects = endProjects;
                      resolve([params[0]]);
                    }
                  }
                }
              }
              else {
                params[0].proceeding_projects = proceedingProjects;
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

  route.put('/admin/account', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var avatar_image = req.body.avatar_image;
    var nickname = req.body.nickname;

    function updateUserAccount() {
      return new Promise(
        (resolve, reject) => {
          var sql = `UPDATE users_table SET avatar_image = ?, nickname = ? WHERE user_id = ?`;
          conn.write.query(sql, [avatar_image, nickname, user_id], (err, results) => {
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

  route.get('/admin/home', (req, res, next) => {
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
          LEFT JOIN users_table
          ON projects_table.company_id = users_table.user_id
          WHERE project_end_date > now()
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
    function selectProjects(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
          as participant_num
          FROM projects_table LEFT JOIN users_table
          ON projects_table.company_id = users_table.user_id
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
          "message" : "select admin home data",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });
  });

  route.get('/admin/alarms', (req, res, next) => {
    var user_id = req.decoded.user_id;
    function selectAlarms() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM alarms_table
          LEFT JOIN projects_table
          ON alarms_table.project_id = projects_table.project_id
          LEFT JOIN users_table
          ON alarms_table.user_id = users_table.user_id
          WHERE role = 'company' ORDER BY alarm_id DESC`;
          conn.read.query(sql, user_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }

    selectAlarms()
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

  route.get('/admin/alarm&interview/num', (req, res, next) => {
    var user_id = req.decoded.user_id;
    function selectAlarmAndInterviewNum() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT COUNT(*) as interview_num,
          (SELECT COUNT(*) FROM alarms_table
          LEFT JOIN users_table
          ON alarms_table.user_id = users_table.user_id
          WHERE role = 'company' and alarm_is_new = 1)
          as alarm_num
          FROM interviews_table
          WHERE interview_is_new = 1`;
          conn.read.query(sql, (err, results) => {
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

  route.delete('/admin/sanction/newsfeed/:newsfeed_id/:newsfeed_comment_id', (req, res, next) => {
    var newsfeed_id = req.params.newsfeed_id;
    var newsfeed_comment_id = req.params.newsfeed_comment_id;

    function deleteComment(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          DELETE FROM newsfeed_comments_table WHERE newsfeed_comment_id = ?
          `;
          conn.write.query(sql, newsfeed_comment_id, (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function deleteReportHistory(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          DELETE FROM newsfeed_report_history_table
          WHERE newsfeed_id = ? and newsfeed_comment_id = ?`;
          conn.write.query(sql, [newsfeed_id, newsfeed_comment_id], (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([params[0]]);
            }
          });
        }
      );
    }

    beginTransaction([{}])
    .then(deleteComment)
    .then(deleteReportHistory)
    .then(endTransaction)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "delete newsfeed_comment",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.delete('/admin/sanction/project/:project_id/:user_id/:project_participant_id', (req, res, next) => {
    var project_id = req.params.project_id;
    var user_id = req.params.user_id;
    var project_participant_id = req.params.project_participant_id;

    function deleteOpinion(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          DELETE FROM opinions_table WHERE project_participant_id = ?
          `;
          conn.write.query(sql, project_participant_id, (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function deleteInterview(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          DELETE FROM interviews_table WHERE project_participant_id = ?
          `;
          conn.write.query(sql, project_participant_id, (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function deleteProjectParticipants(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          DELETE FROM project_participants_table WHERE project_participant_id = ?
          `;
          conn.write.query(sql, project_participant_id, (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function deleteReportHistory(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          DELETE FROM project_report_history_table
          WHERE project_id = ? and project_participant_id = ?`;
          conn.write.query(sql, [project_id, project_participant_id], (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function updateApprovedState(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          UPDATE project_participation_history_table
          SET is_approved = 0
          WHERE user_id = ? and project_id = ?`;
          conn.write.query(sql, [user_id, project_id], (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function updateUserWarningCount(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          UPDATE users_table
          SET warn_count = warn_count + 1
          WHERE user_id = ?`;
          conn.write.query(sql, user_id, (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function updateAlarmLink(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          UPDATE alarms_table
          SET alarm_link = ?
          WHERE user_id = ? and project_id = ?`;
          conn.write.query(sql, ["warning", user_id, project_id], (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function selectUserIdAndTokens(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT users_table.user_id, device_token, 0 as is_comapny, ? as project_id
          FROM users_table
          LEFT JOIN users_token_table
          ON users_table.user_id = users_token_table.user_id
          WHERE users_table.user_id = ?`;
          conn.read.query(sql, [project_id, user_id], (err, results) => {
            if(err) rollback(reject, err);
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
                alarm_link : 'warning',
                alarm_tag : '경고',
              }
              if(!is_company) {
                alarmData.alarm_content = '해당 프로젝트에서 제외되었습니다.';
                if(device_token) {
                  sendFCM(device_token, alarmData.alarm_content);
                }
                if(user_ids.indexOf(alarm_user_id) < 0) {
                  var sql = `
                  INSERT INTO alarms_table SET ?`;
                  conn.write.query(sql, [alarmData], (err, results) => {
                    if(err) rollback(reject, err);
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

    beginTransaction([{}])
    .then(deleteOpinion)
    .then(deleteInterview)
    .then(deleteProjectParticipants)
    .then(deleteReportHistory)
    .then(updateApprovedState)
    .then(updateUserWarningCount)
    .then(updateAlarmLink)
    .then(selectUserIdAndTokens)
    .then(endTransaction)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "project sanction",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/admin/interviews', (req, res, next) => {
    var user_id = req.decoded.user_id;
    function selectInterviews() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM interviews_table
          WHERE interview_is_new = 1 and project_participant_id in
          (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
          as interview_num,
          (SELECT COUNT(*) FROM interviews_table
          WHERE project_participant_id in
          (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
          as total_interview_num,
          (max_participant_num * 2)
          as max_interview_num
          FROM projects_table
          ORDER BY project_id DESC`;
          conn.read.query(sql, (err, results) => {
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

  route.get('/admin/project/:project_id/interviews', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var project_id = req.params.project_id;
    function selectProject() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM interviews_table
          WHERE project_participant_id in
          (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
          as total_interview_num,
          (max_participant_num * 2)
          as max_interview_num
          FROM projects_table
          WHERE project_id = ?`;
          conn.read.query(sql, project_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      )
    }
    function selectInterviews(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM interviews_table WHERE project_participant_id = project_participants_table.project_participant_id and interview_is_new = 1)
          as interview_num
          FROM project_participants_table
          LEFT JOIN (SELECT COUNT(*) as ordinal, project_participant_id as participant_id,
          max(interview_request_registration_date) as interview_request_registration_date, max(interview_response_registration_date) as interview_response_registration_date FROM interviews_table
          GROUP BY project_participant_id DESC) as ordinal_table
          ON project_participants_table.project_participant_id = ordinal_table.participant_id
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          WHERE project_id = ? ORDER BY interview_response_registration_date DESC, interview_request_registration_date DESC`;
          conn.read.query(sql, project_id, (err, results) => {
            if(err) reject(err);
            else {
              params[0].interviews = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }

    selectProject()
    .then(selectInterviews)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select project interviews",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/admin/interview/:project_participant_id', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var project_participant_id = req.params.project_participant_id;
    function selectProject() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT project_end_date > (now() + INTERVAL 1 DAY) as is_available,
          (SELECT COUNT(*) FROM interviews_table
          WHERE project_participant_id in
          (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
          as total_interview_num,
          (max_participant_num * 2)
          as max_interview_num
          FROM projects_table
          LEFT JOIN project_participants_table
          ON projects_table.project_id = project_participants_table.project_id
          WHERE project_participant_id = ?`;
          conn.read.query(sql, project_participant_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      )
    }
    function selectUserById(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT nickname FROM users_table
          LEFT JOIN project_participants_table
          ON users_table.user_id = project_participants_table.user_id
          WHERE project_participant_id = ?`;
          conn.read.query(sql, [project_participant_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].nickname = results[0].nickname;
              resolve([params[0]]);
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
          WHERE project_participants_table.project_participant_id = ?`;
          conn.read.query(sql, [project_participant_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].interviews = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }

    selectProject()
    .then(selectUserById)
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

  route.get('/newsfeeds', (req, res, next) => {
    function selectNewsfeeds() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM newsfeeds_table
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

  route.put('/newsfeed/:newsfeed_id/private', (req, res, next) => {
    var newsfeed_id = req.params.newsfeed_id;
    var value = req.body.value;

    function updateNewsfeedPrivateState() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          UPDATE newsfeeds_table SET is_private = ? WHERE newsfeed_id = ?`;
          conn.read.query(sql, [value, newsfeed_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }

    updateNewsfeedPrivateState()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "update newsfeed private state",
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

  route.put('/project/:project_id/private', (req, res, next) => {
    var project_id = req.params.project_id;
    var value = req.body.value;

    function updateProjectPrivateState() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          UPDATE projects_table SET is_private = ? WHERE project_id = ?`;
          conn.read.query(sql, [value, project_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }

    updateProjectPrivateState()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "update project private state",
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
          WHERE interview_is_new = 1 and project_participant_id in
          (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
          as interview_num,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
          as participant_num
          FROM projects_table LEFT JOIN users_table
          ON projects_table.company_id = users_table.user_id
          WHERE project_id = ?`;
          conn.read.query(sql, [project_id], (err, results) => {
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
          as non_empathy_num
          FROM project_participants_table
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          WHERE project_id = ?
          ORDER BY empathy_num ASC, empathy_num - non_empathy_num ASC`;
          conn.read.query(sql, [project_id], (err, results) => {
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
    var project_id = req.params.project_id;
    function selectProjectById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM interviews_table
          WHERE project_participant_id in
          (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
          as total_interview_num,
          (max_participant_num * 2)
          as max_interview_num,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
          as participant_num
          FROM projects_table
          LEFT JOIN users_table
          ON projects_table.company_id = users_table.user_id
          WHERE project_id = ?`;
          conn.read.query(sql, [project_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      );
    }

    selectProjectById()
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

  route.get('/project/participants/:project_id', (req, res, next) => {
    var project_id = req.params.project_id;
    function selectProjectParticipants() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM opinions_table WHERE project_participant_id = project_participants_table.project_participant_id)
          as opinion_num,
          (SELECT COUNT(*) FROM interviews_table WHERE project_participant_id = project_participants_table.project_participant_id)
          as interview_num
          FROM project_participants_table
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          LEFT JOIN levels_table
          ON users_table.level = levels_table.level
          LEFT JOIN project_participation_history_table
          ON project_participants_table.user_id = project_participation_history_table.user_id
          and project_participants_table.project_id = project_participation_history_table.project_id
          WHERE project_participants_table.project_id = ?`;
          conn.read.query(sql, [project_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }

    selectProjectParticipants()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select project participants",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/project/participant/:project_participant_id', (req, res, next) => {
    var project_participant_id = req.params.project_participant_id;
    function selectProjectParticipant() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM project_participants_table
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          LEFT JOIN levels_table
          ON users_table.level = levels_table.level
          LEFT JOIN project_participation_history_table
          ON project_participants_table.user_id = project_participation_history_table.user_id
          and project_participants_table.project_id = project_participation_history_table.project_id
          WHERE project_participant_id = ?`;
          conn.read.query(sql, [project_participant_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      );
    }

    selectProjectParticipant()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select project participant",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.get('/project/reports/:project_id', (req, res, next) => {
    var project_id = req.params.project_id;
    function selectReports() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *
          FROM project_participants_table
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          LEFT JOIN levels_table
          ON users_table.level = levels_table.level
          WHERE project_participants_table.project_id = ? and project_report_registration_date is not null`;
          conn.read.query(sql, [project_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }

    selectReports()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select user reports",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.put('/project/report/select/:project_participant_id', (req, res, next) => {
    var project_participant_id = req.params.project_participant_id;
    // 최대 인원의 10% 선정
    function selectPreCondition() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT (max_participant_num / 10) as max_selected_report_num,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id and project_report_is_select = true)
          as selected_report_num
          FROM projects_table
          LEFT JOIN project_participants_table
          ON projects_table.project_id = project_participants_table.project_id
          WHERE project_participant_id = ?
          `;
          conn.read.query(sql, [project_participant_id], (err, results) => {
            if(err) reject(err);
            else {
              if(results[0].max_selected_report_num <= results[0].selected_report_num) {
                res.json(
                  {
                    "success" : true,
                    "message" : "selected report num is over"
                  });
              }
              else {
                resolve();
              }
            }
          });
        }
      )
    }

    function updateSelectedReport() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          UPDATE project_participants_table SET project_report_is_select = 1 WHERE project_participant_id = ?`;
          conn.read.query(sql, [project_participant_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }

    selectPreCondition()
    .then(updateSelectedReport)
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

  route.get('/project/report/:project_id', (req, res, next) => {
    var user_id = req.decoded.user_id;
    var project_id = req.params.project_id;

    function selectProjectById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM interviews_table
          WHERE interview_is_new = 1 and project_participant_id in
          (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
          as interview_num,
          (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
          as participant_num
          FROM projects_table LEFT JOIN users_table
          ON projects_table.company_id = users_table.user_id
          WHERE project_id = ?`;
          conn.read.query(sql, [project_id], (err, results) => {
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
          as non_empathy_num
          FROM project_participants_table
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          WHERE project_id = ?
          ORDER BY empathy_num ASC, empathy_num - non_empathy_num ASC`;
          conn.read.query(sql, [project_id], (err, results) => {
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
    function selectProjectParticipants(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *,
          (SELECT COUNT(*) FROM opinions_table WHERE project_participant_id = project_participants_table.project_participant_id)
          as opinion_num,
          (SELECT COUNT(*) FROM interviews_table WHERE project_participant_id = project_participants_table.project_participant_id)
          as interview_num
          FROM project_participants_table
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          LEFT JOIN levels_table
          ON users_table.level = levels_table.level
          LEFT JOIN project_participation_history_table
          ON project_participants_table.user_id = project_participation_history_table.user_id
          and project_participants_table.project_id = project_participation_history_table.project_id
          WHERE project_participants_table.project_id = ?`;
          conn.read.query(sql, [project_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].participants = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }
    function selectReports(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *
          FROM project_participants_table
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          LEFT JOIN levels_table
          ON users_table.level = levels_table.level
          WHERE project_participants_table.project_id = ? and project_report_registration_date is not null`;
          conn.read.query(sql, [project_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].reports = results;
              resolve([params[0]]);
            }
          });
        }
      );
    }

    selectProjectById()
    .then(selectProjectFeedbacks)
    .then(chooseBestFeedback)
    .then(selectProjectParticipants)
    .then(selectReports)
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

  route.get('/project/:project_id/feedback/:feedback_id', (req, res, next) => {
    var project_id = req.params.project_id;
    var feedback_id = req.params.feedback_id;

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
          conn.read.query(sql, [project_id], (err, results) => {
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
          as non_empathy_num
          FROM project_participants_table
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          WHERE project_id = ?
          ORDER BY empathy_num ASC, empathy_num - non_empathy_num ASC`;
          conn.read.query(sql, [project_id], (err, results) => {
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
          ORDER BY opinion_registration_date DESC`;
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
  /* mobile */

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
