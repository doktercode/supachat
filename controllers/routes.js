const express = require('express');
const path = require('path');
const passport = require('passport');

module.exports = (app) => {

    //modules
    app.use(express.static(__dirname + '/public'));
    app.use('/bootstrap/css', express.static(path.join(__dirname + '/../node_modules/bootstrap/dist/css')));
    app.use('/bootstrap/js', express.static(path.join(__dirname + '/../node_modules/bootstrap/dist/js')));
    app.use('/jquery', express.static(path.join(__dirname + '/../node_modules/jquery/dist/')));

    // root route. rediects to chat if session is alive else renders index
    app.get('/',(req,res) =>{
        if(req.user)
            res.redirect('/chat');
        else
            res.render('pages/index');
    });

    // chat application route
    app.get('/chat', isLoggedIn, (req,res) => {
        res.render('pages/chat');
    });

    // logout user and redirect to login page
    app.get('/logout', (req, res) => {
        req.logout();
        res.redirect('/');
    });

    // google auth
    app.get('/auth/google',
    passport.authenticate('google', { successRedirect: '/',scope:
    [ 'https://www.googleapis.com/auth/userinfo.email']
    }));

    // google auth callback
    app.get( '/auth/google/callback',
    passport.authenticate('google', {
        successRedirect : '/chat',
        failureRedirect : '/'
    }));

    // facebook auth
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

    // facebook auth callback
    app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        successRedirect : '/chat',
        failureRedirect : '/'
    }));

    // get user id and username
    app.get('/user_data', (req, res) => {
        if (req.user === undefined)
            res.json({});
        else
            res.json(req.user);
    });

    // local-login route
    app.post('/login',
    passport.authenticate('local-login'),
    (req, res) => {
        res.status(200).send(req.user);
    });

    // local-register route
    app.post('/register',
    passport.authenticate('local-register'),
    (req, res) => {
        res.status(200).send(req.user);
    });

    // 404 route, with a poem
    app.use((req, res, next) => {
        res.status(404);

        if (req.accepts('html')) {
            res.render('pages/404');
            return;
        }
        if (req.accepts('json')) {
            res.send({ error: 'Not found' });
            return;
        }
        res.type('txt').send('Not found');
    });
};

// log in checker for chat route
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/');
}
