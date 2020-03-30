'use strict';

(function () {
	const socket = window.io();
	let game, gameId;
	const cpu = location.search.includes('cpu=true');				// Flag to play against a CPU
	const noPlayer = location.search.includes('player=false');		// Flag to let CPU play for you
	let cpuGames = [];

	let gameInfo = { gameId: null, cpu, settingsString: new window.Settings().toString() };

	socket.emit('register');

	socket.on('getGameId', id => {
		gameId = id;
		gameInfo.gameId = id;
		socket.emit('findOpponent', gameInfo);
		console.log('Awaiting match...');
	});

	socket.on('start', (opponentIds, settingsString) => {
		console.log('gameId: ' + gameId + ' opponents: ' + JSON.stringify(opponentIds));

		if(noPlayer) {
			game = new window.CpuGame(gameId, opponentIds, socket, 1, new window.TestCpu(), window.Settings.fromString(settingsString));
		}
		else {
			game = new window.PlayerGame(gameId, opponentIds, socket, window.Settings.fromString(settingsString), new window.UserSettings());
		}

		let boardDrawerCounter = 2;
		const allIds = opponentIds.slice();
		allIds.push(gameId);

		// Create the CPU games
		cpuGames = opponentIds.filter(id => id < 0).map(id => {
			const thisSocket = window.io();
			const thisOppIds = allIds.slice();
			thisOppIds.splice(allIds.indexOf(id), 1);

			const thisGame = new window.CpuGame(id, thisOppIds, thisSocket, boardDrawerCounter, new window.TestCpu(), window.Settings.fromString(settingsString));
			boardDrawerCounter++;
			return { game: thisGame, socket: thisSocket, id };
		});
		main();
	});

	let finalMessage = null;		// The message to be displayed

	function main() {
		const mainFrame = window.requestAnimationFrame(main);
		game.step();
		cpuGames.forEach(cpuGame => cpuGame.game.step());
		if(finalMessage !== null) {
			window.cancelAnimationFrame(mainFrame);
			console.log(finalMessage);
		}
		const endResult = game.end();
		if(endResult !== null) {
			switch(endResult) {
				case 'Win':
					finalMessage = 'You win!';
					break;
				case 'Loss':
					finalMessage = 'You lose...';
					socket.emit('gameOver', gameId);
					break;
				case 'OppDisconnect':
					finalMessage = 'Your opponent has disconnected. This match will be counted as a win.';
					break;
			}
		}

		cpuGames.forEach(cpuGame => {
			const cpuEndResult = cpuGame.game.end();
			if(cpuEndResult !== null) {
				switch(cpuEndResult) {
					case 'Win':
						// finalMessage = 'You win!';
						break;
					case 'Loss':
						// finalMessage = 'You lose...';
						cpuGame.socket.emit('gameOver', cpuGame.id);
						break;
					case 'OppDisconnect':
						// finalMessage = 'Your opponent has disconnected. This match will be counted as a win.';
						break;
				}
			}
		});
	}
})();
