// Declare globals
var users = [];
var socket;
var user = {};
var message = {};
// Declare and set default chatroom
var defaultRoom = "Supachat";
var defaultRoomId = 1;

// Instantiate user model TODO: separate to user and message model
user.currentRoom = defaultRoom;
user.currentRoomId = defaultRoomId;
user.userName;
user.userId;
user.recepient;
user.recepientId;
user.privateRoom = false;

$.ajax({
    // get username and user id from server
    type: 'GET',
    url: '/user_data',
    success: function(data) {
        // on success set local user
        user.userName = data.username;
        user.userId = data.id;
        socket.emit('enter room', user);
    }
});

var socket = io('http://localhost:3000/');
//var socket = io('http://supachat.hopto.org/');


// received a client list update from server TODO: extract this to function
socket.on('client list update', function(data){
    $('#client-list').empty();
    if(data.length === 1)
    $('#client-count').text('(Alone)');
    else
    $('#client-count').text(data.length);
    // parse data and append to client-list TODO: extract this to function
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
    // setup click events per row TODO: extract this to function
    $('.client-item').on('click', function() {
        socket.emit('leave room', user);
        // on click change to private mode and set recepient
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

// received a room list update from server
socket.on('room list update', function(data){
    $('#room-list').empty();
    var list = $('#room-list');
    if(data.length === 0){
        list.text('No rooms =(');
    }
    // parse data and create list items for room-list TODO: extract this to function
    $.each(data, function(index, value){
        var a = $('<a/>').addClass('room-item list-group-item').attr('id',value.id).text(value.name).appendTo(list);
        if(value.id == user.currentRoomId){
            a.addClass('active');
        }
        if (value.owner_id == user.userId){
            var i = $('<i/>').addClass('fa fa-star pull-right').attr('aria-hidden',true).appendTo(a);
            a.attr('title','You own this room!');
        }
    });
    // setup click events per row TODO: extract this to function
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

// received messages upon entering room. update message list
socket.on('room messages update', function(data){
    console.log('room messages update');
    $('#messages').empty();
    if(data.length === 0){
        $('#messages').text('Nobody has said anything =(');
    }
    // parse data and create list item per row
    $.each(data, function(index, message){
        $('#messages').prepend(
            $('<li>').addClass('list-group-item').text('  ' + message.message)
            .prepend($('<span>').addClass('label label-default').text(message.author).css('background-color', '#'+intToRGB(hashCode(message.author))))
            .prepend($('<span>').addClass('label label-default').text(new Date(message.timestamp).toLocaleString()))
        );
    });
});

// server sent an error. log error to concole
socket.on('error', function(error){
    console.log(error);
});

// received a new message in current room
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

// room has been created TODO: create a notification for user
socket.on('room has been created', function(data){
    socket.emit('get room update', user);
    console.log('jeee! a new room!' + data);
});

// room has been created TODO: create a notification for user
socket.on('room has been deleted', function(data){
    socket.emit('get room update', user);
    console.log('boo! bye room!' + data);
});

// private message was stored in db. partner client offline TODO: notify to chat
socket.on('partner client disconnected', function(data){
    console.log('partner offline');
    $('#messages').prepend(
        $('<li>').addClass('list-group-item').text('  ' + data.message)
        .prepend($('<span>').addClass('label label-default').text(data.author).css('background-color', '#'+intToRGB(hashCode(data.author))))
        .prepend($('<span>').addClass('label label-default').text(new Date().toLocaleString()))
    );
});

// received all users in db
socket.on('all users list', function(data){
    $('#client-list').empty();
    $('#client-count').text('ALL USERS');
    // parse all users and create list items. TODO: extract to function
    $.each(data, function(index, value){
        if(value.id != user.userId){
            var a = $('<a>').attr('href','#').addClass('client-item list-group-item').attr('id', value.id).text(value.username);
            a.attr('title','Click to open private chat.');
            $('#client-list').append(a);
        }
    });
    // set click events. TODO: extract to function
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

// socket or session not valid. logout
socket.on('forbidden', function(){
    logout();
});

// validate message and send to server
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

// create room button that opens the modal
$('#createRoomButton').click(function(){
    var newRoom = Object();
    newRoom.name = $('#formName').val();
    $('#formName').val('');
    newRoom.owner_id = user.userId;
    socket.emit('create new room', newRoom);

});

// deletes the selected room. TODO: disable button for rooms that are not owned
$('#delete-room-button').click(function(){
    socket.emit('delete room', user);
    user.currentRoomId = defaultRoomId;
    user.currentRoom = defaultRoom;
    $('#room-title').text(defaultRoom);
});

// logout button. Disconnect socket and logout session
$('#logout').click(function(){
    console.log('logout');
    socket.emit('disconnect', user);
    logout();
});

// opens and closes side menu
$('#menu-toggle').click(function(e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
});

// gets all users in database
$('#show-all-users-button').click(function(){
    socket.emit('show all users');
    console.log('getting all users');
});

// shows active users
$('#show-active-users-button').click(function(){
    console.log('getting active users');
    socket.emit('get client-list update');
});

// logout function that destroys user session and redirects to login page
function logout(){
    $.ajax({
        type:'GET',
        url:'/logout',
        success:function(xhr, result, response){
            window.location.href = "/";
        }
    });

}

// function to get persistant user color for label
// get a has from username
function hashCode(str) { // java String#hashCode
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

// turn the hash to colorcode
function intToRGB(i){
    var c = (i & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();
    return "00000".substring(0, 6 - c.length) + c;
}
