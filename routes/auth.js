module.exports = function(conn) {
  var pbkfd2Password = require("pbkdf2-password");
  var hasher = pbkfd2Password();
  var route = require('express').Router();
  var jwt = require('jsonwebtoken');

  route.post('/refresh', (req, res, next) => {
    var secret = req.app.get('jwt-secret');
    var accessToken = req.headers['x-access-token'] || req.query.accessToken;
    var refreshToken = req.headers['x-refresh-token'] || req.query.refreshToken;

    if(!accessToken || !refreshToken) {
      return res.status(403).json({
          "success" : false,
          "message" : 'not logged in'
      })
    }

    function verifyRefreshToken() {
      return new Promise(
        (resolve, reject) => {
          jwt.verify(refreshToken, secret, { subject : 'refreshToken' }, (err, decoded) => {
            if(err) reject(err);
            resolve([secret, decoded.user_id, decoded.role]);
          })
        }
      );
    }
    // if it has failed to verify, it will return an error message
    function onError(error) {
      res.status(403).json({
        "success" : false,
        "message" : error.message
      });
    }

    verifyRefreshToken()
    .then(signAccessToken)
    .then(signRefreshToken)
    .then((params) => {
      res.json({
        "success" : true,
        "message" : "refresh success",
        "data" : {
          "accessToken" : params[0],
          "refreshToken" : params[1]
        }
      });
    })
    .catch(onError);
  })

  route.post('/login', (req, res, next) => {
    var secret = req.app.get('jwt-secret');

    function selectByUsername() {
      return new Promise(
        (resolve, reject) => {
          var sql = 'SELECT * FROM users_table WHERE auth_id = ? and role = ?';
          conn.read.query(sql, ['local:' + req.body.username, req.body.role], (err, results) => {
            if(err) reject(err);
            else {
              if(!results[0]) {
                res.json({
                  "success" : false,
                  "message" : "username is unregistered"
                });
              }
              else {
                resolve([results[0], req.body.password]);
              }
            }
          });
        }
      );
    }
    function verifyPassword(params) {
      var result = params[0];
      var password = params[1];
      return new Promise(
        (resolve, reject) => {
          hasher({password:password, salt:result.salt}, (err, pass, salt, hash) => {
            if(hash !== result.password){
              res.json({
                "success" : false,
                "message" : "password is not correct"
              });
            } else {
              resolve([secret, result.user_id, req.body.role]);
            }
          });
        }
      );
    }

    selectByUsername()
    .then(verifyPassword)
    .then(signAccessToken)
    .then(signRefreshToken)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "login success",
          "data" : {
            "accessToken" : params[0],
            "refreshToken" : params[1]
          }
        });
    })
    .catch(function(err) {
      console.log(err);
      return next(err);
    });

  });

  route.post('/login-sns', (req, res, next) => {
    var secret = req.app.get('jwt-secret');

    function selectByProviderAndAppId() {
      return new Promise(
        (resolve, reject) => {
          var sql = 'SELECT * FROM users_table WHERE auth_id = ? and role = ?';
          conn.read.query(sql, [req.body.provider + ':' + req.body.app_id, req.body.role], (err, results) => {
            if(err) reject(err);
            else {
              if(!results[0]) {
                res.json({
                  "success" : false,
                  "message" : "app_id is unregistered"
                });
              }
              else {
                resolve([secret, results[0].user_id, req.body.role]);
              }
            }
          });
        }
      );
    }

    selectByProviderAndAppId()
    .then(signAccessToken)
    .then(signRefreshToken)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "login success",
          "data" : {
            "accessToken" : params[0],
            "refreshToken" : params[1]
          }
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.post('/registration', (req, res, next) => {
    var secret = req.app.get('jwt-secret');

    function selectByUsername() {
      return new Promise(
        (resolve, reject) => {
          var sql = 'SELECT username FROM users_table WHERE username = ?';
          conn.read.query(sql, req.body.username, (err, results) => {
            if(err) reject(err);
            else {
              if(results[0]) {
                res.json({
                  "success" : false,
                  "message" : "username is already registered"
                });
              }
              else {
                resolve();
              }
            }
          });
        }
      );
    }
    function selectByNickname() {
      return new Promise(
        (resolve, reject) => {
          // user일 경우만 닉네임 중복 검사
          if(req.body.role == 'user') {
            var sql = 'SELECT nickname FROM users_table WHERE nickname = ?';
            conn.read.query(sql, req.body.nickname, (err, results) => {
              if(err) reject(err);
              else {
                if(results[0]) {
                  res.json({
                    "success" : false,
                    "message" : "nickname is already registered"
                  });
                }
                else {
                  resolve();
                }
              }
            });
          }
          else {
            resolve();
          }
        }
      );
    }
    function insertUser() {
      return new Promise(
        (resolve, reject) => {
          hasher({password:req.body.password}, (err, pass, salt, hash) => {
            var user = {
              role: req.body.role,
              auth_id: 'local:' + req.body.username,
              username: req.body.username,
              password: hash,
              salt: salt,
              nickname: req.body.nickname
            };
            var sql = 'INSERT INTO users_table SET ?'
            conn.write.query(sql, user, (err, results) => {
              if(err) reject(err);
              else {
                resolve([secret, results.insertId, req.body.role]);
              }
            })
          });
        }
      );
    }

    selectByUsername()
    .then(selectByNickname)
    .then(insertUser)
    .then(signAccessToken)
    .then(signRefreshToken)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "registration success",
          "data" : {
            "accessToken" : params[0],
            "refreshToken" : params[1]
          }
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  route.post('/registration-sns', (req, res, next) => {
    var secret = req.app.get('jwt-secret');

    function selectByUsername() {
      return new Promise(
        (resolve, reject) => {
          var sql = 'SELECT username FROM users_table WHERE username = ?';
          conn.read.query(sql, req.body.username, (err, results) => {
            if(err) reject(err);
            else {
              if(results[0]) {
                res.json({
                  "success" : false,
                  "message" : "username is already registered"
                });
              }
              else {
                resolve();
              }
            }
          });
        }
      );
    }
    function selectByNickname() {
      return new Promise(
        (resolve, reject) => {
          // user일 경우만 닉네임 중복 검사
          if(req.body.role == 'user') {
            var sql = 'SELECT nickname FROM users_table WHERE nickname = ?';
            conn.read.query(sql, req.body.nickname, (err, results) => {
              if(err) reject(err);
              else {
                if(results[0]) {
                  res.json({
                    "success" : false,
                    "message" : "nickname is already registered"
                  });
                }
                else {
                  resolve();
                }
              }
            });
          }
          else {
            resolve();
          }
        }
      );
    }
    function insertUser() {
      return new Promise(
        (resolve, reject) => {
          var user = {
            role: req.body.role,
            auth_id: req.body.provider + ':' + req.body.app_id,
            username: req.body.username,
            nickname: req.body.nickname
          };
          var sql = 'INSERT INTO users_table SET ?'
          conn.write.query(sql, user, (err, results) => {
            if(err) reject(err);
            else {
              resolve([secret, results.insertId, req.body.role]);
            }
          })
        }
      );
    }

    selectByUsername()
    .then(selectByNickname)
    .then(insertUser)
    .then(signAccessToken)
    .then(signRefreshToken)
    .then((params) => {
      res.json(
        {
          "success" : true,
          "message" : "registration success",
          "data" : {
            "accessToken" : params[0],
            "refreshToken" : params[1]
          }
        });
    })
    .catch((err) => {
      console.log(err);
      return next(err);
    });

  });

  function signAccessToken(params) {
    return new Promise(
      (resolve, reject) => {
        var secret = params[0];
        var user_id = params[1];
        var role = params[2];
        jwt.sign(
        {
          role : role,
          user_id : user_id
        },
        secret,
        {
          expiresIn : '60s',
          issuer : 'feed100',
          subject : 'accessToken'
        }, (err, token) => {
          if(err) reject(err);
          else {
            resolve([secret, user_id, role, token]);
          }
        });
      }
    );
  }
  function signRefreshToken(params) {
    return new Promise(
      (resolve, reject) => {
        var secret = params[0];
        var user_id = params[1];
        var role = params[2];
        var accessToken = params[3];
        jwt.sign(
        {
          role : role,
          user_id : user_id
        },
        secret,
        {
          expiresIn : '10m',
          issuer : 'feed100',
          subject : 'refreshToken'
        }, (err, token) => {
          if(err) reject(err);
          else {
            resolve([accessToken, token]);
          }
        });
      }
    );
  }

  return route;
}
