var userlist = [];

const db = require('../controllers/database');
const bcrypt = require('bcrypt-nodejs');


exports = module.exports = (io) => {

    io.on('connection', (socket) => {
        var user = new Object();
        if(typeof  socket.handshake.session.passport == 'undefined'){
            console.log('no session')
            io.emit('forbidden');
            socket.disconnect();
            return;
        }else{
            let username = socket.handshake.session.passport.user.username;
            let userid = socket.handshake.session.passport.user.id;
            user.userName = username;
            user.userId = userid;
            user.socketid = socket.id;
            userlist.push(user);
            console.log('new user: ' + user);
            io.emit('client list update', userlist);
        }

        socket.on('enter room', (data) => {
            io.emit('client list update', userlist);
            if(data.privateRoom){
                socket.join(getConversationId(data))
                console.log('joining: ' + getConversationId(data))
            }else{
                socket.join(data.currentRoom);
            }

            Query('SELECT * FROM rooms', data, io, 'room list update');

            if(data.privateRoom){

                var userArray =
                QueryPrivateMessages('SELECT * FROM messages WHERE (author_id = ? AND recepient_id = ?)'+
                ' OR (author_id = ? AND recepient_id = ?)',
                [data.userId, data.recepientId,data.recepientId,data.userId],
                io, data, 'room messages update');
            }else{
                QueryRoomMessages('SELECT * FROM messages WHERE room_id = ?', data, io, 'room messages update');
            }

        });

        socket.on('get room update', data => {
            Query('SELECT * FROM rooms', data, io, 'room list update');
        });

        socket.on('leave room', (data) => {
            if(data.privateRoom){
                socket.leave(getConversationId(data))
            }else{
                socket.leave(data.currentRoom);
            }
        });

        socket.on('create new room', (data) => {
            QueryCreateDeleteRoom('INSERT INTO rooms SET ?', data, io, socket, 'room has been created', true);
        });

        socket.on('delete room', (data) =>{
            QueryCreateDeleteRoom('DELETE FROM rooms WHERE id = ? AND owner_id = ?', data, io, socket, 'room has been deleted', false);
        });

        socket.on('new message', (data) => {
            console.log('new message');
            let message = new Object();
            message.message = data.message;
            message.room_id = data.currentRoomId;
            message.author_id = data.userId;
            message.room = data.currentRoom;
            message.author = data.userName;
            message.recepient = data.recepient;
            message.recepient_id = data.recepientId;
            if(data.privateRoom){
                let conversationId = getConversationId(data);
                if(conversationId !== null){
                    io.sockets.in(getConversationId(data)).emit('new message', message);
                }else{
                    io.to(data.userId).emit('partner client disconnected');
                }
            }
            else
                io.sockets.in(message.room).emit('new message', message);

            Query('INSERT INTO messages SET ?', message);
        });

        socket.on('disconnect', () => {
            console.log('disconnected: ' + user);
            userlist.splice(userlist.map((u) => { return u.socketid; } ).indexOf(socket.id),1)
            io.emit('client list update', userlist);
        });
    });


};

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

                function compareHash(password, dbpassword){
                    return bcrypt.compareSync(password, dbpassword);
                }
