const LocalStrategy   = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const config = require('../config/config');
const configAuth = require('../config/auth');


const connection = mysql.createConnection({
				  host     : config.host,
				  user     : config.user,
				  password : config.password,
                  database : config.database
				});

module.exports = (passport) => {
	passport.serializeUser((user, done) => {
		done(null, user);
    });

    passport.deserializeUser((user, done) => {
		connection.query("select * from users where id = ?",
			user.id,
			(err,rows) => {
				done(err, user);
			}
		);
    });

	passport.use(new FacebookStrategy({

        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL

    },

    function(token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {
		console.log(profile.displayName);
        connection.query('SELECT * FROM users WHERE username = ?', profile.displayName, (err,rows) => {
                if (err)
                    return done(err);

				if (rows.length) {
					   return done(null, rows[0]);
                } else {
                    // if there is no user found with that facebook id, create them
					var newUserMysql = {};
					newUserMysql.username = profile.displayName;
					newUserMysql.password = token;
					connection.query('INSERT INTO users (username, password) values (?,?)',
						[newUserMysql.username, token], (err,rows) => {
							console.log(newUserMysql);
							console.log(err);
							console.log(rows.insertId);
							newUserMysql.id = rows.insertId;
							return done(null, newUserMysql);
					});


                }

            });
        });

    }));




	passport.use(new GoogleStrategy({
			clientID: configAuth.googleAuth.clientID,
			clientSecret: configAuth.googleAuth.clientSecret,
			callbackURL: configAuth.googleAuth.callbackURL,
			passReqToCallback: true
		},
		(request, accessToken, refreshToken, profile, done) => {
			process.nextTick(function () {
				var username = profile.displayName;
				if(username.length < 2){
					username = profile.email;
				}
				connection.query('SELECT * FROM users WHERE username = ?', username, (err,rows) => {
					if (err)
			            return done(err);
					 if (rows.length) {
			            return done(null, rows[0]);
			        } else {
			            var newUserMysql = {};
						newUserMysql.username = username;
			            newUserMysql.password = accessToken;
						connection.query('INSERT INTO users (username, password) values (?,?)',
							[username, accessToken], (err,rows) => {
								console.log(newUserMysql);
								console.log(err);
								console.log(rows.insertId);
								newUserMysql.id = rows.insertId;
								return done(null, newUserMysql);
						});
			        }
				});
			});
		}
	));

    passport.use('local-register', new LocalStrategy({
        passReqToCallback : true
    },
    (req, username, password, done) => {
		console.log('register attempt');
		if(req.body.secret != 'i am a teapot'){
			return done(null, false, { message: '418' });
		}
        connection.query('SELECT * FROM users WHERE username = ?', username, (err,rows) => {
			if (err)
                return done(err);
			 if (rows.length) {
                return done(null, false);
            } else {
                var newUserMysql = {};
				password = bcrypt.hashSync(password);
				newUserMysql.username = username;
                newUserMysql.password = password;
				connection.query('INSERT INTO users ( username, password ) values (?,?)',
					[username, password],function(err,rows){
						newUserMysql.id = rows.insertId;
						return done(null, newUserMysql);
				});
            }
		});
    }));

    passport.use('local-login', new LocalStrategy({
        passReqToCallback : true
    },
    function(req, username, password, done) {
		console.log('login attempt');
         connection.query('SELECT * FROM users WHERE username = ?', username,function(err,rows){
			if (err)
                return done(err);
			 if (!rows.length || !( compareHash(password, rows[0].password))) {
                return done(null, false);
            }
            return done(null, rows[0]);
		});
    }));
};

function compareHash(password, dbpassword){
	return bcrypt.compareSync(password, dbpassword);
}
