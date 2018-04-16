module.exports = function(conn) {

  var versionMiddleware = (req, res, next) => {
      var version = req.headers['version'];
      var platform = req.headers['platform'];
      var config = {
        'notice' : '',
        'ios_version' : '1.1.1',
        'android_version' : '1.1.1'
      }

      // if(!version) {
      //   next();
      // }

      function verifyVersion() {
        return new Promise(
          (resolve, reject) => {
            // admin은 검사 x
            if(!version || !platform || req.body.role == 'admin'
            || req.originalUrl == '/user/api/user' || req.originalUrl == '/common/api/refresh') {
              resolve();
            }
            else {
              console.log("version check : " + platform + " " + config.ios_version + " " + config.android_version + " " + version);
              if(config.notice) {
                return res.json({
                  "success" : false,
                  "message" : "notice exist",
                  "notice" : config.notice
                });
              }
              else if(platform == 'ios' && isUpdateNeeded(config.ios_version, version)) {
                return res.json({
                  "success" : false,
                  "message" : "version is not match",
                  "client_version" : version,
                  "server_version" : config.ios_version
                });
              }
              else if(platform == 'android' && isUpdateNeeded(config.android_version, version)) {
                return res.json({
                  "success" : false,
                  "message" : "version is not match",
                  "client_version" : version,
                  "server_version" : config.android_version
                });
              }
              else {
                resolve();
              }
            }
          }
        );
      }

      function onError(error) {
        res.json({
          "success" : false,
          "message" : error.message
        });
      }

      function isUpdateNeeded(server_version, client_version) {
        var server_version_token = server_version.split('.');
        var client_version_token = client_version.split('.');

        if((server_version_token[0] * 1) > (client_version_token[0] * 1)) {
          return true;
        }
        else if((server_version_token[0] * 1) == (client_version_token[0] * 1)) {
          if((server_version_token[1] * 1) > (client_version_token[1] * 1)) {
            return true;
          }
          else if((server_version_token[1] * 1) == (client_version_token[1] * 1)) {
            if((server_version_token[2] * 1) > (client_version_token[2] * 1)) {
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
      .then(() => {
        next();
      })
      .catch(onError)
  }

  return versionMiddleware;
}
