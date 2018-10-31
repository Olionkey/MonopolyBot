# Monopoly Discord Bot
#### Created by Olionkey, CelluloidRacer2, and ExtraFloofyWooflesIsReal

## [] Unreleased

### Added
- Finished up most of the methods that is left in playerData.js which still needs to be tested.
- Adding half of the methods that is need in the playerData.js will be adding more in the week.

### Notes
- Some methods may need some rewritting in the future, to deal with any bugs or any improvements that we may see.
- Many methods also accept multiple parameters due to *...rest*.

## [0.0.1] Working Database

### Improved
- moved around some locations of files.
- Improved !endgame/!endall, which will now look at the lobby roles rather then an array which reset when the bot does.

### Added
- working database now. Not fully implemented but players can now be adding by id, and will be checked by id and user id
- !start will now make the lobby for the users part of that game, and restrict it to only them.
- !endgame ${lobby-id} will now delete that role for the server.
- !endall will now delete all current roles given to player.
- Players will now be added to a game library when they start the game.
- The game has awoken and has the sky ( the night at least ).
- Have added functionality to start a lobby, and to join the lobby.
- Also have added the functionality to roll the dice.
- Added ./presistant_data/ which is storing the MonopolyCards.json , and the guildUUIDtemplate.json
