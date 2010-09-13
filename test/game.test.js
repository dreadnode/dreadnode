var Game = require("../lib/game");

exports['Game definition'] = function(assert) {
  assert.isDefined( Game, "Game Object");

  var game = new Game();
  assert.isDefined( game, "Game Instance");
  console.log('game.name: ', game.name);
  console.log(Object.defineProperty);
  assert.isDefined( game.name, "Game.name");
  assert.isDefined( game.started, "Game.name");

  // initialized state
  assert.eql( true, (game.name.length > 0), "game.length");
  assert.eql( false, game.started, "game.started");
};