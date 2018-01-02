module.exports = function(conn) {

  var versionMiddleware = (req, res, next) => {
      // read the token from header or url
      var version = req.headers['version'];
      var platform = req.headers['platform'];
      // token does not exist
      if(!version) {
        return res.json({
          "success" : false,
          "message" : "version is null"
        });
      }

      // create a promise that verify the token
      function verifyVersion() {
        return new Promise(
          (resolve, reject) => {
            var sql = `SELECT * FROM config_table`;
            conn.read.query(sql, (err, results) => {
              if(err) reject(err);
              else {
                resolve([results[0]]);
              }
            });
          }
        );
      }
      // if it has failed to verify, it will return an error message
      function onError(error) {
        res.json({
          "success" : false,
          "message" : error.message
        });
      }

      function isUpdateNeeded(server_version, client_version) {
        var server_version_token = server_version.split('.');
        var client_version_token = client_version.split('.');
        if(server_version_token[0] > client_version_token[0]) {
          return true;
        }
        else if(server_version_token[0] == client_version_token[0]) {
          if(server_version_token[1] > client_version_token[1]) {
            return true;
          }
          else if(server_version_token[1] == client_version_token[1]) {
            if(server_version_token[2] > client_version_token[2]) {
              return true;
            }
            else {
              return false;
            }
          }
          else {
            return false;
          }
        }
        else {
          return false;
        }
      }

      // process the promise
      verifyVersion()
      .then((params) => {
        console.log("version check : " + platform + " " + params[0].ios_version + " " + params[0].android_version + " " + version);
        if(params[0].notice) {
          return res.json({
            "success" : false,
            "message" : "notice exist",
            "notice" : params[0].notice
          });
        }
        else if(platform == 'ios' && isUpdateNeeded(params[0].ios_version, version)) {
          return res.json({
            "success" : false,
            "message" : "version is not match",
            "client_version" : version,
            "server_version" : params[0].ios_version
          });
        }
        else if(platform == 'android' && isUpdateNeeded(params[0].android_version, version)) {
          return res.json({
            "success" : false,
            "message" : "version is not match",
            "client_version" : version,
            "server_version" : params[0].android_version
          });
        }
        else {
          next();
        }
      })
      .catch(onError)
  }

  return versionMiddleware;
}
