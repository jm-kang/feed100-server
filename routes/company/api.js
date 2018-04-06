module.exports = function(conn, admin) {
  var route = require('express').Router();

  //리뉴얼 이후

  // 기업 정보(프로젝트 등록 이력?)
  route.get('/company', (req, res, next) => {
    var user_id = req.decoded.user_id;

    function selectProjectById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT project_id FROM projects_table
          WHERE company_id = ?
          ORDER BY project_id DESC limit 1`;
          conn.read.query(sql, [user_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      )
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

  // 프로젝트 홈
  route.get('/project/home', (req, res, next) => {
    var user_id = req.decoded.user_id;

    // project_main_image, project_name
    // project_first_impression_rate, participant_num, project_end_date
    // participant list
    function selectProjectById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM projects_table
          WHERE company_id = ?
          ORDER BY project_id DESC limit 1`;
          conn.read.query(sql, [user_id], (err, results) => {
            if(err) reject(err);
            else {
              if(!results.length) {
                res.json(
                  {
                    "success" : true,
                    "message" : "project is not registered",
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
    function selectProjectParticipants(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT *, interviews_table.interview_answer as content,
          (SELECT COUNT(*) FROM interviews_table
          WHERE project_participant_id = project_participants_table.project_participant_id and is_new = 1)
          as interview_num
          FROM project_participants_table
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          LEFT JOIN interviews_table
          ON project_participants_table.project_participant_id = interviews_table.project_participant_id
          and interview_answer is not null
          WHERE project_id = ? and process_completion = 1
          ORDER BY interviews_table.interview_id DESC LIMIT 1`;
          conn.read.query(sql, [params[0].project_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].participants = results;
              resolve([params[0]]);
            }
          })
        }
      )
    }

    selectProjectById()
    .then(selectProjectParticipants)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select project home",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  // 프로젝트 내용(데이터, 스토리)
  route.get('/project/:project_id', (req, res, next) => {
    var project_id = req.params.project_id;

    function selectProjectById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM projects_table
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
      )
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

  // 알림 리스트
  route.get('/notifications', (req, res, next) => {
    var user_id = req.decoded.user_id;

    // 알림 갯수 초기화
    function updateNotificationIsNew() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          UPDATE notifications_table SET is_new = 0
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
    function selectNotifications() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT notifications_table.notification_id, notifications_table.project_id, notifications_table.project_participant_id,
          notifications_table.is_read,notifications_table.notification_link, notifications_table.notification_tag,
          notifications_table.notification_content, notifications_table.notification_registration_date,
          projects_table.project_main_image, users_table.avatar_image
          FROM notifications_table
          LEFT JOIN projects_table
          ON notifications_table.project_id = projects_table.project_id
          LEFT JOIN project_participants_table
          ON notifications_table.project_participant_id = project_participants_table.project_participant_id
          LEFT JOIN users_table
          ON project_participants_table.user_id = users_table.user_id
          WHERE notifications_table.user_id = ? ORDER BY notification_id DESC`;
          conn.read.query(sql, user_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          });
        }
      );
    }

    updateNotificationIsNew()
    .then(selectNotifications)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select notifications",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });
  });

  // 알림 갯수
  route.get('/notification/num', (req, res, next) => {
    var user_id = req.decoded.user_id;

    function selectNotificationNum() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT COUNT(*) as notification_num
          FROM notifications_table
          WHERE user_id = ? and is_new = 1`;
          conn.read.query(sql, [user_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      );
    }

    selectNotificationNum()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select notification num",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  // 참여자 목록(그룹 인터뷰)
  route.get('/participants/:project_id', (req, res, next) => {
    var project_id = req.params.project_id;

    function selectProjectParticipants() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM project_participants_table
          WHERE project_id = ? and process_completion = 1`;
          conn.read.query(sql, [project_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results]);
            }
          })
        }
      )
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

  // 인터뷰 내용
  route.get('/interviews/:project_participant_id', (req, res, next) => {
    var project_participant_id = req.params.project_participant_id;

    function selectProjectParticipantById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM project_participants_table
          WHERE project_participant_id = ?`;
          conn.read.query(sql, [project_participant_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          })
        }
      )
    }
    function selectInterviewsById(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM interviews_table
          WHERE project_participant_id = ?`;
          conn.read.query(sql, [project_participant_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].interviews = results;
              resolve([params[0]]);
            }
          });
        }
      )
    }

    selectProjectParticipantById()
    .then(selectInterviewsById)
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

  // 종합 보고서
  route.get('/comprehensive-report/:project_id', (req, res, next) => {
    var project_id = req.params.project_id;

    function selectProjectById() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM projects_table WHERE project_id = ?`;
          conn.read.query(sql, [project_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve([results[0]]);
            }
          });
        }
      )
    }
    function selectProjectParticipants(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM project_participants_table
          WHERE project_id = ? and process_completion = 1`;
          conn.read.query(sql, [project_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].participants = results;
              resolve([params[0]]);
            }
          })
        }
      )
    }
    function selectInterviews(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT * FROM interviews_table
          LEFT JOIN project_participants_table
          ON interviews_table.project_participant_id = project_participants_table.project_participant_id
          WHERE project_participants_table.project_id = ?`;
          conn.read.query(sql, [project_id], (err, results) => {
            if(err) reject(err);
            else {
              params[0].interviews = results;
              resolve([params[0]]);
            }
          });
        }
      )
    }

    selectProjectById()
    .then(selectProjectParticipants)
    .then(selectInterviews)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "select project comprehensive-report",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  // 알림 읽음
  route.put('/notification/:notification_id/read', (req, res, next) => {
    var notification_id = req.params.notification_id;

    function updateNotificationIsRead() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          UPDATE notifications_table SET is_read = 1
          WHERE notification_id = ?`;
          conn.write.query(sql, notification_id, (err, results) => {
            if(err) reject(err);
            else {
              resolve();
            }
          });
        }
      )
    }

    updateNotificationIsRead()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "update is_read"
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  // 인터뷰 질문 작성(개인)
  // 알림 및 푸시 전송
  route.post('/interview/:project_id/:project_participant_id', (req, res, next) => {
    var project_id = req.params.project_id;
    var project_participant_id = req.params.project_participant_id;
    var interview_question = req.body.interview_question;

    function insertInterviewQuestion() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          INSERT INTO interviews_table
          SET interview_question = ?, project_participant_id = ?`;
          conn.write.query(sql, [interview_question, project_participant_id], (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve();
            }
          });
        }
      )
    }
    function selectProjectNameAndUserId() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT project_name,
          (SELECT users_table.user_id FROM users_table
          LEFT JOIN project_participants_table
          ON users_table.user_id = project_participants_table.user_id
          WHERE project_participant_id = ?) as user_id
          FROM projects_table WHERE project_id = ?`;
          conn.read.query(sql, [project_participant_id, project_id], (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([results[0]]);
            }
          });
        }
      )
    }
    function insertNotification(params) {
      return new Promise(
        (resolve, reject) => {
          var notification_data = {
            user_id : params[0].user_id,
            project_id : project_id,
            notification_link : 'newInterview',
            notification_tag : '인터뷰 요청',
            notification_content : '새로운 인터뷰가 도착했습니다. 응답해주세요!'
          }
          var sql = `
          INSERT INTO notifications_table SET ?`;
          conn.write.query(sql, [notification_data], (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([params[0]])
            }
          });
        }
      )

    }
    function selectUserTokensAndPush(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT device_token
          FROM user_tokens_table WHERE user_id = ?`;
          conn.read.query(sql, [params[0].user_id], (err, results) => {
            if(err) rollback(reject, err);
            else {
              if(results[0]) {
                var device_tokens = results.map((obj) => {
                  return obj.device_token;
                })
                sendFCM(device_tokens, '[인터뷰 요청] ' + params[0].project_name, '새로운 인터뷰가 도착했습니다. 응답해주세요!')
                resolve([results]);
              }
              else {
                resolve([]);
              }
            }
          });
        }
      )
    }

    beginTransaction([{}])
    .then(insertInterviewQuestion)
    .then(selectProjectNameAndUserId)
    .then(insertNotification)
    .then(selectUserTokensAndPush)
    .then(endTransaction)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "insert interview question",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  // 인터뷰 질문 작성(그룹)
  // 알림 및 푸시 전송
  route.post('/group-interview/:project_id', (req, res, next) => {
    var project_id = req.params.project_id;
    var project_participants_id = req.params.project_participants_id;
    var interview_question = req.body.interview_question;
    // var project_id = 22;
    // var project_participants_id = [2, 3];
    // var interview_question = "그룹 인터뷰 테스트입니다.";

    function insertInterviewQuestion(params) {
      return new Promise(
        (resolve, reject) => {
          console.log('insertInterviewQuestion');
          var sql = `
          INSERT INTO interviews_table
          SET interview_question = ?, project_participant_id = ?`;
          conn.write.query(sql, [interview_question, params[0].project_participant_id], (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([params[0]]);
            }
          });
        }
      )
    }
    function selectProjectNameAndUserId(params) {
      return new Promise(
        (resolve, reject) => {
          console.log('selectProjectNameAndUserId');
          var sql = `
          SELECT project_name,
          (SELECT users_table.user_id FROM users_table
          LEFT JOIN project_participants_table
          ON users_table.user_id = project_participants_table.user_id
          WHERE project_participant_id = ?) as user_id
          FROM projects_table WHERE project_id = ?`;
          conn.read.query(sql, [params[0].project_participant_id, project_id], (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([results[0]]);
            }
          });
        }
      )
    }
    function insertNotification(params) {
      return new Promise(
        (resolve, reject) => {
          console.log('insertNotification');
          var notification_data = {
            user_id : params[0].user_id,
            project_id : project_id,
            notification_link : 'newInterview',
            notification_tag : '인터뷰 요청',
            notification_content : '새로운 인터뷰가 도착했습니다. 응답해주세요!'
          }
          var sql = `
          INSERT INTO notifications_table SET ?`;
          conn.write.query(sql, [notification_data], (err, results) => {
            if(err) rollback(reject, err);
            else {
              resolve([params[0]])
            }
          });
        }
      )

    }

    function selectUserTokensAndPushs(params) {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          SELECT device_token
          FROM user_tokens_table
          WHERE user_id in
          (SELECT user_id FROM project_participants_table
            WHERE project_participant_id in (?))
          `;
          conn.read.query(sql, [project_participants_id], (err, results) => {
            if(err) rollback(reject, err);
            else {
              if(results[0]) {
                var device_tokens = results.map((obj) => {
                  return obj.device_token;
                })
                sendFCM(device_tokens, '[인터뷰 요청] ' + params[0].project_name, '새로운 인터뷰가 도착했습니다. 응답해주세요!');
                resolve([results]);
              }
              else {
                resolve([{}]);
              }
            }
          });
        }
      )
    }

    function insertInterviews(params) {
      return new Promise(
        (resolve, reject) => {
          var forEachCondition = true;
          var len = project_participants_id.length;
          var epoch = 0;
          project_participants_id.forEach((project_participant_id) => {
            console.log(project_participant_id);
            insertInterviewQuestion([{ project_participant_id : project_participant_id }])
            .then(selectProjectNameAndUserId)
            .then(insertNotification)
            .then((params) => {
              console.log(project_participant_id + " params : " + params);
              epoch++;
              if(epoch == len) {
                console.log('then', forEachCondition, project_participant_id);
                if(forEachCondition) {
                  resolve([params[0]]);
                }
                else {
                  rollback(reject, 'insertInterviews error');
                }
              }
            })
            .catch((err) => {
              forEachCondition = false;
              epoch++;
              if(epoch == len) {
                console.log('catch', forEachCondition, project_participant_id);
                rollback(reject, err);
              }
            })
          });

        }
      )
    }

    beginTransaction([{}])
    .then(insertInterviews)
    .then(selectUserTokensAndPushs)
    .then(endTransaction)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "insert group interview question",
          "data" : params[0]
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  // 인터뷰 피드백 좋아요
  route.post('/interview/:interview_id/like', (req, res, next) => {
    var interview_id = req.params.interview_id;

    function likeInterview() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          UPDATE interviews_table SET is_like = 1 WHERE interview_id = ?`;
          conn.write.query(sql, [interview_id], (err, results) => {
            if(err) reject(err);
            else {
              resolve();
            }
          });
        }
      )
    }

    likeInterview()
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "like interview"
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  // 디바이스 토큰 등록(푸시 관련)
  route.post('/device-token', (req, res, next) => {
    var uuid = req.body.uuid;
    var device_token = req.body.device_token;
    var user_id = req.decoded.user_id;

    function insertDeviceToken() {
      return new Promise(
        (resolve, reject) => {
          var sql = `
          INSERT INTO user_tokens_table (uuid, device_token, user_id) VALUES (?, ?, ?)
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


  //리뉴얼 이전
  // route.get('/company', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   function selectByUserId() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *
  //         FROM users_table
  //         WHERE user_id = ?`;
  //         conn.read.query(sql, user_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             delete results[0].password;
  //             delete results[0].salt;
  //             resolve([results[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //   function selectParticipationProjectById(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         // 1.0.9 LEFT JOIN users_table 제거 필요
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
  //         as participant_num,
  //         1 as is_my_project
  //         FROM projects_table
  //         LEFT JOIN users_table
  //         ON projects_table.company_id = users_table.user_id
  //         WHERE projects_table.company_id = ?
  //         ORDER BY projects_table.project_id DESC`;
  //         conn.read.query(sql, user_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             var proceedingProjects = [];
  //             var endProjects = [];
  //             if(results.length > 0) {
  //               for(var i=0; i<results.length; i++) {
  //                 if(new Date(results[i].project_end_date) > new Date()) {
  //                   proceedingProjects.push(results[i]);
  //                   if(i == results.length-1) {
  //                     params[0].proceeding_projects = proceedingProjects;
  //                     params[0].end_projects = endProjects;
  //                     resolve([params[0]]);
  //                   }
  //                 }
  //                 else {
  //                   endProjects.push(results[i]);
  //                   if(i == results.length-1) {
  //                     params[0].proceeding_projects = proceedingProjects;
  //                     params[0].end_projects = endProjects;
  //                     resolve([params[0]]);
  //                   }
  //                 }
  //               }
  //             }
  //             else {
  //               params[0].proceeding_projects = proceedingProjects;
  //               params[0].end_projects = endProjects;
  //               resolve([params[0]]);
  //             }
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectByUserId()
  //   .then(selectParticipationProjectById)
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select user by user_id",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.put('/company/account', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   var avatar_image = req.body.avatar_image;
  //   var nickname = req.body.nickname;
  //
  //   function updateUserAccount() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `UPDATE users_table SET avatar_image = ?, nickname = ? WHERE user_id = ?`;
  //         conn.write.query(sql, [avatar_image, nickname, user_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results]);
  //           }
  //         });
  //       }
  //     )
  //   }
  //
  //   updateUserAccount()
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "update account",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/company/home', (req, res, next) => {
  //   // 진행중 전부, 새 프로젝트 3, 새 뉴스피드 5
  //   var user_id = req.decoded.user_id;
  //   function selectProceedingProjectByUserId() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         // 1.0.9 LEFT JOIN users_table 제거 필요
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
  //         as participant_num,
  //         1 as is_my_project
  //         FROM projects_table
  //         LEFT JOIN users_table
  //         ON projects_table.company_id = users_table.user_id
  //         WHERE project_end_date > now() and projects_table.company_id = ?
  //         ORDER BY projects_table.project_id DESC`;
  //         conn.read.query(sql, user_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //   function selectProjects(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         // 1.0.9 LEFT JOIN users_table 제거 필요
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
  //         as participant_num,
  //         IF(company_id = ?, 1, 0)
  //         as is_my_project
  //         FROM projects_table
  //         LEFT JOIN users_table
  //         ON projects_table.company_id = users_table.user_id
  //         WHERE is_private = false
  //         ORDER BY projects_table.project_id DESC LIMIT 3`;
  //         conn.read.query(sql, user_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             var data = {
  //               proceeding_projects : params[0],
  //               new_projects : results
  //             }
  //             resolve([data]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //   function selectNewsfeeds(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT * FROM newsfeeds_table
  //         WHERE is_private = false
  //         ORDER BY newsfeed_id DESC LIMIT 5`;
  //         conn.read.query(sql, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             params[0].new_newsfeeds = results;
  //             resolve([params[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectProceedingProjectByUserId()
  //   .then(selectProjects)
  //   .then(selectNewsfeeds)
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select company home data",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  // });
  //
  // route.get('/company/project/:project_id', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   var project_id = req.params.project_id;
  //
  //   function selectProjectById() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT COUNT(*) as is_my_project FROM projects_table
  //         WHERE company_id = ? and project_id = ?`;
  //         conn.read.query(sql, [user_id, project_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectProjectById()
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select is_my_project",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/company/alarms', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   function updateAlarmIsNew() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         UPDATE alarms_table SET alarm_is_new = 0
  //         WHERE user_id = ?`;
  //         conn.read.query(sql, user_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //   function selectAlarms() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT * FROM alarms_table LEFT JOIN projects_table
  //         ON alarms_table.project_id = projects_table.project_id
  //         WHERE user_id = ? ORDER BY alarm_id DESC`;
  //         conn.read.query(sql, user_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   updateAlarmIsNew()
  //   .then(selectAlarms)
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select alarms",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.post('/company/alarm/read', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   var alarm_id = req.body.alarm_id;
  //   function updateAlarmIsRead() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         UPDATE alarms_table SET alarm_is_read = 1
  //         WHERE alarm_id = ?`;
  //         conn.write.query(sql, alarm_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve();
  //           }
  //         });
  //       }
  //     )
  //   }
  //   function selectAlarms() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT * FROM alarms_table LEFT JOIN projects_table
  //         ON alarms_table.project_id = projects_table.project_id
  //         WHERE user_id = ? ORDER BY alarm_id DESC`;
  //         conn.read.query(sql, user_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   updateAlarmIsRead()
  //   .then(selectAlarms)
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "update alarm_is_read and select alarms",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/company/alarm&interview/num', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   function selectAlarmAndInterviewNum() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT COUNT(*) as interview_num,
  //         (SELECT COUNT(*) FROM alarms_table WHERE user_id = ? and alarm_is_new = 1) as alarm_num
  //         FROM interviews_table
  //         WHERE project_participant_id in
  //         (SELECT project_participant_id
  //         FROM project_participants_table
  //         LEFT JOIN projects_table
  //         ON project_participants_table.project_id = projects_table.project_id
  //         WHERE company_id = ? and interview_is_new = 1)`;
  //         conn.read.query(sql, [user_id, user_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectAlarmAndInterviewNum()
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select alarm and interview num",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.post('/company/report/newsfeed', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   var newsfeed_id = req.body.newsfeed_id;
  //   var newsfeed_comment_id = req.body.newsfeed_comment_id;
  //   var newsfeed_report_data = {
  //     user_id : user_id,
  //     newsfeed_id : newsfeed_id,
  //     newsfeed_comment_id : newsfeed_comment_id,
  //   };
  //
  //   function selectPreCondition() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT * FROM newsfeed_report_history_table
  //         WHERE user_id = ? and newsfeed_comment_id = ?`;
  //         conn.read.query(sql, [user_id, newsfeed_comment_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             if(results[0]) {
  //               res.json({
  //                 "success" : false,
  //                 "message" : "already reported"
  //               });
  //             }
  //             else {
  //               resolve();
  //             }
  //           }
  //         });
  //       }
  //     )
  //   }
  //   function reportNewsfeed() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         INSERT INTO newsfeed_report_history_table SET ?`;
  //         conn.write.query(sql, newsfeed_report_data, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve();
  //           }
  //         });
  //       }
  //     )
  //   }
  //
  //   selectPreCondition()
  //   .then(reportNewsfeed)
  //   .then(() => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "report newsfeed"
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.post('/company/report/project', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   var project_id = req.body.project_id;
  //   var project_participant_id = req.body.project_participant_id;
  //   var feedback_id = (req.body.feedback_id) ? req.body.feedback_id : 0;
  //   var opinion_id = (req.body.opinion_id) ? req.body.opinion_id : 0;
  //   var interview_id = (req.body.interview_id) ? req.body.interview_id : 0;
  //   var report_id = (req.body.report_id) ? req.body.report_id : 0;
  //   var project_report_data = {
  //     user_id : user_id,
  //     project_id : project_id,
  //     project_participant_id : project_participant_id,
  //     feedback_id : feedback_id,
  //     opinion_id : opinion_id,
  //     interview_id : interview_id,
  //     report_id : report_id
  //   };
  //
  //   function selectPreCondition() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT * FROM project_report_history_table
  //         WHERE user_id = ?
  //         and project_id = ?
  //         and project_participant_id = ?
  //         and feedback_id = ?
  //         and opinion_id = ?
  //         and interview_id = ?
  //         and report_id = ?`;
  //         conn.read.query(sql, [user_id, project_id, project_participant_id, feedback_id, opinion_id, interview_id, report_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             if(results[0]) {
  //               res.json({
  //                 "success" : false,
  //                 "message" : "already reported"
  //               });
  //             }
  //             else {
  //               resolve();
  //             }
  //           }
  //         });
  //       }
  //     )
  //   }
  //   function reportProject() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         INSERT INTO project_report_history_table SET ?`;
  //         conn.write.query(sql, project_report_data, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve();
  //           }
  //         });
  //       }
  //     )
  //   }
  //
  //   selectPreCondition()
  //   .then(reportProject)
  //   .then(() => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "report project"
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/company/interviews', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   function selectInterviews() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM interviews_table
  //         WHERE interview_is_new = 1 and project_participant_id in
  //         (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
  //         as interview_num,
  //         (SELECT COUNT(*) FROM interviews_table
  //         WHERE project_participant_id in
  //         (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
  //         as total_interview_num,
  //         (max_participant_num * 2)
  //         as max_interview_num
  //         FROM projects_table
  //         WHERE projects_table.company_id = ? ORDER BY project_id DESC`;
  //         conn.read.query(sql, user_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectInterviews()
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select interviews",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/company/project/:project_id/interviews', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   var project_id = req.params.project_id;
  //   function selectProject() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM interviews_table
  //         WHERE project_participant_id in
  //         (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
  //         as total_interview_num,
  //         (max_participant_num * 2)
  //         as max_interview_num
  //         FROM projects_table
  //         WHERE project_id = ?`;
  //         conn.read.query(sql, project_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results[0]]);
  //           }
  //         });
  //       }
  //     )
  //   }
  //   function selectInterviews(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM interviews_table WHERE project_participant_id = project_participants_table.project_participant_id and interview_is_new = 1)
  //         as interview_num
  //         FROM project_participants_table
  //         LEFT JOIN (SELECT COUNT(*) as ordinal, project_participant_id as participant_id,
  //         max(interview_request_registration_date) as interview_request_registration_date, max(interview_response_registration_date) as interview_response_registration_date FROM interviews_table
  //         GROUP BY project_participant_id DESC) as ordinal_table
  //         ON project_participants_table.project_participant_id = ordinal_table.participant_id
  //         LEFT JOIN users_table
  //         ON project_participants_table.user_id = users_table.user_id
  //         WHERE project_id = ? ORDER BY interview_response_registration_date DESC, interview_request_registration_date DESC`;
  //         conn.read.query(sql, project_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             params[0].interviews = results;
  //             resolve([params[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectProject()
  //   .then(selectInterviews)
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select project interviews",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/company/interview/:project_participant_id', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   var project_participant_id = req.params.project_participant_id;
  //   function updateInterviewIsNew() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         UPDATE interviews_table SET interview_is_new = 0
  //         WHERE project_participant_id = ?`;
  //         conn.write.query(sql, project_participant_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve();
  //           }
  //         });
  //       }
  //     )
  //   }
  //   function selectProject() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT project_end_date > (now() + INTERVAL 1 DAY) as is_available,
  //         (SELECT COUNT(*) FROM interviews_table
  //         WHERE project_participant_id in
  //         (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
  //         as total_interview_num,
  //         (max_participant_num * 2)
  //         as max_interview_num
  //         FROM projects_table
  //         LEFT JOIN project_participants_table
  //         ON projects_table.project_id = project_participants_table.project_id
  //         WHERE project_participant_id = ?`;
  //         conn.read.query(sql, project_participant_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results[0]]);
  //           }
  //         });
  //       }
  //     )
  //   }
  //   function selectUserById(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT nickname FROM users_table
  //         LEFT JOIN project_participants_table
  //         ON users_table.user_id = project_participants_table.user_id
  //         WHERE project_participant_id = ?`;
  //         conn.read.query(sql, [project_participant_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             params[0].nickname = results[0].nickname;
  //             resolve([params[0]]);
  //           }
  //         });
  //       }
  //     )
  //   }
  //   function selectInterviewById(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT * FROM interviews_table
  //         LEFT JOIN project_participants_table
  //         ON interviews_table.project_participant_id = project_participants_table.project_participant_id
  //         LEFT JOIN users_table
  //         ON project_participants_table.user_id = users_table.user_id
  //         LEFT JOIN projects_table
  //         ON project_participants_table.project_id = projects_table.project_id
  //         WHERE project_participants_table.project_participant_id = ?`;
  //         conn.read.query(sql, [project_participant_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             params[0].interviews = results;
  //             resolve([params[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   updateInterviewIsNew()
  //   .then(selectProject)
  //   .then(selectUserById)
  //   .then(selectInterviewById)
  //   .then((params) => {
  //     res.send(
  //       {
  //         "success" : true,
  //         "message" : "select interview",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.post('/company/interview/:project_participant_id', (req, res, next) => {
  //   var project_participant_id = req.params.project_participant_id;
  //   var interview_request = req.body.interview_request;
  //   var interview_request_images = req.body.interview_request_images;
  //
  //   function selectPreCondition() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT project_end_date > (now() + INTERVAL 1 DAY) as is_available,
  //         (SELECT COUNT(*) FROM interviews_table
  //         WHERE project_participant_id in
  //         (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
  //         as total_interview_num,
  //         (max_participant_num * 2)
  //         as max_interview_num
  //         FROM projects_table
  //         LEFT JOIN project_participants_table
  //         ON projects_table.project_id = project_participants_table.project_id
  //         WHERE project_participant_id = ?`;
  //         conn.read.query(sql, [project_participant_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             if(!results[0].is_available) {
  //               res.json(
  //                 {
  //                   "success" : true,
  //                   "message" : "interview is not available"
  //                 });
  //             }
  //             else if(results[0].total_interview_num >= results[0].max_interview_num) {
  //               res.json(
  //                 {
  //                   "success" : true,
  //                   "message" : "interview_num is exceeded"
  //                 });
  //             }
  //             else {
  //               resolve();
  //             }
  //           }
  //         });
  //       }
  //     )
  //   }
  //   function insertInterviewRequest() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var requestData = {
  //           project_participant_id : project_participant_id,
  //           interview_request : interview_request,
  //           interview_request_images : (interview_request_images == null) ? null : JSON.stringify(interview_request_images)
  //         }
  //         var sql = `
  //         INSERT interviews_table SET ?`;
  //         conn.write.query(sql, [requestData], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results]);
  //           }
  //         });
  //       }
  //     )
  //   }
  //   function selectUserIdAndTokens(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT project_participants_table.user_id, device_token, 0 as is_company, project_id
  //         FROM project_participants_table
  //         LEFT JOIN users_token_table
  //         ON project_participants_table.user_id = users_token_table.user_id
  //         WHERE project_participant_id = ?`;
  //         conn.read.query(sql, [project_participant_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             insertAlarmAndPush(0, results);
  //           }
  //         });
  //         var user_ids = [];
  //         function insertAlarmAndPush(i, list) {
  //           if(i < list.length) {
  //             var alarm_user_id = list[i].user_id;
  //             var project_id = list[i].project_id;
  //             var device_token = list[i].device_token;
  //             var is_company = list[i].is_company;
  //             var alarmData = {
  //               user_id : alarm_user_id,
  //               project_id : project_id,
  //               alarm_link : 'newInterview',
  //               alarm_tag : '새 인터뷰',
  //             }
  //             if(!is_company) {
  //               alarmData.alarm_content = '새로운 인터뷰가 도착했습니다. 응답해주세요!';
  //               if(device_token) {
  //                 sendFCM(device_token, alarmData.alarm_content);
  //               }
  //               if(user_ids.indexOf(alarm_user_id) < 0) {
  //                 var sql = `
  //                 INSERT INTO alarms_table SET ?`;
  //                 conn.write.query(sql, [alarmData], (err, results) => {
  //                   if(err) reject(err);
  //                   else {
  //                     user_ids.push(alarm_user_id);
  //                     insertAlarmAndPush(++i, list);
  //                   }
  //                 });
  //               }
  //               else {
  //                 insertAlarmAndPush(++i, list);
  //               }
  //             }
  //           }
  //           else {
  //             resolve([params[0]]);
  //           }
  //         }
  //       }
  //     )
  //   }
  //
  //   selectPreCondition()
  //   .then(insertInterviewRequest)
  //   .then(selectUserIdAndTokens)
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "insert interview request",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/newsfeeds', (req, res, next) => {
  //   function selectNewsfeeds() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT * FROM newsfeeds_table
  //         WHERE is_private = false
  //         ORDER BY newsfeed_id DESC`;
  //         conn.read.query(sql, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectNewsfeeds()
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select newsfeeds",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/newsfeed/:newsfeed_id', (req, res, next) => {
  //   var newsfeed_id = req.params.newsfeed_id;
  //   var user_id = req.decoded.user_id;
  //   function updateNewsfeedViewNum() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         UPDATE newsfeeds_table SET newsfeed_view_num = newsfeed_view_num + 1
  //         WHERE newsfeed_id = ?`;
  //         conn.write.query(sql, newsfeed_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve();
  //           }
  //         });
  //       }
  //     )
  //   }
  //   function selectNewsfeedById() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM newsfeed_like_table WHERE newsfeed_id = ?) as newsfeed_like_num,
  //         (SELECT COUNT(*) FROM newsfeed_like_table WHERE user_id = ? and newsfeed_id = ?) as isLike
  //         FROM newsfeeds_table WHERE newsfeed_id = ?`;
  //         conn.read.query(sql, [newsfeed_id, user_id, newsfeed_id, newsfeed_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //   function selectCommentById(params) {
  //     var data = params[0];
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT * FROM newsfeed_comments_table LEFT JOIN users_table
  //         ON newsfeed_comments_table.user_id = users_table.user_id
  //         WHERE newsfeed_comments_table.newsfeed_id = ? ORDER BY newsfeed_comment_id DESC`;
  //         conn.read.query(sql, newsfeed_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             data.newsfeed_comments = results;
  //             data.newsfeed_comment_num = results.length;
  //             resolve([data]);
  //           }
  //         });
  //       }
  //     )
  //   }
  //
  //   updateNewsfeedViewNum()
  //   .then(selectNewsfeedById)
  //   .then(selectCommentById)
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select newsfeed",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.post('/newsfeed/like', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   var newsfeed_id = req.body.newsfeed_id;
  //   function selectNewsfeedLikeById() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT * FROM newsfeed_like_table
  //         WHERE user_id = ? and newsfeed_id = ?`;
  //         conn.read.query(sql, [user_id, newsfeed_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results[0]]);
  //           }
  //         });
  //       }
  //     )
  //   }
  //   function insertOrDeleteNewsfeedlike(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         if(!params[0]) {
  //           var sql = `
  //           INSERT INTO newsfeed_like_table SET user_id = ?, newsfeed_id = ?`;
  //           conn.write.query(sql, [user_id, newsfeed_id], (err, results) => {
  //             if(err) reject(err);
  //             else {
  //               resolve();
  //             }
  //           });
  //         }
  //         else {
  //           var sql = `
  //           DELETE FROM newsfeed_like_table WHERE user_id = ? and newsfeed_id = ?`;
  //           conn.write.query(sql, [user_id, newsfeed_id], (err, results) => {
  //             if(err) reject(err);
  //             else {
  //               resolve();
  //             }
  //           });
  //         }
  //       }
  //     )
  //   }
  //   function selectSyncronizedLikeNumAndIsLike() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT COUNT(*) as newsfeed_like_num,
  //         (SELECT COUNT(*) FROM newsfeed_like_table WHERE user_id = ? and newsfeed_id = ?) as isLike
  //         FROM newsfeed_like_table WHERE newsfeed_id = ?`;
  //         conn.read.query(sql, [user_id, newsfeed_id, newsfeed_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectNewsfeedLikeById()
  //   .then(insertOrDeleteNewsfeedlike)
  //   .then(selectSyncronizedLikeNumAndIsLike)
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "insert or delete newsfeed like num",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.post('/newsfeed/comment', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   var newsfeed_id = req.body.newsfeed_id;
  //   var newsfeed_comment_content = req.body.newsfeed_comment_content;
  //
  //   function insertNewsfeedComment() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         INSERT INTO newsfeed_comments_table
  //         SET user_id = ?, newsfeed_id = ?, newsfeed_comment_content = ?`;
  //         conn.write.query(sql, [user_id, newsfeed_id, newsfeed_comment_content], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve();
  //           }
  //         });
  //       }
  //     )
  //   }
  //   function selectSyncronizedNewsfeedComment() {
  //     var data = {}
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT * FROM newsfeed_comments_table LEFT JOIN users_table
  //         ON newsfeed_comments_table.user_id = users_table.user_id
  //         WHERE newsfeed_comments_table.newsfeed_id = ? ORDER BY newsfeed_comment_id DESC`;
  //         conn.read.query(sql, newsfeed_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             data.newsfeed_comments = results;
  //             data.newsfeed_comment_num = results.length;
  //             resolve([data]);
  //           }
  //         });
  //       }
  //     )
  //   }
  //
  //   insertNewsfeedComment()
  //   .then(selectSyncronizedNewsfeedComment)
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "insert comment",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/projects', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //
  //   function selectProjects() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         // 1.0.9 LEFT JOIN users_table 제거 필요
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
  //         as participant_num,
  //         IF(company_id = ?, 1, 0)
  //         as is_my_project
  //         FROM projects_table
  //         LEFT JOIN users_table
  //         ON projects_table.company_id = users_table.user_id
  //         WHERE is_private = false
  //         ORDER BY projects_table.project_id DESC`;
  //         conn.read.query(sql, user_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectProjects()
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select projects",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/project/:project_id', (req, res, next) => {
  //   var project_id = req.params.project_id;
  //
  //   function updateProjectViewNum() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         UPDATE projects_table SET project_view_num = project_view_num +1
  //         WHERE project_id = ?`;
  //         conn.write.query(sql, project_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve();
  //           }
  //         });
  //       }
  //     )
  //   }
  //
  //   function selectProjectById() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
  //         as participant_num
  //         FROM projects_table LEFT JOIN users_table
  //         ON projects_table.company_id = users_table.user_id
  //         WHERE project_id = ?`;
  //         conn.read.query(sql, project_id, (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   updateProjectViewNum()
  //   .then(selectProjectById)
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select project",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/project/home/:project_id', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   var project_id = req.params.project_id;
  //
  //   function selectProjectById() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM interviews_table
  //         WHERE interview_is_new = 1 and project_participant_id in
  //         (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
  //         as interview_num,
  //         (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
  //         as participant_num
  //         FROM projects_table LEFT JOIN users_table
  //         ON projects_table.company_id = users_table.user_id
  //         WHERE project_id = ?`;
  //         conn.read.query(sql, [project_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //   function selectProjectFeedbacks(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM opinions_table
  //         WHERE feedback_id = project_participants_table.project_participant_id and is_empathy = true)
  //         as empathy_num,
  //         (SELECT COUNT(*) FROM opinions_table
  //         WHERE feedback_id = project_participants_table.project_participant_id and is_empathy = false)
  //         as non_empathy_num
  //         FROM project_participants_table
  //         LEFT JOIN users_table
  //         ON project_participants_table.user_id = users_table.user_id
  //         WHERE project_id = ?
  //         ORDER BY empathy_num ASC, empathy_num - non_empathy_num ASC`;
  //         conn.read.query(sql, [project_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             params[0].feedbacks = results;
  //             resolve([params[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //   function chooseBestFeedback(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var max_best_num = Math.floor(params[0].max_participant_num / 10);
  //         var feedbacks = params[0].feedbacks;
  //         var bestFeedbacks = [];
  //         var feedbacksLen = feedbacks.length;
  //
  //         searchBestFeedback(resolve, params, feedbacksLen-1, max_best_num, feedbacks, bestFeedbacks);
  //       }
  //     )
  //   }
  //   function searchBestFeedback(resolve, params, i, max_best_num, feedbacks, bestFeedbacks) {
  //     if(i >= 0) {
  //       if(feedbacks[i].empathy_num > feedbacks[i].non_empathy_num && max_best_num > 0) {
  //         feedbacks[i].is_best = true;
  //         bestFeedbacks.push(feedbacks.splice(i, 1)[0]);
  //         searchBestFeedback(resolve, params, --i, --max_best_num, feedbacks, bestFeedbacks);
  //       }
  //       else {
  //         feedbacks[i].is_best = false;
  //         searchBestFeedback(resolve, params, --i, max_best_num, feedbacks, bestFeedbacks);
  //       }
  //     }
  //     else {
  //       params[0].feedbacks = bestFeedbacks.concat(feedbacks.reverse());
  //       resolve([params[0]]);
  //     }
  //   }
  //
  //   selectProjectById()
  //   .then(selectProjectFeedbacks)
  //   .then(chooseBestFeedback)
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select project",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/project/side-menu/:project_id', (req, res, next) => {
  //   var project_id = req.params.project_id;
  //   function selectProjectById() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM interviews_table
  //         WHERE project_participant_id in
  //         (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
  //         as total_interview_num,
  //         (max_participant_num * 2)
  //         as max_interview_num,
  //         (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
  //         as participant_num
  //         FROM projects_table
  //         LEFT JOIN users_table
  //         ON projects_table.company_id = users_table.user_id
  //         WHERE project_id = ?`;
  //         conn.read.query(sql, [project_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectProjectById()
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select project",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/project/participants/:project_id', (req, res, next) => {
  //   var project_id = req.params.project_id;
  //   function selectProjectParticipants() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM opinions_table WHERE project_participant_id = project_participants_table.project_participant_id)
  //         as opinion_num,
  //         (SELECT COUNT(*) FROM interviews_table WHERE project_participant_id = project_participants_table.project_participant_id)
  //         as interview_num
  //         FROM project_participants_table
  //         LEFT JOIN users_table
  //         ON project_participants_table.user_id = users_table.user_id
  //         LEFT JOIN levels_table
  //         ON users_table.level = levels_table.level
  //         LEFT JOIN project_participation_history_table
  //         ON project_participants_table.user_id = project_participation_history_table.user_id
  //         and project_participants_table.project_id = project_participation_history_table.project_id
  //         WHERE project_participants_table.project_id = ?`;
  //         conn.read.query(sql, [project_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectProjectParticipants()
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select project participants",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/project/participant/:project_participant_id', (req, res, next) => {
  //   var project_participant_id = req.params.project_participant_id;
  //   function selectProjectParticipant() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT * FROM project_participants_table
  //         LEFT JOIN users_table
  //         ON project_participants_table.user_id = users_table.user_id
  //         LEFT JOIN levels_table
  //         ON users_table.level = levels_table.level
  //         LEFT JOIN project_participation_history_table
  //         ON project_participants_table.user_id = project_participation_history_table.user_id
  //         and project_participants_table.project_id = project_participation_history_table.project_id
  //         WHERE project_participant_id = ?`;
  //         conn.read.query(sql, [project_participant_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectProjectParticipant()
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select project participant",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/project/reports/:project_id', (req, res, next) => {
  //   var project_id = req.params.project_id;
  //   function selectReports() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *
  //         FROM project_participants_table
  //         LEFT JOIN users_table
  //         ON project_participants_table.user_id = users_table.user_id
  //         LEFT JOIN levels_table
  //         ON users_table.level = levels_table.level
  //         WHERE project_participants_table.project_id = ? and project_report_registration_date is not null`;
  //         conn.read.query(sql, [project_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectReports()
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select user reports",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.put('/project/report/select/:project_participant_id', (req, res, next) => {
  //   var project_participant_id = req.params.project_participant_id;
  //   // 최대 인원의 10% 선정
  //   function selectPreCondition() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT (max_participant_num / 10) as max_selected_report_num,
  //         (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id and project_report_is_select = true)
  //         as selected_report_num
  //         FROM projects_table
  //         LEFT JOIN project_participants_table
  //         ON projects_table.project_id = project_participants_table.project_id
  //         WHERE project_participant_id = ?
  //         `;
  //         conn.read.query(sql, [project_participant_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             if(results[0].max_selected_report_num <= results[0].selected_report_num) {
  //               res.json(
  //                 {
  //                   "success" : true,
  //                   "message" : "selected report num is over"
  //                 });
  //             }
  //             else {
  //               resolve();
  //             }
  //           }
  //         });
  //       }
  //     )
  //   }
  //
  //   function updateSelectedReport() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         UPDATE project_participants_table SET project_report_is_select = 1 WHERE project_participant_id = ?`;
  //         conn.read.query(sql, [project_participant_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectPreCondition()
  //   .then(updateSelectedReport)
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select report",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/project/report/:project_id', (req, res, next) => {
  //   var user_id = req.decoded.user_id;
  //   var project_id = req.params.project_id;
  //
  //   function selectProjectById() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM interviews_table
  //         WHERE interview_is_new = 1 and project_participant_id in
  //         (SELECT project_participant_id FROM project_participants_table WHERE project_id = projects_table.project_id))
  //         as interview_num,
  //         (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
  //         as participant_num
  //         FROM projects_table LEFT JOIN users_table
  //         ON projects_table.company_id = users_table.user_id
  //         WHERE project_id = ?`;
  //         conn.read.query(sql, [project_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //   function selectProjectFeedbacks(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM opinions_table
  //         WHERE feedback_id = project_participants_table.project_participant_id and is_empathy = true)
  //         as empathy_num,
  //         (SELECT COUNT(*) FROM opinions_table
  //         WHERE feedback_id = project_participants_table.project_participant_id and is_empathy = false)
  //         as non_empathy_num
  //         FROM project_participants_table
  //         LEFT JOIN users_table
  //         ON project_participants_table.user_id = users_table.user_id
  //         WHERE project_id = ?
  //         ORDER BY empathy_num ASC, empathy_num - non_empathy_num ASC`;
  //         conn.read.query(sql, [project_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             params[0].feedbacks = results;
  //             resolve([params[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //   function chooseBestFeedback(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var max_best_num = Math.floor(params[0].max_participant_num / 10);
  //         var feedbacks = params[0].feedbacks;
  //         var bestFeedbacks = [];
  //         var feedbacksLen = feedbacks.length;
  //
  //         searchBestFeedback(resolve, params, feedbacksLen-1, max_best_num, feedbacks, bestFeedbacks);
  //       }
  //     )
  //   }
  //   function searchBestFeedback(resolve, params, i, max_best_num, feedbacks, bestFeedbacks) {
  //     if(i >= 0) {
  //       if(feedbacks[i].empathy_num > feedbacks[i].non_empathy_num && max_best_num > 0) {
  //         feedbacks[i].is_best = true;
  //         bestFeedbacks.push(feedbacks.splice(i, 1)[0]);
  //         searchBestFeedback(resolve, params, --i, --max_best_num, feedbacks, bestFeedbacks);
  //       }
  //       else {
  //         feedbacks[i].is_best = false;
  //         searchBestFeedback(resolve, params, --i, max_best_num, feedbacks, bestFeedbacks);
  //       }
  //     }
  //     else {
  //       params[0].feedbacks = bestFeedbacks.concat(feedbacks.reverse());
  //       resolve([params[0]]);
  //     }
  //   }
  //   function selectProjectParticipants(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM opinions_table WHERE project_participant_id = project_participants_table.project_participant_id)
  //         as opinion_num,
  //         (SELECT COUNT(*) FROM interviews_table WHERE project_participant_id = project_participants_table.project_participant_id)
  //         as interview_num
  //         FROM project_participants_table
  //         LEFT JOIN users_table
  //         ON project_participants_table.user_id = users_table.user_id
  //         LEFT JOIN levels_table
  //         ON users_table.level = levels_table.level
  //         LEFT JOIN project_participation_history_table
  //         ON project_participants_table.user_id = project_participation_history_table.user_id
  //         and project_participants_table.project_id = project_participation_history_table.project_id
  //         WHERE project_participants_table.project_id = ?`;
  //         conn.read.query(sql, [project_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             params[0].participants = results;
  //             resolve([params[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //   function selectReports(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *
  //         FROM project_participants_table
  //         LEFT JOIN users_table
  //         ON project_participants_table.user_id = users_table.user_id
  //         LEFT JOIN levels_table
  //         ON users_table.level = levels_table.level
  //         WHERE project_participants_table.project_id = ? and project_report_registration_date is not null`;
  //         conn.read.query(sql, [project_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             params[0].reports = results;
  //             resolve([params[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectProjectById()
  //   .then(selectProjectFeedbacks)
  //   .then(chooseBestFeedback)
  //   .then(selectProjectParticipants)
  //   .then(selectReports)
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select project",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.get('/project/:project_id/feedback/:feedback_id', (req, res, next) => {
  //   var project_id = req.params.project_id;
  //   var feedback_id = req.params.feedback_id;
  //
  //   function selectProjectById() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM project_participants_table WHERE project_id = projects_table.project_id)
  //         as participant_num
  //         FROM projects_table LEFT JOIN users_table
  //         ON projects_table.company_id = users_table.user_id
  //         WHERE project_id = ?`;
  //         conn.read.query(sql, [project_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //   function selectProjectFeedbacks(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT *,
  //         (SELECT COUNT(*) FROM opinions_table
  //         WHERE feedback_id = project_participants_table.project_participant_id and is_empathy = true)
  //         as empathy_num,
  //         (SELECT COUNT(*) FROM opinions_table
  //         WHERE feedback_id = project_participants_table.project_participant_id and is_empathy = false)
  //         as non_empathy_num
  //         FROM project_participants_table
  //         LEFT JOIN users_table
  //         ON project_participants_table.user_id = users_table.user_id
  //         WHERE project_id = ?
  //         ORDER BY empathy_num ASC, empathy_num - non_empathy_num ASC`;
  //         conn.read.query(sql, [project_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             params[0].feedbacks = results;
  //             resolve([params[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //   function chooseBestFeedback(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var max_best_num = Math.floor(params[0].max_participant_num / 10);
  //         var feedbacks = params[0].feedbacks;
  //         var bestFeedbacks = [];
  //         var feedbacksLen = feedbacks.length;
  //
  //         searchBestFeedback(resolve, params, feedbacksLen-1, max_best_num, feedbacks, bestFeedbacks);
  //       }
  //     )
  //   }
  //   function searchBestFeedback(resolve, params, i, max_best_num, feedbacks, bestFeedbacks) {
  //     if(i >= 0) {
  //       if(feedbacks[i].empathy_num > feedbacks[i].non_empathy_num && max_best_num > 0) {
  //         feedbacks[i].is_best = true;
  //         bestFeedbacks.push(feedbacks.splice(i, 1)[0]);
  //         searchBestFeedback(resolve, params, --i, --max_best_num, feedbacks, bestFeedbacks);
  //       }
  //       else {
  //         feedbacks[i].is_best = false;
  //         searchBestFeedback(resolve, params, --i, max_best_num, feedbacks, bestFeedbacks);
  //       }
  //     }
  //     else {
  //       params[0].feedbacks = bestFeedbacks.concat(feedbacks.reverse());
  //       resolve([params[0]]);
  //     }
  //   }
  //   function selectFeedbackById(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var feedbacks = params[0].feedbacks;
  //         feedbacks.filter((obj) => {
  //           return obj.project_participant_id == feedback_id;
  //         })
  //         .map((obj) => {
  //           delete params[0].feedbacks;
  //           params[0].feedback = obj;
  //           resolve([params[0]]);
  //         });
  //       }
  //     );
  //   }
  //   function selectOpinionsByFeedbackId(params) {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         SELECT * FROM opinions_table
  //         LEFT JOIN project_participants_table
  //         ON opinions_table.project_participant_id = project_participants_table.project_participant_id
  //         LEFT JOIN users_table ON project_participants_table.user_id = users_table.user_id
  //         WHERE feedback_id = ?
  //         ORDER BY opinion_registration_date DESC`;
  //         conn.read.query(sql, [feedback_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             params[0].opinions = results;
  //             resolve([params[0]]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   selectProjectById()
  //   .then(selectProjectFeedbacks)
  //   .then(chooseBestFeedback)
  //   .then(selectFeedbackById)
  //   .then(selectOpinionsByFeedbackId)
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : "select feedback",
  //         "data" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.post('/device-token', (req, res, next) => {
  //   var uuid = req.body.uuid;
  //   var device_token = req.body.device_token;
  //   var user_id = req.decoded.user_id;
  //
  //   function insertDeviceToken() {
  //     return new Promise(
  //       (resolve, reject) => {
  //         var sql = `
  //         INSERT INTO users_token_table (uuid, device_token, user_id) VALUES (?, ?, ?)
  //         ON DUPLICATE KEY UPDATE uuid = ?, device_token = ?, user_id = ?
  //         `;
  //         conn.write.query(sql, [uuid, device_token, user_id, uuid, device_token, user_id], (err, results) => {
  //           if(err) reject(err);
  //           else {
  //             resolve([results]);
  //           }
  //         });
  //       }
  //     );
  //   }
  //
  //   insertDeviceToken()
  //   .then((params) => {
  //     res.json(
  //       {
  //         "success" : true,
  //         "message" : params[0]
  //       });
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     return next(err);
  //   });
  //
  // });
  //
  // route.post('/send-test', (req, res, next) => {
  //   console.log(req.body);
  //   sendFCM(req.body.device_token, res);
  // });

  function sendFCM(device_token, title, content) {
    // This registration token comes from the client FCM SDKs.
    var registrationToken = device_token;

    // See the "Defining the message payload" section below for details
    // on how to define a message payload.
    var payload = {
      notification: {
        title: title,
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
        DELETE FROM user_tokens_table WHERE device_token = ?
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
