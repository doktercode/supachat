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



//var socket = io('http://localhost:3000/');
var socket = io('http://supachat.hopto.org:3000/');

socket.on('client list update', function(data){
     $('#clientlist').empty();
     $.each(data, function(index, value){
         if(value.userId == user.userId){
             var currentUser = '<b>'+value.userName+'</b>';
             $('#currentuser').empty().append(currentUser);
         }else{
             var a = $('<a href="#" class="clientitem list-group-item" id='+value.userId+'>'+value.userName+'</a>');
             if(value.userId == user.recepientId)
                a.addClass('active');
             $('#clientlist').append(a);
         }
     });
     $('.clientitem').on('click', function() {
         socket.emit('leave room', user);
         user.recepient = $(this).text();
         user.recepientId = $(this).attr('id');
         user.privateRoom = true;
         user.currentRoom = null;
         user.currentRoomId = null;
         $('#room-title').text($(this).text());
         socket.emit('enter room', user);
     });
 });

 socket.on('room list update', function(data){
     console.log('room list update');
     $('#roomlist').empty();
     var list = $('#roomlist');
     $.each(data, function(index, value){
         var a = $('<a/>').addClass('roomitem list-group-item').attr('id',value.id).text(value.name).appendTo(list);
         if(value.id == user.currentRoomId)
            a.addClass('active');
         if (value.owner_id == user.userId){
            var i = $('<i/>').addClass('fa fa-star pull-right').attr('aria-hidden',true).appendTo(a);
            a.attr('title','You own this room!');
        }
     });
     $('.roomitem').click(function(){
         socket.emit('leave room', user);
         user.recepient = null;
         user.privateRoom = false;
         user.recepientId = null;
         user.currentRoomId = $(this).attr('id');
         user.currentRoom = $(this).text();
         $('#room-title').text($(this).text());
         socket.emit('enter room', user);
     });
 });

 socket.on('room messages update', function(data){
     console.log('room messages update');
     $('#messages').empty();
     $.each(data, function(index, message){
         $('#messages').prepend(
             $('<li>').addClass('list-group-item').text('  ' + message.message)
                 .prepend($('<span>').addClass('label label-default').text(message.author).css('background-color', '#'+intToRGB(hashCode(message.author))))
                 .append($('<span>').addClass('label label-default pull-right').text(new Date(message.timestamp).toLocaleString()))
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
        console.log('in the same room. appending')
        $('#messages').prepend(
            $('<li>').addClass('list-group-item').text('  ' + message.message)
                .prepend($('<span>').addClass('label label-default').text(message.author).css('background-color', '#'+intToRGB(hashCode(message.author))))
                .append($('<span>').addClass('label label-default pull-right').text(new Date().toLocaleString()))
        );
     }
 });

socket.on('forbidden', function(){
    logout();
})

$('#chatform').submit(function(e){
    e.preventDefault();
    var message = $('#message').val();
    if(message.length > 0){
        $('#message').val('');
        var messageJSON = new Object();
        messageJSON = user;
        messageJSON.message = message;
        socket.emit('new message', messageJSON);
    }else {
        $('#message').val('');
        $('#message').attr('placeholder', 'Gotta say something to post something');
    }

});

$('#createRoomButton').click(function(){
    var newRoom = Object();
    newRoom.name = $('#formName').val();
    newRoom.owner_id = user.userId;
    socket.emit('create new room', newRoom);
    socket.emit('enter room', user);
});

$('#delete-room-button').click(function(){
    socket.emit('delete room', user);
    user.currentRoomId = defaultRoomId;
    user.currentRoom = defaultRoom;
    socket.emit('enter room', user);
    $('#room-title').text(defaultRoom);

});

$('#logout').click(function(){
    console.log('logout');
    socket.emit('disconnect', user);
    logout();
});

$("#menu-toggle").click(function(e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
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
