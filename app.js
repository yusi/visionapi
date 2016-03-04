var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var config = require('config');
var multer  = require('multer');
var request  = require('request');
var async = require('async');
var fs = require('fs');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// file upload module
var upload = multer({ dest: './uploads/'});
var type = upload.single('img');

// Base64にエンコードするメソッド
var encode = function(filename, callback) {
  var file = fs.readFile(filename, function(err, data) {
    callback(err, new Buffer(data).toString('base64'));
  });
}

var apikey = config.api.key;

app.post('/up', type, function(req, res){
    console.log('path='+req.file.path); //form files
    var image;
    async.series([
      function (callback) {
        encode(req.file.path, function(err, string){
          //console.log('string='+string); //form files
          //image = 'data:image/jpg;base64,' + string;
          image = string;
          callback(null, "first");
        })
      }
      , function (callback) {
        reuestOption = {
          uri: 'https://vision.googleapis.com/v1/images:annotate?key=' + apikey,
          headers: {'Content-Type': 'application/json'},
          json:{
            "requests":[
              {
                "image":{"content": image},
                "features":[
                {"type": "FACE_DETECTION", "maxResults": 5},
                {"type": "LABEL_DETECTION", "maxResults": 5},
                {"type": "TEXT_DETECTION", "maxResults": 5},
                {"type": "LANDMARK_DETECTION", "maxResults": 5},
                {"type": "LOGO_DETECTION", "maxResults": 5},
                {"type": "SAFE_SEARCH_DETECTION", "maxResults": 5}
                ]
              }
            ]
          }
        };
        request.post(reuestOption, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            vision_json = JSON.stringify(body.responses);
            console.log(vision_json);

            res.render('index', 
              { title: 'Express', 
                vision_response: vision_json,
                upfile: "/"+req.file.path
              });
          }else{
            console.log('respons:' + + response.statusCode);
            res.status(200).json({ status: 'err' })
          }
        });
      }
    ], function (err, results) {
      if (err) {
        throw err;
      }
    });
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
