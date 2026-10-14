To use Socket.IO in Node.js, you need to create a Node.js
HTTP server, attach a Socket.IO instance to it, and use a
client library to connect to that server.Here is a step-by-step
guide to building a minimal, working real-time application using
Node.js, Express, and Socket.IO.


1. Initialize Your Project & Install DependenciesCreate a new directory for your project, initialize it, and install the required modules:bashmkdir socket-demo && cd socket-demo
npm init -y
npm install express socket.io


2. Create the Backend Server (server.js)Create a file named server.js.
In this file, you will set up Express, tie it to a standard Node.js
http server, and hook Socket.IO into that server

3. Create the Frontend ClientCreate a folder named public,
and inside it, create an index.html file. The frontend will
load the automatically served Socket.IO client library and
communicate with the server.

4. Run and Test Your ApplicationStart your server using 
Node.js:bashnode server.js