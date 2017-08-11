module.exports = function(conn) {
  var route = require('express').Router();
  var formidable = require('formidable');
  var AWS = require('aws-sdk');
  AWS.config.region = 'ap-northeast-2';

  route.post('/upload/:folder', function(req, res, next) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
        var s3 = new AWS.S3();
        var params = {
             Bucket:'elasticbeanstalk-ap-northeast-2-035223481599',
             Key:req.params.folder+'/'+(+new Date())+files.ex_filename.name,
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
              res.send(result);
            }
          });
        }
        else {
          res.send('');
        }

    });
  });

  route.post('/move', function(req, res, next) {
    var sliceUrl = req.body.img.split('/tmp/');
    sliceUrl = decodeURIComponent(sliceUrl[1]);
    var s3 = new AWS.S3();
    var params = {
         Bucket:'elasticbeanstalk-ap-northeast-2-035223481599',
         CopySource:req.body.img,
         Key:'images/'+sliceUrl,
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
             Key:'tmp/'+sliceUrl,
        }
        s3.deleteObject(params, function(err, data){
          if(err) {
            console.log(err);
            return next(err);
          }
          else {
            res.send(req.body.img);
          }
        });
      }
    });
  });

  route.get('/test', function(req, res, next) {
    res.send('hello test');
  });


  return route;
}
