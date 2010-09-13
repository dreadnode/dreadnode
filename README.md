# Dreadnode #

The Classic Titanic Rock 'Em Sock 'Em Ship Battle Game.
*"You sank my... Titanic!"*

Dreadnode is an implementation of the classic boat battle game with a few new tricks. Play against 4 other players and try to survive the naval battle! Go grab some friends and play against them right now!

Place your 6 ships -- life raft (1), tugboat (2), pirate ship (3), submarine (4), warship (5), and titanic (10) -- and then fire away at your opponents' ships. While dragging your pieces, press "r" to rotate them.

Functional in latest version of all major browsers. Best "design" experience is in Chrome, Safari, FF, and Opera. :)


# Team #

* Daniel Shaw [@dshaw](http://twitter.com/dshaw)
* Ricky Hussmann [@rhussmann](http://twitter.com/rhussmann)
* Kyle Simpson [@getify](http://twitter.com/getify)
* Christopher Schmitt [@teleject](http://twitter.com/teleject)

* Dreadnode on Twitter [@dreadnode](http://twitter/dreadnode)
* 2010 Node Knockout team page [HMS Dreadnode](http://nodeknockout.com/teams/hms-dreadnode)


## Notes ##

"Rules" page broke on final deploy, that's why it goes to a blank screen. You don't need the rules anyway, though, it's "Battleship!"

Must have 5 players connected for game to start.

All players in the game can see a "hit" (red peg), but only the player who fired the shot can see a "miss" (white peg).

Since all your opponents may overlap and occupy the same grid locations, a hit can get one or more of your opponents' ships at the same time.


## To-do ##

- Timer for turns and game
- Infinite multiple games at the same time
- "Computer" players
- Scoring/Leaderboard

## Dependencies ##

npm install express socket.io expresso


## Licence ##

MIT