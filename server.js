const express = require("express");
const path = require("path");
const http = require("http");
const PORT = process.env.PORT || 3000;
const socketio = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set static folder
app.use(express.static(path.join(__dirname,"public")))

// start server
server.listen(PORT, ()=>console.log(`Server is running on port ${PORT}`))

// handle socket connection request
const connection= [null,null];

io.on('connection', socket =>{
    
    // console.log("New websocket connection")
    // find player 
    let playerIndex = -1;
    for (const i in connection) {
        if(connection[i] === null)   {
            playerIndex = i;
            break;
        }
    }


    // tell the connecting client what player number they are
    socket.emit('player-number',playerIndex)
    console.log(`Player ${playerIndex} has connected`)


    // ignore player 3
    if (playerIndex === -1) return

    connection[playerIndex] = false;
    // what number player just connected
    socket.broadcast.emit('player-connection', playerIndex);


    // handle disconnect
    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} has disconnected`);
        connection[playerIndex] = null;
        // tell what player number just disconnected
        socket.broadcast.emit('player-connection',playerIndex);
    })

    // on ready
    socket.on('player-ready',()=>{
        socket.broadcast.emit('enemy-ready', playerIndex);
        connection[playerIndex]=  true;
    })

    // check player connection
    socket.on('check-players',()=>{
         const players = [];
         for (const i in connection){
             connection[i] === null ? players.push({connected: false, ready: false}) : players.push({connected:true, ready:connection[i]});
         }
         socket.emit('check-players' , players);
    })

    // on fire received
    socket.on('fire',id=>{
        console.log(`Shot fired from ${playerIndex}`, id);
        // emit the move to the other player
        socket.broadcast.emit('fire',id);
    })


    // on fire reply
    socket.on('fire-reply', square=>{

        // forward the reply to the other player
        socket.broadcast.emit('fire-reply', square);
    })

    // time out connection
    setTimeout(()=>{
        connection[playerIndex] = null;
        socket.emit('timeout')
        socket.disconnect();
    },600000)
})



