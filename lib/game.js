/**
 * Game.js - Defines a Game instance.
 */


/*-----------------------------------------------
 Dependencies
 -----------------------------------------------*/
var sys         = require('sys'),
    events      = require('events');

require.paths.unshift(__dirname);

var GameManager = require('gamemanager').GameManager ;
    mix         = require('util').mix;


/*-----------------------------------------------
 Game Implementation
 -----------------------------------------------*/

var Game = module.exports = function Game(options) {
  var game = this;

  this.options = mix({
    gm: new GameManager(),
    name: Game.battleNames[Math.floor(Math.random() * Game.battleNames.length)],
    maxPlayers: 3
  }, options || {});

  this.gm = this.options.gm;
  this.maxPlayers = this.options.maxPlayers;
  this.name = this.options.name;

  this.players = [];
  this.currentPlayer = 0;

  this.createdTime = +new Date;
  this.started = false;
  this.gameOver = false;

  // listeners
  this.addListener("start", function () {
    console.log(game.name + " game started");
    game.started = true;
    game.startTime = +new Date;
  });
  this.addListener("gameover", function () {
    console.log(game.name + " game has completed");
    game.gameOver = true;
    game.endTime = +new Date;
  });
};
Game.prototype = new events.EventEmitter();
Game.prototype.constructor = Game;

Game.prototype.broadcast = function(data){
  this.players.forEach(function(player){
    this.gm.socket.send(player.io_id, data);
  });
};

Game.prototype.isFull = function () {
  return this.players.length >= this.maxPlayers;
};

Game.prototype.addPlayer = function (player) {
  this.players.push(player);
};

Game.prototype.getNextPlayer = function() {
  // Loop through players until we find the next one
  // that is not already destroyed
  do {
    this.currentPlayer = (++(this.currentPlayer)) % this.players.length;
  } while (this.players[this.currentPlayer].destroyed());

  return this.players[this.currentPlayer];
};

// Returns whether the player name exists in the game
// instance
Game.prototype.containsPlayerWithName = function(name) {
  var filteredPlayers = this.players.filter(function(element) {
    return element.username === name;
  });
  return filteredPlayers.length !== 0;
};

Game.battleNames = [
  "Pillows on the Water",
  "Noooooooooooooooo!",
  "Steve's Got a Chainsaw, but I'm on a Boat"
];
