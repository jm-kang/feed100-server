module.exports = function(conn) {
  var route = require('express').Router();

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
    var projectData = {
      company_id : req.body.company_id,
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


  return route;
}
