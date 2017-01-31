
$('#username').focus(function() {
    $('label[for="username"]').addClass('selected');
});
$('#username').blur(function() {
    $('label[for="username"]').removeClass('selected');
});
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

function login(){
    if($('#username').val().length == 0){
        $('#whoareyou').text('No name, no service!');
        $('#username').val('');
        $('#username').attr('placeholder', 'The nameless one');
        $('.box-header').addClass('error');
        return;
    }

    if($('#password').val().length == 0){
        $('#whoareyou').text('We hash, I promise');
        $('#password').val('');
        $('#password').attr('placeholder', 'Gief pwd..');
        $('.box-header').addClass('error');
        return;
    }
    else{
        $.ajax({
            type:'POST',
            url:'/login',
            data:  {username: $('#username').val(), password: $('#password').val()},
            success:function(xhr, result, response){
                    $('#whoareyou').text('Welcome !!');
                    $('.container').fadeOut(2000, openChat);
                    $('.box-header').removeClass('error');

            },
            error: function (xhr, ajaxOptions, thrownError) {
               if(xhr.status == 401){
                   $('#whoareyou').text('Computer says no!');
                   $('#password').val('');
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

function register(){
    if($('#username').val().length == 0){
        $('#whoareyou').text('No name, no service!');
        $('#username').val('');
        $('#username').attr('placeholder', 'The nameless one');
        $('.box-header').addClass('error');
        return;
    }

    if($('#password').val().length == 0){
        $('#whoareyou').text('We hash, I promise');
        $('#password').val('');
        $('#password').attr('placeholder', 'Gief pwd..');
        $('.box-header').addClass('error');
        return;
    }
    else{
        $.ajax({
        type:'POST',
        url:'/register',
        data:  {username: $('#username').val(), password: $('#password').val()},
        success:function(xhr, data){
            $('.box-header').removeClass('error');
            login();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            if(xhr.status == 401){
                $('#whoareyou').text('Username taken!');
                $('#username').val('');
                $('#username').attr('placeholder', 'Pick a new one');
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
    $('#logo').addClass('animated fadeInDown');
    $("input:text:visible:first").focus();
    sessionStorage.clear();
});

function setSessionStorage(username, userid){
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('userid', userid);
}

function openChat() {
    window.location = '/chat';
}
