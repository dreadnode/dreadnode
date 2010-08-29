var sys       = require("sys"),
    // npm dependencies
    connect   = require("connect"),
    express   = require("express"),
    io        = require("socket.io"),
    // local
    gm   = require(__dirname+"/lib/gamemanager");

var dreadnode = express.createServer(),
    port      = parseInt(process.env.PORT) || 80;

// Express Configuration
dreadnode.configure(function() {
  dreadnode.set("views", __dirname+"/views");
  dreadnode.use(connect.bodyDecoder());
  dreadnode.use(connect.methodOverride());
  dreadnode.use(dreadnode.router);
  dreadnode.use(connect.staticProvider(__dirname+"/public"));
});

// Express Routes
dreadnode.get("/", function(req, res) {
  res.render("index.jade", {
    locals: {
      title: "HMS Dreadnode"
    }
  });
});
dreadnode.get("/game", function(req, res) {
  res.render("game.jade", {
    locals: {
      title: "HMS Dreadnode"
    }
  });
});

// Game Manager
var manager = gm.createGameManager();


// Utility Objects
var response = {
  type: "response",
  msg: "Your message was garbage"
};

var messenger = {
  shot : function(clientId, msg) {
    return msg;
  }
};

// Socket.IO
var io = io.listen(dreadnode);
io.on("connection", function(client) {

  console.log("Socket.IO Client Connected");
  client.broadcast("New user connected. Welcome");

  manager.on("newuser", function () {
    userlist = {type: "userlist", msg: manager.getUsers()};
    client.send(JSON.stringify(userlist));
  });

  client.on("message", function(message) {
    console.log("Incoming message: " + sys.inspect(message));
    try {
      message = JSON.parse(message);
      if (message.type === "shot") {
        messenger[message.type](client, message.msg);
      }
      switch (message.type) {
        case "chat":
          response.msg = "Received your chat message";
          break;
        case "username":
          response.msg = "Received your username";
          // Hehehehehe.
          if(message.msg === "no") {
            response.type = "no";
            response.msg = "NOOOOOOOOOOO!";
          } else {
            var success = manager.addUser(message.msg, client);
            if (!success) {
              response.type = "error";
              response.issue = "ufail";
              response.msg = "Username taken";
            }
          }
          break;
        case "shot":
          manager.fireShot(client, message.msg);
          break;
        default:
          response.msg = "What the hell did you send?";
      }

    } catch (e) {
      console.log("Couldn't parse message: " + sys.inspect(message));
      //console.log(sys.inspect(e));
    }
    client.send(JSON.stringify(response));
  });

  client.on("disconnect", function() {
    console.log("Socket.IO Client Disconnected");
  });
});

dreadnode.listen(port);
console.log("Dreadnode server listening on :"+port);
