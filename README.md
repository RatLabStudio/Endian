# Project Endian

_Alpha v5.2.6_

![Picture of the game Endian](/project-files/images/gamePhoto.PNG)

## What is Endian

**Endian** is a project that I have been working on for a while now. It is a 3D space game that will have multiplayer, spaceships, guns, and more! I hope to build a smooth and robust engine with voxels, and a solid player controller so that the game feels nice and snappy. My goal is to have some sort of story in the game that you can play through with friends. I hope to make the game feel satisfying to play and I want to maintain the retro look of the engine.

## The E-CPU

The **E-CPU** is an in-game computer that is planned to be located on ships. It will essentially be a simple virtualized computer that runs on the server side and can be seen and used by all players. Currently, I have completed the physical screen of the computer; meaning the computer can do something on the server side, and it will be displayed on every game client. Functionality includes: typing, simple animations, and image displaying from a URL. All of this is processed on the server, so all the clients have to do is draw the pixels given to them.

## How it is Being Developed

I am building this version of the game using JavaScript, with the graphics library known as [Three.js](https://threejs.org/), paired with the physics library [Cannon-ES](https://pmndrs.github.io/cannon-es/). The game currently features the rudimentary game engine I have created, with multiplayer and simple game mechanics being implemented.

## How to Play

You can play the game at [endian.ratlabstudio.com](https://endian.ratlabstudio.com). This is a public test site, so keep in mind that there will be bugs and errors at some points as I work on the game. If the site is down, it is likely due to a project pause. You can also download the repository and run the game locally as you please *(instructions below)*.

## Multiplayer

The multiplayer in this game is created with [Socket.io](https://socket.io/), and players can play on various servers with each other. I would like to add co-op exploration, and player-versus-player combat to the engine for an enjoyable multiplayer experience.

## Running the Program

Endian runs in two separate programs: the *client* and the *server*. The server consists of two components: the server and the simulation. There is also a simulation viewer, which is essentially a modified version of the client that does not give you a physical character, and you can float around and look at the world as things happen.

### The Server

The server mostly manages incoming and outgoing data. It works as a mediator between the clients and the simulation, ensuring both have updated information. The server uses Socket.io to communicate with the clients, it is a basic network connection library that specializes in live connections; this design makes it perfect for a game like Endian.

### The Simulation

The Endian simulation manages all physics and movement in the game. The simulation calculates what is happening in the game and handles all physics resolutions. The updated data is then sent by the server component to every client connected to it.

### How to Run the server

To run the server *(the simulation runs with it automatically)*, Navigate to the server folder of this repository in the terminal, and run the following commands:

*npm install*

*npm run dev*

This will install all the required dependencies to your local machine and run the server. *You will need to port forward the port 3000 to allow users outside your local network to join*. For users to join your server, they can input your public IP to the server select screen. The server can be joined by players playing on both web-based clients and executable clients.

### How to Run the Client

The client can be run as a [Vite](https://vite.dev/) server, which allows it to be a webpage that is sent to the user from the server. This makes it easier to deploy the game, but can cause performance issues, such as lag or networking issues due to browser limitations. The recommended browser to play on is Google Chrome, but any Chromium-based browser *should* work.

To start the vite server, navigate to the client folder of this repository and run the following commands:

*npm install*

*npm run dev*

This will print a URL to the console that the webpage can be accessed from. *Note that this URL is local to your network*, so you will need to port-forward to allow users from other networks to join.

### How to Build the Executable

Endian can also be built as an [Electron](https://www.electronjs.org/) application. This benefits the user by making the program easier to access, and more reliable for performance, due to the backend being less subject to change than whatever browser the user may be using.

To build the executable, follow the instructions at the bottom of the game.html file to ensure the proper script is being run. This is required because electron requires a bundled format for all game code. Once you have uncommented the proper script file, navigate to the client folder of this repository in the terminal, and run the following commands:

*npm install*

*npm run deploy*

This will entirely build the executable file and store it in a new folder at the root of the client folder.