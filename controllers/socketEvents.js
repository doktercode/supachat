const db = require('../controllers/database');
const bcrypt = require('bcrypt-nodejs');

// user list array that holds all active users and their data
var userlist = [];

exports = module.exports = (io) => {
    // conncetion and reconnection event
    io.on('connection', (socket) => {
        // create an user object TODO: extract to user model
        var user = new Object();
        // check session. if no session logout the user
        if(typeof  socket.handshake.session.passport == 'undefined'){
            console.log('no session')
            io.emit('forbidden');
            socket.disconnect();
            return;
        }else{
            // if session valid create user object and push to userlist
            let username = socket.handshake.session.passport.user.username;
            let userid = socket.handshake.session.passport.user.id;
            user.userName = username;
            user.userId = userid;
            user.socketid = socket.id;
            userlist.push(user);
            console.log('new user: ' + user);
            // emit to clients that a new user has connected
            io.emit('client list update', userlist);
        }

        // socket enters a room
        socket.on('enter room', (data) => {
            // emit userlist to clients for update
            io.emit('client list update', userlist);
            // check if the room is a private conversation
            if(data.privateRoom){
                // if room is private create private room id from unique socket ids
                socket.join(getConversationId(data))
            }else{
                // else set to roomId
                socket.join(data.currentRoom);
            }
            // emit a room list update to user
            Query('SELECT * FROM rooms', data, io, 'room list update');

            // emit messages from the room to client
            if(data.privateRoom){
                // if private get senders and recepients correspondance and emit it
                var userArray =
                QueryPrivateMessages('SELECT * FROM messages WHERE (author_id = ? AND recepient_id = ?)'+
                ' OR (author_id = ? AND recepient_id = ?)',
                [data.userId, data.recepientId,data.recepientId,data.userId],
                io, data, 'room messages update');
            }else{
                // else emit general update to selected room
                QueryRoomMessages('SELECT * FROM messages WHERE room_id = ?', data, io, 'room messages update');
            }

        });

        // emit all users to client
        socket.on('show all users', (data) => {
            QueryPrivate('SELECT id, username FROM users', data, io, socket, 'all users list');
            console.log('showing all users');
        });

        // get room list
        socket.on('get room update', (data) => {
            Query('SELECT * FROM rooms', data, io, 'room list update');
        });

        // get active clients
        socket.on('get client-list update', (data) => {
            io.emit('client list update', userlist);
        });

        // client leaving room. stop receiving updates on that room
        socket.on('leave room', (data) => {
            if(data.privateRoom){
                socket.leave(getConversationId(data))
            }else{
                socket.leave(data.currentRoom);
            }
        });

        // creates a new room and emits to calling socket
        socket.on('create new room', (data) => {
            QueryCreateDeleteRoom('INSERT INTO rooms SET ?', data, io, socket, 'room has been created', true);
        });

        // deletes a room and emits to calling socket
        socket.on('delete room', (data) =>{
            QueryCreateDeleteRoom('DELETE FROM rooms WHERE id = ? AND owner_id = ?', data, io, socket, 'room has been deleted', false);
        });

        // received a new message
        socket.on('new message', (data) => {
            console.log('new message');
            // create message object TODO: separate to message model
            let message = new Object();
            // rename fields for database entry
            message.message = data.message;
            message.room_id = data.currentRoomId;
            message.author_id = data.userId;
            message.room = data.currentRoom;
            message.author = data.userName;
            message.recepient = data.recepient;
            message.recepient_id = data.recepientId;
            // check if private
            if(data.privateRoom){
                // get conversation id. if recepient is not in userlist he is disconnected
                let conversationId = getConversationId(data);
                if(conversationId !== null){
                    io.sockets.in(getConversationId(data)).emit('new message', message);
                }else{
                    // tell the client that recepient is offline
                    io.to(getOwnSocketId(data.userId)).emit('partner client disconnected', message);
                }
            }
            else{
                // if not private emit to the new message to room
                io.sockets.in(message.room).emit('new message', message);
            }
            // store message in database
            Query('INSERT INTO messages SET ?', message);
        });

        // user disconnected. remove from user list and  new userlist to namespace
        socket.on('disconnect', () => {
            console.log('disconnected: ' + user);
            userlist.splice(userlist.map((u) => { return u.socketid; } ).indexOf(socket.id),1)
            io.emit('client list update', userlist);
        });
    });
};

// function that generates a private room based on clients socket id
function getConversationId(data){
    var conversation = [];
    console.log(conversation);
    try{
        conversation.push(userlist.filter((u) => { return u.userId === parseInt(data.userId); })[0].socketid);
        conversation.push(userlist.filter((u) => { return u.userId === parseInt(data.recepientId); })[0].socketid); //TODO: fix bug
        conversation.sort();
    }catch(err){
        console.log(err);
        return null;
    }
    return conversation[0]+conversation[1];
}

// function to get socket id from user in userlist. Used to send private messages
function getOwnSocketId(id){
    return userlist.filter((u) => { return u.userId === parseInt(id); })[0].socketid;
}

// Queries. TODO: Combine these. Quick and dirty.


//Basic query that emits global
function Query(sql, data, io, socketMessage) {
    db.acquire((err, db) => {
        if(err){
            db.release();
            return console.log(err);
        }
        db.query(sql, data,
            (err, result) => {
                db.release();
                if(err){
                    console.log(err);
                    return console.log(err);
                }
                if(io){
                    return io.emit(socketMessage, result);
                }
                return console.log('query successfull');
            });
        });
    }

// Query to delete and create rooms. Emits privately
function QueryCreateDeleteRoom(sql, data, io, socket, message, create) {
    db.acquire((err, db) => {
        if(err){
            db.release();
            return console.log(err);
        }
        if(create)
        sqlData = data;
        else
        sqlData = [data.currentRoomId, data.userId];
        db.query(sql, sqlData,
            (err, result) => {
                db.release();
                if(err){
                    console.log(err);
                    return console.log(err);
                }
                if(io){
                    data.id = result.insertId;
                    return io.to(socket.id).emit(message, data);
                }
                return console.log('query successfull');
            });
        });
    }

// Query to get private messages based on author and sender id
function QueryPrivateMessages(sql, sqlVariables, io, data, socketMessage) {
    db.acquire((err, db) => {
        if(err){
            db.release();
            return console.log(err);
        }
        db.query(sql, sqlVariables,
            (err, result) => {
                db.release();
                if(err){
                    console.log(err);
                    return console.log(err);
                }
                if(io){
                    return io.to(getConversationId(data)).emit(socketMessage, result);
                }
                return console.log('query successfull');
            });
        });
    }

// Query that emits privately to requesting socket
function QueryPrivate(sql, data, io, socket, socketMessage) {
    db.acquire((err, db) => {
        if(err){
            db.release();
            return console.log(err);
        }
        db.query(sql,
            (err, result) => {
                db.release();
                if(err){
                    console.log(err);
                    return console.log(err);
                }
                if(io){
                    return io.to(socket.id).emit(socketMessage, result);
                }
                return console.log('query successfull');
            });
        });
    }

// Query to get messages. Emits privately.
function QueryRoomMessages(sql, data, io, socketMessage) {
    db.acquire((err, db) => {
        if(err){
            db.release();
            return console.log(err);
        }
        db.query(sql, data.currentRoomId,
            (err, result) => {
                db.release();
                if(err){
                    console.log(err);
                    return console.log(err);
                }
                if(io){
                    return io.to(userlist.filter((user) => { return user.userId === data.userId; })[0].socketid).emit(socketMessage, result);
                }
                return console.log('query successfull');
            });
        });
    }
