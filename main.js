var app = require('./config/express')();
var conn = require('./config/db')(app);
var path = require('path');
var cors = require('cors')();

var authMiddleware = require('./middlewares/auth');
var versionMiddleware = require('./middlewares/version')(conn);

var admin = require("firebase-admin");
var serviceAccount = require("./feed100-158308-firebase-adminsdk-y80ka-3bfaf63af8.json");

admin.initializeApp({
 credential: admin.credential.cert(serviceAccount),
 databaseURL: "https://feed100-158308.firebaseio.com"
});

var commonApi = require('./routes/common/api')(conn);
var userApi = require('./routes/user/api')(conn, admin);
var companyApi = require('./routes/company/api')(conn, admin);
var adminApi = require('./routes/admin/api')(conn, admin);
var cron = require('./routes/common/cron')(app, conn, admin);

app.use(cors);

app.use('/common/api', versionMiddleware);
app.use('/common/api', commonApi);
// app.use('/user/api/', versionMiddleware);
// app.use('/user/api/', authMiddleware);
app.use('/user/api/', userApi);
// app.use('/company/api/', versionMiddleware);
// app.use('/company/api/', authMiddleware);
app.use('/company/api/', companyApi);
app.use('/admin/api/', authMiddleware);
app.use('/admin/api/', adminApi);
// app.use('/common/cron/', cron);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
