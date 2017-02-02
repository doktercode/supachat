var users = [];
var socket;
var user = {};
var message = {};

var defaultRoom = "Supachat";
var defaultRoomId = 1;

user.currentRoom = defaultRoom;
user.currentRoomId = defaultRoomId;
user.userName;
user.userId;
user.recepient;
user.recepientId;
user.privateRoom = false;

$.ajax({
    type: 'GET',
    url: '/user_data',
    success: function(data) {
        user.userName = data.username;
        user.userId = data.id;
        socket.emit('user data reply', user);
        socket.emit('enter room', user);
    }
});

var socket = io('http://localhost:3000/');
//var socket = io('http://supachat.hopto.org/');

socket.on('client list update', function(data){
    $('#client-list').empty();
    if(data.length === 1)
    $('#client-count').text('(Alone)');
    else
    $('#client-count').text(data.length);
    $.each(data, function(index, value){
        if(value.userId == user.userId){
            $('#currentuser').empty().append(value.userName);
        }else{
            var a = $('<a>').attr('href','#').addClass('client-item list-group-item').attr('id', value.userId).text(value.userName);
            if(value.userId == user.recepientId)
            a.addClass('active');
            a.attr('title','Click to open private chat.');
            $('#client-list').append(a);
        }
    });
    $('.client-item').on('click', function() {
        socket.emit('leave room', user);
        user.recepient = $(this).text();
        user.recepientId = $(this).attr('id');
        user.privateRoom = true;
        user.currentRoom = null;
        user.currentRoomId = null;
        $('#room-title').text($(this).text());
        if (($(window).width() <= 750)) {
            $("#wrapper").toggleClass("toggled");
        }
        socket.emit('enter room', user);
    });
});

socket.on('room list update', function(data){
    console.log('room list update');
    $('#room-list').empty();
    var list = $('#room-list');
    if(data.length === 0)
    list.text('No rooms =(');
    $.each(data, function(index, value){
        var a = $('<a/>').addClass('room-item list-group-item').attr('id',value.id).text(value.name).appendTo(list);
        if(value.id == user.currentRoomId)
        a.addClass('active');
        if (value.owner_id == user.userId){
            var i = $('<i/>').addClass('fa fa-star pull-right').attr('aria-hidden',true).appendTo(a);
            a.attr('title','You own this room!');
        }
    });
    $('.room-item').click(function(){
        socket.emit('leave room', user);
        user.recepient = null;
        user.privateRoom = false;
        user.recepientId = null;
        user.currentRoomId = $(this).attr('id');
        user.currentRoom = $(this).text();
        $('#room-title').text($(this).text());
        if (($(window).width() <= 750)) {
            $("#wrapper").toggleClass("toggled");
        }
        socket.emit('enter room', user);
    });
});

socket.on('room messages update', function(data){
    console.log('room messages update');
    $('#messages').empty();
    if(data.length === 0){
        $('#messages').text('Nobody has said anything =(');
    }
    $.each(data, function(index, message){
        $('#messages').prepend(
            $('<li>').addClass('list-group-item').text('  ' + message.message)
            .prepend($('<span>').addClass('label label-default').text(message.author).css('background-color', '#'+intToRGB(hashCode(message.author))))
            .prepend($('<span>').addClass('label label-default').text(new Date(message.timestamp).toLocaleString()))
        );
    });
});

socket.on('error', function(error){
    console.log(error);
});

socket.on('new message', function(message){
    console.log('new message');
    console.log(message);
    if(message.room_id === user.currentRoomId){
        console.log('in the same room. appending');
        $('#messages').prepend(
            $('<li>').addClass('list-group-item').text('  ' + message.message)
            .prepend($('<span>').addClass('label label-default').text(message.author).css('background-color', '#'+intToRGB(hashCode(message.author))))
            .prepend($('<span>').addClass('label label-default').text(new Date().toLocaleString()))
        );
    }
});

socket.on('room has been created', function(data){
    socket.emit('get room update', user);
    console.log('jeee! a new room!' + data);
});

socket.on('room has been deleted', function(data){
    socket.emit('get room update', user);
    console.log('boo! bye room!' + data);
});

socket.on('partner client disconnected', function(data){
    console.log('partner offline');
    $('#messages').prepend(
        $('<li>').addClass('list-group-item').text('  ' + data.message)
        .prepend($('<span>').addClass('label label-default').text(data.author).css('background-color', '#'+intToRGB(hashCode(data.author))))
        .prepend($('<span>').addClass('label label-default').text(new Date().toLocaleString()))
    );
});

socket.on('all users list', function(data){
    console.log('got all users: ' + JSON.stringify(data));

    $('#client-list').empty();
    $('#client-count').text('ALL USERS');
    $.each(data, function(index, value){
        if(value.id != user.userId){
            var a = $('<a>').attr('href','#').addClass('client-item list-group-item').attr('id', value.id).text(value.username);
            a.attr('title','Click to open private chat.');
            $('#client-list').append(a);
        }
    });
    $('.client-item').on('click', function() {
        socket.emit('leave room', user);
        user.recepient = $(this).text();
        user.recepientId = $(this).attr('id');
        user.privateRoom = true;
        user.currentRoom = null;
        user.currentRoomId = null;
        $('#room-title').text($(this).text());
        if (($(window).width() <= 750)) {
            $("#wrapper").toggleClass("toggled");
        }
        socket.emit('enter room', user);
        });
});

socket.on('forbidden', function(){
    logout();
});

$('#chatform').submit(function(e){
    e.preventDefault();
    var message = $('#message').val();
    $('#message').val('');
    if(message.length > 0){
        var messageJSON = new Object();
        messageJSON = user;
        messageJSON.message = message;
        socket.emit('new message', messageJSON);
    }else {
        $('#message').attr('placeholder', 'Gotta say something to post something');
    }
});

$('#createRoomButton').click(function(){
    var newRoom = Object();
    newRoom.name = $('#formName').val();
    $('#formName').val('');
    newRoom.owner_id = user.userId;
    socket.emit('create new room', newRoom);

});

$('#delete-room-button').click(function(){
    socket.emit('delete room', user);
    user.currentRoomId = defaultRoomId;
    user.currentRoom = defaultRoom;
    $('#room-title').text(defaultRoom);
});

$('#logout').click(function(){
    console.log('logout');
    socket.emit('disconnect', user);
    logout();
});

$('#menu-toggle').click(function(e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
});

$('#show-all-users-button').click(function(){
    socket.emit('show all users');
    console.log('getting all users');
});

$('#show-active-users-button').click(function(){
    console.log('getting active users');
    socket.emit('get client-list update');
});



$( document ).ready(function() {

});

function logout(){
    $.ajax({
        type:'GET',
        url:'/logout',
        success:function(xhr, result, response){
            window.location.href = "/";
        }
    });

}

function hashCode(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

function intToRGB(i){
    var c = (i & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();

    return "00000".substring(0, 6 - c.length) + c;
}
