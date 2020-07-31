var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// npm install cors를 설치한 라이브러리 소스코드에 적용
var cors = require('cors')();

// npm install redis --save
// npm install express-session --save
// npm install connect-redis --save --no-bin-links
// npm install connect-mongo --save --no-bin-links
var redis = require("redis")
var session = require('express-session')  //파일로
var redisStore = require('connect-redis')(session)


//var chatRouter = require('./routes/chat');  
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var memberRouter = require('./routes/member');
var dapp01Router = require('./routes/dapp01');
var dapp02Router = require('./routes/dapp02');  //실시간 구현용
//var mongo01Router = require('./routes/mongo01');
var contract01Router = require('./routes/dapp_contract01');
var sessionRouter = require('./routes/member_session');
var accountRouter = require('./routes/account01');


var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors); //cors라이브러리 사용설정

/*
//redis session 환경설정
var client = redis.createClient(36379, '192.168.99.100',{db:1});
app.use(session({
  secret : 'fefe343jfeef_fefejek343',
  store : new redisStore({
    client :client
  }),
  saveUninitialized:false,
  resave :false
}))
*/

// mongodb에 세션 저장설정
const MongoStore = require('connect-mongo')(session);
app.use(session({
  secret : 'fefe343jfeef_fefejek343',
  resave : false,
  saveUninitialized:false,
  store : new MongoStore({
    url : 'mongodb://192.168.99.100:37017/db01',
    collection : 'session'
  })
}))


//////////////////////////////
//index.js
//192.168.99.100:32302/
app.use('/', indexRouter);        

//users.js
//192.168.99.100:32302/users/
app.use('/users', usersRouter);   

//member.js
//192.168.99.100:32302/member/
app.use('/member', memberRouter); 

//dapp.js
//192.168.99.100:32302/dapp/
app.use('/dapp', dapp01Router);

//mongo01.js
//192.168.99.100:32302/mongo/
//app.use('/mongo', mongo01Router);

app.use('/contract', contract01Router)
app.use('/session', sessionRouter)

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
