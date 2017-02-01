const express = require('express');
const path = require('path');
const passport = require('passport');

module.exports = (app) => {

    //modules
    app.use(express.static(__dirname + '/public'));
    app.use('/bootstrap/css', express.static(path.join(__dirname + '/../node_modules/bootstrap/dist/css')));
    app.use('/bootstrap/js', express.static(path.join(__dirname + '/../node_modules/bootstrap/dist/js')));
    app.use('/jquery', express.static(path.join(__dirname + '/../node_modules/jquery/dist/')));

    // insert message to database
    app.get('/',(req,res) =>{
        if(req.user)
        res.redirect('/chat');
        else
        res.render('pages/index');
    });

    app.get('/auth/google',
    passport.authenticate('google', { successRedirect: '/',scope:
    [ 'https://www.googleapis.com/auth/userinfo.email']
}));

app.get( '/auth/google/callback',
passport.authenticate('google', {
    successRedirect : '/chat',
    failureRedirect : '/'
}));

app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));


app.get('/auth/facebook/callback',
passport.authenticate('facebook', {
    successRedirect : '/chat',
    failureRedirect : '/'
}));

app.get('/user_data', (req, res) => {
    if (req.user === undefined)
    res.json({});
    else
    res.json(req.user);
});

app.post('/login',
passport.authenticate('local-login'),
(req, res) => {
    res.status(200).send(req.user);
});

app.post('/register',
passport.authenticate('local-register'),
(req, res) => {
    res.status(200).send(req.user);
});

app.get('/chat', isLoggedIn, (req,res) => {
    res.render('pages/chat');
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

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

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/');
}
