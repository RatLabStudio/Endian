import { io } from "socket.io-client";

const socket = io("http://localhost:3000");
let connected = false;

let player = null;
let playerList = {};

socket.on("connect", () => {
    console.log(`Connected with ID: ${socket.id}`);
    player.networkId = socket.id;
    connected = true;
});

export function initialize(playerObj) {
    player = playerObj;
}

export function sendInfoToServer(player) {
    if (!connected)
        return;
    socket.emit("playerUpdate", player);
}

socket.on("playerClientUpdate", players => {
    let playersArr = Object.keys(players);
    let temp = playerList[socket.id];
    playerList = players;
    playerList[socket.id] = temp;
    //console.log(playerList);
});