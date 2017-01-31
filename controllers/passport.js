const LocalStrategy   = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const config = require('./config');
const configAuth = require('./auth');


const connection = mysql.createConnection({
				  host     : config.host,
				  user     : config.user,
				  password : config.password,
                  database : config.database
				});

/*
Handling of passport login strategies and serialization to session
*/

module.exports = (passport) => {
	passport.serializeUser((user, done) => {
		done(null, user);
    });

    passport.deserializeUser(function(user, done) {
		connection.query("select * from users where id = ?",
			user.id,
			(err,rows) => {
				done(err, user);
			}
		);
    });


	passport.use(new GoogleStrategy({
			clientID: configAuth.googleAuth.clientID,
			clientSecret: configAuth.googleAuth.clientSecret,
			callbackURL: configAuth.googleAuth.callbackURL,
			passReqToCallback: true
		},
		function(request, accessToken, refreshToken, profile, done) {
			process.nextTick(function () {
				var username = profile.displayName;
				if(username.length < 2){
					username = profile.email;
				}
				connection.query('SELECT * FROM USERS WHERE username = ?',username ,function(err,rows){
					if (err)
			            return done(err);
					 if (rows.length) {
			            return done(null, rows[0]);
			        } else {
			            var newUserMysql = new Object();
						newUserMysql.username = username;
			            newUserMysql.password = accessToken;
						connection.query('INSERT INTO users (username, password) values (?,?)',
							[username, accessToken],function(err,rows){
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

	/*
	Strategy for local registration that inserts user to database.
	TODO: registration restraints
	*/
    passport.use('local-register', new LocalStrategy({
        passReqToCallback : true
    },
    function(req, username, password, done) {
        connection.query('SELECT * FROM USERS WHERE username = ?',username ,function(err,rows){
			if (err)
                return done(err);
			 if (rows.length) {
                return done(null, false);
            } else {
                var newUserMysql = new Object();
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
         connection.query('SELECT * FROM users WHERE username = ?', username,function(err,rows){
			if (err)
                return done(err);
			 if (!rows.length || !( compareHash(password,rows[0].password))) {
                return done(null, false);
            }
            return done(null, rows[0]);
		});
    }));
};

function compareHash(password, dbpassword){
	return bcrypt.compareSync(password, dbpassword);
}
