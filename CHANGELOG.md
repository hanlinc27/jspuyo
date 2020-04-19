# Changelog

## v0.5 - Better CPUs and Custom Games

### v0.5.2 (Apr 18, 2020)
[`Support more players #29`](https://github.com/WillFlame14/jspuyo/pull/29)
**New features:**
- Room size can now be customized by appending `?size=<number>` into the URL.
- Animation frames can be skipped (to improve performance) by appending `?skipFrames=<number>` to the URL. 
  - Games with large numbers of players have the default number of skipFrames increased.
- The default canvas size is now twice as large for improved resolution.

**Other changes**:
- The console log no longer indicates incoming/sent nuisance to reduce spam in rooms with large numbers of people.
- Better logging for room updates, as well as fixing of some issues.
- Both win/lose sounds now play on game end.
- Added unit tests and CI integration.
- CPUS are now slightly slower by default.

### v0.5.1 (Apr 10, 2020)
[`Custom games, improve CPU #28`](https://github.com/WillFlame14/jspuyo/pull/28)

**New features:**
- Set the speed of the CPU by appending `?speed=xxx` (measured in ms) to the URL. Higher speed means slower.
- Select the CPU's AI by appending `?ai=xxx` to the URL. Supports all currently implemented AIs.
- New Akari voice files
- The root URL will now join the default queue (1 minute wait for more players with 2 people, 15 seconds wait with 4 people)
- Join matchmaking (1v1) by appending `?ranked=true` to the URL. Currently there is no ranking system yet.
- Create a custom room by appending `createRoom=true` to the URL. A custom join link will be provided in the console.
- Join a custom room by appending `joinRoom=<joinID>` to the URL. 

**Other changes**:
- Leaving the default queue will now notify all others.
- Winning a CPU game no longer crashes the server.
- Production code is now uglified for better performance.
- Can no longer let CPU play for you due to introduction of many bugs.

### v0.5.0 (Apr 2, 2020)
[`Improve CPU AI and add voices #27`](https://github.com/WillFlame14/jspuyo/pull/27)

**New features**:
- TestCpu renamed to ChainCpu.
- A new TestCpu (now the default) was created that is much stronger.
- Added some new basic CPUs.
  - RandomCPU always does random moves.
  - FlatCpu does tara stacking.
- Voices play during chains.
- Puyo take some time to "squish" into the stack.

**Bug fixes:**
- Minor changes to tuning values.
- Bug fix for SFX during nuisance sending.
- CPUS no longer send nuisance to themselves.

## v0.4 - Basic CPUs, Score and Nuisance

### v0.4.4 (Mar 26, 2020)
[`Add all clear functionality #26`](https://github.com/WillFlame14/jspuyo/pull/26)
- The board detects when it is completely empty and will trigger an all clear.
- A sound effect will play to indicate this.
- The next chain will send an extra rock of nuisance.

### v0.4.3 (Mar 26, 2020)
[`Combine all work up to this point #25`](https://github.com/WillFlame14/jspuyo/pull/25)
- Nuisance animations now show in all cases.
- All dropping rows are now shown properly.
- Minor changes to tuning values.

### v0.4.2 (Mar 25, 2020)
[`Minor fixes #24`](https://github.com/WillFlame14/jspuyo/pull/24)
- Chains involving nuisance now correctly clear the chains+nuisance (probably).
- Active nuisance is no longer delayed by splitting drops.
- All players/CPUs now get the same drops.
- Colours are now (mostly) balanced in 128 drops.
- The first three drops now only use 3 unique colours.
- Nuisance will no longer fall on columns more than 12 puyos high.
- Puyos placed on columns that are already 13 puyos high are now deleted.
- TestCpu now avoids placing drops in column 3.

### v0.4.1 (Mar 25, 2020)
[`Add fully functional nuisance dropping animations #23`](https://github.com/WillFlame14/jspuyo/pull/23)
- Nuisance now falls instead of being instantly added to the stack.

### v0.4.0 (Mar 22, 2020)
[`Add score, nuisance, and CPUs #22`](https://github.com/WillFlame14/jspuyo/pull/22)
- Score is now calculated per chain instead of at the end.
- Soft dropping now adds to score.
- Nuisance can be sent and countered.
- Win/Lose logic implemented.
- Board hashing implemented.
- SFX for chaining and nuisance added.
- Synced sfx, score and nuisance between players.
- Added support for some basic CPUs.
  - HarpyCPU, which stacks on the right side first and then the left side.
  - TestCPU, which looks for chains and places randomly otherwise.
  - Play against a CPU by appending `?cpu=true` to the URL.
  - Let CPU play for you by appending `?player=false` to the URL. [Deprecated as of v0.5.1]
  
## v0.3 - 2 Players

### v0.3.2 (Mar 14, 2020)
[`Change opponent sync to hash streaming instead of inputs #20`](https://github.com/WillFlame14/jspuyo/pull/20)
- Rework multiplayer syncing to stream a hash of the board
  - Sending inputs ran into desyncing

### v0.3.1 (Mar 14, 2020)
[`Add score and nuisance #19`](https://github.com/WillFlame14/jspuyo/pull/19)
- Score is updated upon clearing a chain
  - Soft dropping does not add score yet.
- Nuisance sent is displayed in the console (not actually sent yet).

### v0.3.0 (Mar 9, 2020)
[`Add server side code #17`](https://github.com/WillFlame14/jspuyo/pull/17)
- Second canvas
- Input support for two players
- Synchronized inputs between players
- Moved website to Azure

## v0.2 - Chaining

### v0.2.2 (Mar 9, 2020)
[`Chain animations #15`](https://github.com/WillFlame14/jspuyo/pull/15)
- Add chain animations
- Add falling animation for split drops

### v0.2.1 (Mar 8, 2020)
[`Lock delay #14`](https://github.com/WillFlame14/jspuyo/pull/13)
- Add lock delay (100ms)
  - Lock delay can currently be infinitely abused.

### v0.2.0 (Mar 6, 2020)
[`Chaining Framework #13`](https://github.com/WillFlame14/jspuyo/pull/13)
- Basic CSS
- Added instantaneous chaining
- Added drawing capabilities for all drops
- Arle puyo now always spawns on the bottom

## v0.1 - Movement

### v0.1.2 (Mar 1, 2020)
[`Better movement #9`](https://github.com/WillFlame14/jspuyo/pull/9)
- Added DAS and ARR settings
- More intuitive behaviour when holding down left/right

### v0.1.1 (Feb 28, 2020)
[`Add rotation functionality #7`](https://github.com/WillFlame14/jspuyo/pull/7)
- Puyos can be rotated using Z and X
  - Multiple rotation events cannot be queued at the same time.
  - Basic wall and floor kicks
  - No 180 rotate yet

### v0.1.0 (Feb 26, 2020)
[`Basic input functionality #5`](https://github.com/WillFlame14/jspuyo/pull/5)
- Basic canvas
- Game over when col 2 is filled
- Stacking limit of 13 rows
- Game accepts left/right movement using arrow keys