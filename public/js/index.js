// Focus and unfocus for login page input fields
$('#username').focus(function() {
    $('label[for="username"]').addClass('selected');
});
$('#username').blur(function() {
    $('label[for="username"]').removeClass('selected');
});

$('#password').focus(function() {
    $('label[for="password"]').addClass('selected');
});
$('#password').blur(function() {
    $('label[for="password"]').removeClass('selected');
});

$('#secret').focus(function() {
    $('label[for="secret"]').addClass('selected');
});
$('#secret').blur(function() {
    $('label[for="secret"]').removeClass('selected');
});

// Login page click handlers

$('#login').click(function() {
    login();
});

$('#register').click(function() {
    register();
});

$('#password').keypress(function(event) {
    if (event.which == 13) {
        event.preventDefault();
        login();
    }
});

// Login page functions

// Local login
function login(){
    // Validate username. TODO: do this serverside
    if($('#username').val().length == 0){
        $('#whoareyou').text('No name, no service!');
        $('#username').val('');
        $('#username').attr('placeholder', 'The nameless one');
        $('.box-header').addClass('error');
        return;
    }
    // Validate password. TODO: do this serverside
    if($('#password').val().length == 0){
        $('#whoareyou').text('We hash, I promise');
        $('#password').val('');
        $('#password').attr('placeholder', 'Gief pwd..');
        $('.box-header').addClass('error');
        return;
    }
    else{
        //POST credentials to passport api
        $.ajax({
            type:'POST',
            url:'/login',
            data:  {username: $('#username').val(), password: $('#password').val()},
            success:function(xhr, result, response){
                // on success fade out and call openChat function
                $('#whoareyou').text('Welcome !!');
                $('.container').fadeOut(2000, openChat);
                $('.box-header').removeClass('error');
            },
            error: function (xhr, ajaxOptions, thrownError) {
                // handle error codes and provide messages
                if(xhr.status == 401){
                    $('#whoareyou').text('Computer says no!');
                    $('.box-header').addClass('error');
                }
                else{
                    $('#whoareyou').text('Big bad server error!');
                    $('.box-header').addClass('error');
                }
            }
        });
    }
}
// Local register.
function register(){
    // Validate username TODO: do this serverside
    if($('#username').val().length == 0){
        $('#whoareyou').text('No name, no service!');
        $('#username').val('');
        $('#username').attr('placeholder', 'The nameless one');
        $('.box-header').addClass('error');
        return;
    }
    // Validate password TODO: do this serverside
    if($('#password').val().length == 0){
        $('#whoareyou').text('We hash, I promise');
        $('#password').val('');
        $('#password').attr('placeholder', 'Gief pwd..');
        $('.box-header').addClass('error');
        return;
    }
    // Validate secret TODO: do this serverside
    if($('#secret').val().length == 0){
        $('#whoareyou').text('You shall not pass!');
        $('#secret').val('');
        $('#secret').attr('placeholder', 'Secret word..');
        $('.box-header').addClass('error');
        return;
    }
    // Validate secret TODO: do this serverside
    if($('#secret').val() !== 'i am a teapot'){ //Just to keep the randoms out
        $('#whoareyou').text('Not the secret we want!');
        $('#secret').val('');
        $('#secret').attr('placeholder', 'Secret word..');
        $('.box-header').addClass('error');
        return;
    }
    else{
        // If validation passed post to passport register api.
        $.ajax({
            type:'POST',
            url:'/register',
            data:  {username: $('#username').val(), password: $('#password').val(), secret: $('#secret').val()},
            success:function(xhr, data){
                // On successfull registration login using normal login process
                $('.box-header').removeClass('error');
                login();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                // Handle errors and provide messages
                if(xhr.status == 401){
                    $('#whoareyou').text('Username taken!');
                    $('#username').val('');
                    $('#username').attr('placeholder', 'Pick a new one');
                    $('.box-header').addClass('error');
                }else if(xhr.status == 418){
                    $('#whoareyou').text('Server returned: 418');
                    $('.box-header').addClass('error');
                }else{
                    $('#whoareyou').text('Big bad server error!');
                    $('.box-header').addClass('error');
                }
            }
        });
    }
}


$(document).ready(function () {
    // animate login box slide in
    $('#logo').addClass('animated fadeInDown');
    $("input:text:visible:first").focus();
    sessionStorage.clear();
});

function openChat() {
    // on success redirect to chat. TODO: do this serverside
    window.location = '/chat';
}
