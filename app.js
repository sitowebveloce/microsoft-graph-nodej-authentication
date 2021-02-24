// https://docs.microsoft.com/en-us/graph/tutorials/node

const dotenv = require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const msal = require('@azure/msal-node');
const mongoose = require('mongoose');
const fs = require('fs');


// APP
const app = express();

// DB CONNECTION
const connectDB = require('./config/db');
connectDB();

// In-memory storage of logged-in users
// For demo purposes only, production apps should store
// this in a reliable storage
app.locals.users = {};

// MSAL config
const msalConfig = {
  auth: {
    clientId: process.env.OAUTH_APP_ID,
    authority: process.env.OAUTH_AUTHORITY,
    clientSecret: process.env.OAUTH_APP_SECRET
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose,
    }
  }
}; 

// Create msal application object
app.locals.msalClient = new msal.ConfidentialClientApplication(msalConfig);


// SESSION MIDDLEWARE
// NOTE: Uses default in-memory session store, which is not
// suitable for production
app.use(session({
  secret:'YourSecretString',
  resave:false, //don't save session if unmodified
  saveUninitialized:false,  // don't create session until something stored
  // unset:'destroy',
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    ttl: 14 * 24 * 60 * 60 // = 14 days. Default
}),
}));


// FLASH MIDDLEWARE
app.use(flash());

// Set up local vars for template layout
app.use(function(req, res, next) {
  // Read any flashed errors and save
  // in the response locals
  res.locals.error = req.flash('error_msg');

  // Check for simple error string and
  // convert to layout's expected format
  var errs = req.flash('error');
  for (var i in errs){
    res.locals.error.push({message: 'An error occurred', debug: errs[i]});
  }

  // Check for an authenticated user and load
  // into response locals
  if (req.session.userId) {
    res.locals.user = app.locals.users[req.session.userId];
  }

  next();
});

// VIEW ENGINE SETUP
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
var hbs = require('hbs');
var moment = require('moment');
// Helper to format date/time sent by Graph
hbs.registerHelper('eventDateTime', function(dateTime){
  return moment(dateTime).format('M/D/YY h:mm A');
});

// MORGAN MIDDLEWARE
app.use(logger('dev'));
// BODY PARSER
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// PUBLIC STATIC FOLDER
app.use(express.static(path.join(__dirname, 'public')));

// ROUTES
const authRouter = require('./routes/auth');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const calendarRouter = require('./routes/calendar');

app.use('/calendar', calendarRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/', indexRouter);


// CATCH 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// ERROR HANDLER
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
