var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const hbs = require('express-handlebars');
var db = require('./config/connection')
var session = require('express-session')
var fileUpload = require('express-fileupload')
const nocache = require("nocache");
var flash = require('req-flash');
require('dotenv').config()



var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
//set partials dir and layout dir
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials/'}))


app.use(session({
  secret: 'secretkey',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 6000000 }
}))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload())
app.use(nocache())
app.use(flash());

// Database Connection
db.connect((err )=>{
  if(err)
  console.log("Connection Error"+err);
  else
  console.log(`Database Connected Successfuly `);
})

app.use('/', userRouter);
app.use('/admin', adminRouter);

//redirecting all Error Requests to a Custom Error page 
// app.get('*',(req,res)=>{
//   res.render('404',{error:true})
// })

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
