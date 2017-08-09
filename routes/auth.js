module.exports = function(conn) {
  var pbkfd2Password = require("pbkdf2-password");
  var hasher = pbkfd2Password();
  var route = require('express').Router();

  route.post('/login', function(req, res, next) {
    
  });

  return route;
}
