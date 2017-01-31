const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const logger = require('morgan');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const socketEvents = require('./controllers/socketEvents');
const config = require('./config/config');
const routes = require('./controllers/routes');
const db = require('./controllers/database');
const passport = require('passport');
require('./controllers/passport')(passport);



const server = app.listen(config.port);
const sio = require('socket.io').listen(server);

const SupaSession= session({
    secret: config.secret,
    saveUninitialized: true,
	resave: true
});
const sharedsession = require("express-socket.io-session");


app.use(SupaSession);
sio.use(sharedsession(SupaSession));
app.use(cookieParser());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
//app.use(logger('dev'));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(passport.initialize());
app.use(passport.session());


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:'+config.clientport);
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

socketEvents(sio);

db.init();
routes(app);
