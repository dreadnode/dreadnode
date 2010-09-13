/**
 * Game Manager
 */


/*-----------------------------------------------
 Dependencies
 -----------------------------------------------*/
var sys    = require('sys'),
    events = require('events');

require.paths.unshift(__dirname);

var Game   = require('game');


/*-----------------------------------------------
 Game Manager Exports
 -----------------------------------------------*/
exports.GameManager = GameManager;
exports.createGameManager = function(options) {
  return new GameManager(options);
};

// exported for testing only
exports._Player = Player;


/*-----------------------------------------------
 Game Manager Implementation
 -----------------------------------------------*/
function GameManager(options) {
  this.usernames = [];
  this.games = [];
  this.connections = {};

  // listeners
  this.addListener('newuser', function () {
    console.log('newuser', sys.inspect(this.getUsers()));
  });
}
GameManager.prototype = new events.EventEmitter();
GameManager.prototype.constructor = GameManager;

GameManager.prototype.getCurrentGame = function() {
  var manager = this;

  // Grab the current game or create it if
  // it doesn't exist
  var existingGame;
  if (this.games.length === 0) {
    existingGame = new Game();

    // Add an event listener for a new user
    manager.on("newuser", function(connection) {

      // If this game doesn't contain the new player, we're done
      if (!existingGame.containsPlayerWithName(connection.username)) {
        return;
      }

      // Create the list of users in this game
      var userlist = [];
      existingGame.players.forEach(function(element) {
        userlist.push(element.username);
      });

      // Send all users in the game the updated userlist
      userlist.forEach(function(currentUsername) {
        var client = manager.connections[currentUsername].client;
        userlistmsg = { type: "userlist", msg: userlist };
        client.send(JSON.stringify(userlistmsg));
      });
    });

    this.addGame(existingGame);
  } else {
    existingGame = this.games[0];
  }
  return existingGame;
};

GameManager.prototype.addUser = function(client, username) {
  // Check if username is already in use
  if (this.usernames.indexOf(username) !== -1) {
    return {success: false, reason: "User exists"};
  }

  var existingGame = this.getCurrentGame();
  // Is the game in progress?
  if (existingGame.started) {
    return {success: false, reason: "Game in progress"};
  }

  // Is the game full?
  if (existingGame.isFull()) {
    return {success: false, reason: "Game is full"};
  }

  this.usernames.push(username);
  var player = new Player(username, existingGame);
  existingGame.addPlayer(player);

  var connection = new Connection(client, player);
  this.connections[client.sessionId] = connection;
  this.connections[username] = connection;
  this.emit("newuser", connection);

  return {success: true};
};

GameManager.prototype.removeUser = function(client) {
  var manager = this;
  var clientConnection = manager.connections[client.sessionId];

  // Check to see if this user is even in the cache
  // if not, there's nothing to do
  if (!clientConnection) {
    console.log("Removed a user that hasn't authenticated.");
    return;
  }

  var game = clientConnection.game;
  var player = clientConnection.player;

  // Remove the player from the connections cache
  delete manager.connections[client.sessionId];
  delete manager.connections[player.username];

  var pindex = game.players.indexOf(player);
  if (pindex === -1) {
    // Something weird happened
    console.log("ATTEMPTING TO REMOVE USER THAT ISN'T IN GAME!");
    return;
  }
  game.players.splice(pindex, 1);

  // Send out the new userlist
  // Create the list of users in this game
  var userlist = [];
  game.players.forEach(function(element) {
    userlist.push(element.username);
  });

  // Send all users in the game the updated userlist
  userlist.forEach(function(currentUsername) {
    var client = manager.connections[currentUsername].client;
    userlistmsg = { type: "userlist", msg: userlist };
    client.send(JSON.stringify(userlistmsg));
  });

  // If game is not in progress, check to see if it's
  // ready to start
  if (game.started === false) {

    var isAllRemainingPlayersReady = true;
    game.players.forEach(function(element) {
      if (element.ready === false) {
        isAllRemainingPlayersReady = false;
      }
    });

    if (isAllRemainingPlayersReady && game.players.length > 1) {
      // TODO: Alert all players in the game that
      // game can start and assign first player
      console.log("Player that left was holding up game. Starting...");

      // Send the 'gamestart' message to the team
      var startGameMsg = {type: "gamestart", msg: "FRUIT!!!"};
      game.players.forEach(function(element) {
        console.log("Alerting " + element.username + " game is starting");
        game.started = true;
        var aConnection = manager.connections[element.username];
        aConnection.client.send(JSON.stringify(startGameMsg));
      });

      // Send the first player a 'yourturn' message
      console.log("Determining first player...");
      var nextPlayer = game.getNextPlayer();
      console.log("First player will be: " + nextPlayer.username);
      var nextPlayerConnection = manager.connections[nextPlayer.username];
      var yourTurnMsg = {type: "yourturn",
        msg: "It's your turn " + nextPlayer.username};

      nextPlayerConnection.client.send(JSON.stringify(yourTurnMsg));
    }
  }
};

GameManager.prototype.getUsers = function() {
  return this.usernames;
};

GameManager.prototype.addGame = function(game) {
  this.games.push(game);
  game.emit("newgame");
};

/*
 * NOTE: We emit the winner event first here, since the next
 * statement removes the reference to the game.
 */
GameManager.prototype.gameOver = function(game) {
  game.emit("winner");
  this.games.splice(this.games.indexOf(game), 1);
};

GameManager.prototype.fireShot = function(client, shotLocation) {
  manager = this;
  // TODO: remove this when this function is implemented
  console.log("Aye, aye, captain. Firing on " + shotLocation + "...");

  var connection = manager.connections[client.sessionId];
  var game = connection.game;

  // Get the list of all OTHER players that AREN'T destroyed
  var otherPlayers = game.players.filter(function(player) {
    return ((connection.username !== player.username) &&
        (player.destroyed() === false));
  });

  var isShotMissed = true;
  var isAllOtherPlayersDestroyed = true;

  console.log("Number of other players still alive: " + otherPlayers.length);

  otherPlayers.forEach(function(player) {
    console.log("Checking player: " + player.username);
    // Was the player hit?
    if (player.ships.hasOwnProperty(shotLocation)) {

      //  Keep track that there was a hit
      isShotMissed = false;

      // Send 'ouch' location to client
      console.log("Player " + player.username + " was hit at " + shotLocation);
      player.ships[shotLocation] = true;
      var client = manager.connections[player.username].client;
      var ouchMsg = {type: "ouch", msg: shotLocation};
      client.send(JSON.stringify(ouchMsg));

      // Was the player destroyed?
      if (player.destroyed()) {
        // TODO: let user know they are destroyed
        // maybe remove them from the list of players?
        console.log("Player " + player.username + " was destroyed");
        var destroyMsg = {type: "destroyed", msg: "Sorry. You died"};
        client.send(JSON.stringify(destroyMsg));

      } else {

        // If any players are still alive, the game isn't
        // over yet...
        isAllOtherPlayersDestroyed = false;
      }

      // TODO: send shot location to all OTHER clients
      // to notify them of the hit
      game.players.forEach(function(otherPlayer) {
        if (otherPlayer.username !== player.username) {
          // Send hit location to client
          console.log("Alerting " + otherPlayer.username + " damage occurred at " + shotLocation);
          var aClient = manager.connections[otherPlayer.username].client;
          var hitMsg = {type: "hit", msg: shotLocation};
          aClient.send(JSON.stringify(hitMsg));
        }
      });
    } else {

      // If any players are still alive, the game isn't
      // over yet...
      isAllOtherPlayersDestroyed = false;
    }
  });

  // If the shot missed entirely, respond with a miss message
  if (isShotMissed) {
    var missMsg = {type: "miss", msg: shotLocation};
    client.send(JSON.stringify(missMsg));
  }

  // Is the game over??
  if (isAllOtherPlayersDestroyed) {
    console.log("Game over, " + connection.username + " wins!");
    var winMsg = {type: "win", msg: "YOU WIN!!!!"};
    client.send(JSON.stringify(winMsg));
    manager.gameOver(game);
    return;
  }

  // Advance player turn and notify next player
  // their turn has begun...
  var nextPlayer = game.getNextPlayer();
  console.log("Shot complete, passing turn to " + nextPlayer.username);
  var nextPlayerConnection = manager.connections[nextPlayer.username];
  var yourTurnMsg = {
    type: "yourturn",
    msg: "It's your turn " + nextPlayer.username
  };

  nextPlayerConnection.client.send(JSON.stringify(yourTurnMsg));
};

GameManager.prototype.placeShips = function(client, locations) {
  var manager = this;
  var ships = manager.connections[client.sessionId].player.ships;
  var row_names = "ABCDEFGHIJKLMNO".split("");
  var game = manager.connections[client.sessionId].game;

  // Need to massage locations into the format I need...
  var myLocations = [];
  for (var shipType in locations) {
    var currentShip = locations[shipType];
    var currentShipTopLeft = currentShip["top_left"];
    var currentShipBottomRight = currentShip["bottom_right"];
    myLocations.push({top_left: currentShipTopLeft["row_name"] + ":" + currentShipTopLeft["col"],
      bottom_right: currentShipBottomRight["row_name"] + ":" + currentShipBottomRight["col"]});
  }

  myLocations.forEach(function(location) {
    var topLeftRowColumn = location.top_left.split(":");
    var bottomRightRowColumn = location.bottom_right.split(":");
    var topLeftRow = topLeftRowColumn[0];
    var topLeftColumn = topLeftRowColumn[1];
    var bottomRightRow = bottomRightRowColumn[0];
    var bottomRightColumn = bottomRightRowColumn[1];

    for (var i = row_names.indexOf(topLeftRow); i <= row_names.indexOf(bottomRightRow); i++) {
      for (var j = parseInt(topLeftColumn); j <= parseInt(bottomRightColumn); j++) {
        var occupiedLocation = row_names[i] + ":" + j;
        ships[occupiedLocation] = false;
      }
    }
  });

  // This player is now ready
  manager.connections[client.sessionId].player.ready = true;
  console.log("Sending readyack/player status message to " + manager.connections[client.sessionId].player.username);

  // Accumulate the status of all players
  var playerReadiness = {};
  game.players.forEach(function(element) {
    playerReadiness[element.username] = element.ready;
  });

  // Broadcast the message to all game participants
  var readyAckMsg = {type: "status", msg: playerReadiness};
  game.players.forEach(function(element) {
    var aClient = manager.connections[element.username].client;
    aClient.send(JSON.stringify(readyAckMsg));
  });

  // Is everyone in the game ready?
  var everyoneReady = true;
  game.players.forEach(function(element) {
    if (element.ready === false) {
      console.log("Not everyone is ready yet...");
      everyoneReady = false;
    }
  });

  // If not everyone is ready, we're done here
  if (!everyoneReady || game.players.length === 1) {
    console.log("Not everyone is ready, or there is only one player");
    return;
  }

  // Everyone is ready, start the game already!
  console.log("Everyone is ready, start the friggin' game!");

  // Send the 'gamestart' message to the team
  var startGameMsg = {type: "gamestart", msg: "FRUIT!!!"};
  game.players.forEach(function(element) {
    console.log("Alerting " + element.username + " game is starting");
    game.started = true;
    var aConnection = manager.connections[element.username];
    aConnection.client.send(JSON.stringify(startGameMsg));
  });

  // Send the first player a 'yourturn' message
  console.log("Determining first player...");
  var nextPlayer = game.getNextPlayer();
  console.log("First player will be: " + nextPlayer.username);
  var nextPlayerConnection = manager.connections[nextPlayer.username];
  var yourTurnMsg = {type: "yourturn",
    msg: "It's your turn " + nextPlayer.username};

  nextPlayerConnection.client.send(JSON.stringify(yourTurnMsg));
};


/*-----------------------------------------------
 Player Implementation
 -----------------------------------------------*/

function Player(username, game) {
  this.username = username;
  this.game = game;
  this.board = new Board();
  this.hitboard = new Board();
  this.ships = {};
  this.ready = false;

  var destroyed = false;
}
Player.prototype = new events.EventEmitter();

Object.defineProperty(Player, 'destroyed', {
  get: function() {
    var player = this;
    // return cached destroyed state if destroyed
    if (player.destroyed) return true;
    // If ANY ship location is undamaged,
    // then the player is NOT destroyed
    for (var location in this.ships) {
      if (this.ships[location] === false) {
        return false;
      }
    }
    // you're toast
    player.destroyed = true;
    return true;
  }
});


/*-----------------------------------------------
 Board Implementation
 -----------------------------------------------*/

function Board() {
}
Board.prototype = new events.EventEmitter();


/*-----------------------------------------------
 Connection Implementation
 -----------------------------------------------*/

function Connection(client, player) {
  var client = client;
  var player = player;

  this.__defineGetter__("client", function() { return client });
  this.__defineGetter__("player", function() { return player });
  this.__defineGetter__("id", function() { return client.sessionId });
  this.__defineGetter__("username", function() { return player.username });
  this.__defineGetter__("game", function() { return player.game });
}
