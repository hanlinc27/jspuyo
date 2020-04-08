'use strict';

window.Cpu = class Cpu {
	constructor(settings) {
		if(this.constructor === Cpu) {
			throw new Error('Abstract class cannot be instatiated.');
		}
		this.settings = settings;
	}

	assignSettings(settings) {
		this.settings = settings;
	}

	/**
	 * Returns the optimal move according to the AI.
	 */
	/* eslint-disable-next-line no-unused-vars*/
	getMove(boardState, currentDrop) {
		throw new Error('getMove(boardState, currentDrop) must be implemented by the subclass.');
	}

	getAverageHeight(boardState) {
		return boardState.reduce((sum, col) => sum += col.length, 0) / this.settings.cols;
	}

	/**
	 * Returns the best column placement with either 0 or 2 rotations that makes a chain longer than minChain.
	 * If none exist, returns -1.
	 */
	checkForSimpleChains(boardState, currentDrop, minChain) {
		let runningMaxChain = minChain;
		let col = -1;
		for(let i = 0; i < this.settings.cols * 2; i++) {
			const currCol = Math.floor(i / 2);
			const board = new window.Board(this.settings, boardState);
			if(i % 2 === 0) {
				board.boardState[currCol].push(currentDrop.colours[0]);
				board.boardState[currCol].push(currentDrop.colours[1]);
			}
			else {
				board.boardState[currCol].push(currentDrop.colours[1]);
				board.boardState[currCol].push(currentDrop.colours[0]);
			}

			const chains = board.resolveChains();
			if(chains.length > runningMaxChain) {
				runningMaxChain = chains.length;
				col = currCol;
			}
		}
		return col;
	}

	/**
	 * Returns the move that results in the best chain longer than minChain.
	 * If none exist, returns { col: -1, rotations: -1 };
	 */
	checkForAllChains(boardState, currentDrop, minChain) {
		let runningMaxChain = minChain;
		let col = -1;
		let rotations = -1;
		for(let i = 0; i < this.settings.cols * 4; i++) {
			const currCol = i % this.settings.cols;
			const board = new window.Board(this.settings, boardState);
			let tempRotations;
			if(i < this.settings.cols) {
				board.boardState[currCol].push(currentDrop.colours[1]);
				board.boardState[currCol].push(currentDrop.colours[0]);
				tempRotations = 2;
			}
			else if(i < this.settings.cols * 2) {
				if(currCol === 0) {
					continue;
				}
				board.boardState[currCol - 1].push(currentDrop.colours[0]);
				board.boardState[currCol].push(currentDrop.colours[1]);
				tempRotations = -1;
			}
			else if(i < this.settings.cols * 3) {
				if(currCol === this.settings.cols - 1) {
					continue;
				}
				board.boardState[currCol].push(currentDrop.colours[0]);
				board.boardState[currCol + 1].push(currentDrop.colours[1]);
				tempRotations = 1;
			}
			else {
				board.boardState[currCol].push(currentDrop.colours[0]);
				board.boardState[currCol].push(currentDrop.colours[1]);
				tempRotations = 0;
			}

			const chains = board.resolveChains();
			if(chains.length > runningMaxChain) {
				runningMaxChain = chains.length;
				col = currCol;
				rotations = tempRotations;
			}
		}
		return { col, rotations };
	}

	static fromString(ai, settings) {
		switch(ai) {
			case 'Random':
				return new window.RandomCpu(settings);
			case 'Flat':
				return new window.FlatCpu(settings);
			case 'Tall':
				return new window.TallCpu(settings);
			case 'Chain':
				return new window.ChainCpu(settings);
			default:
				return new window.TestCpu(settings);
		}
	}
}


/**
 * RandomCpu: Completely random moves.
 */
window.RandomCpu = class RandomCpu extends window.Cpu {
	constructor(settings) {
		super(settings);
	}

	// eslint-disable-next-line no-unused-vars
	getMove(boardState, currentDrop) {
		let col = Math.floor(Math.random() * this.settings.cols);
		let rotations = Math.floor(Math.random() * 4) - 2;
		return { col, rotations };
	}
}

/**
 * FlatCpu: stacks horizontally
 */
window.FlatCpu = class FlatCpu extends window.Cpu {
	constructor(settings) {
		super(settings);
	}

	getMove(boardState, currentDrop) {
		let col = 0;
		let rotations = 0;
		let minHeight = -1;
		for(let i = 0; i < this.settings.cols - 1; i++) {
			if(boardState[i].length < minHeight) {
				minHeight = boardState[i].length;
				col = i;
			}
		}

		col = super.checkForSimpleChains(boardState, currentDrop, 0);

		return { col, rotations };
	}
}

/**
 * TallCpu: stacks the right side, then the left side
 */
window.TallCpu = class TallCpu extends window.Cpu {
	constructor(settings) {
		super(settings);
	}

	getMove(boardState, currentDrop) {
		let col = this.settings.cols - 1;
		let rotations = 0;
		// Attempt to place on the right side of the board
		while(boardState[col].length >= this.settings.rows - 1 && col > 2) {
			col--;
		}
		// Attempt to place on the left side of the board
		if(col === 2) {
			col = 0;
			while(boardState[col].length >= this.settings.rows - 1 && col < 2) {
				col++;
			}
		}

		// Only column 2 left
		if(col === 2) {
			const noRotationBoard = new window.Board(this.settings, boardState);
			noRotationBoard.boardState[2].push(currentDrop.colours[0]);
			noRotationBoard.boardState[2].push(currentDrop.colours[1]);
			const noRotationChains = noRotationBoard.resolveChains();

			const yesRotationBoard = new window.Board(this.settings, boardState);
			yesRotationBoard.boardState[2].push(currentDrop.colours[1]);
			yesRotationBoard.boardState[2].push(currentDrop.colours[0]);
			const yesRotationChains = yesRotationBoard.resolveChains();

			if(yesRotationChains.length > noRotationChains.length) {
				rotations = 2;
			}
		}

		return { col, rotations };
	}
}

/**
 * ChainCpu: Goes for the longest possible chain result given the current drop.
 * Otherwise, places randomly.
 */
window.ChainCpu = class ChainCpu extends window.Cpu {
	constructor(settings) {
		super(settings);
	}

	getMove(boardState, currentDrop) {
		let col = Math.floor(Math.random() * this.settings.cols);
		let rotations = 0;

		// Deter against random placements in column 2 (when 0-indexed)
		while(col === 2) {
			col = Math.floor(Math.random() * this.settings.cols);
		}

		col = super.checkForSimpleChains(boardState, currentDrop, 1);

		return { col, rotations };
	}
}

/**
 * TestCpu: ChainCPU, but instead of placing randomly it attempts to connect a colour.
 */
window.TestCpu = class TestCpu extends window.Cpu {
	constructor(settings, speed) {
		super(settings, speed);
	}

	getMove(boardState, currentDrop) {
		const averageHeight = super.getAverageHeight(boardState);
		let minChain = (averageHeight > this.settings.rows * 3 / 4) ? 0 :
							(averageHeight > this.settings.rows / 2) ? 2 :
							(averageHeight > this.settings.rows / 2) ? 3 : 4;

		let { col, rotations} = super.checkForAllChains(boardState, currentDrop, minChain);

		// Unable to find an appropriate chain
		if(col === -1) {
			let maxValue = -1;

			for(let i = 0; i < this.settings.cols * 4; i++) {
				const currCol = i % this.settings.cols;
				const board = new window.Board(this.settings, boardState);
				let tempRotations;
				if(i < this.settings.cols) {
					board.boardState[currCol].push(currentDrop.colours[1]);
					board.boardState[currCol].push(currentDrop.colours[0]);
					tempRotations = 2;
				}
				else if(i < this.settings.cols * 2) {
					if(currCol === 0) {
						continue;
					}
					board.boardState[currCol - 1].push(currentDrop.colours[1]);
					board.boardState[currCol].push(currentDrop.colours[0]);
					tempRotations = -1;
				}
				else if(i < this.settings.cols * 3) {
					if(currCol === this.settings.cols - 1) {
						continue;
					}
					board.boardState[currCol].push(currentDrop.colours[0]);
					board.boardState[currCol + 1].push(currentDrop.colours[1]);
					tempRotations = 1;
				}
				else {
					board.boardState[currCol].push(currentDrop.colours[0]);
					board.boardState[currCol].push(currentDrop.colours[1]);
					tempRotations = 0;
				}

				let deterrent = (currCol === 2) ? boardState[2].length : this.getSkyScraperValue(board, currCol);

				const value = this.evaluateBoard(board) - deterrent;

				if(value > maxValue) {
					col = currCol;
					maxValue = value;
					rotations = tempRotations;
				}
			}
		}

		// Still cannot find an appropriate placement, so place semi-randomly
		if(col === -1)  {
			const allowedCols = [0, 5];
			for(let i = 0; i < this.settings.cols; i++) {
				if(i !== 0 && i !== this.settings.cols - 1) {
					if((boardState[i].length - boardState[i-1].length) + (boardState[i].length - boardState[i+1].length) < 3) {
						allowedCols.push(i);
					}
				}
			}

			col = allowedCols[Math.floor(Math.random() * allowedCols.length)];

			// Deter against random placements in column 2 (when 0-indexed)
			if(col === 2) {
				col = Math.floor(Math.random() * this.settings.cols);
			}
		}

		return { col, rotations };
	}

	getSkyScraperValue(board, col) {
		const boardState = board.boardState;
		let value = 2 * boardState[col].length;
		if(col !== 0) {
			value -= boardState[col - 1].length;
		}
		if(col !== this.settings.cols - 1) {
			value -= boardState[col + 1].length;
		}
		return value / 2;
	}

	evaluateBoard(board) {
		const visited = [];				// List of visited locations
		let value = 0;

		/**
		 * Performs a DFS through the current board to find the extent of a colour, given a starting puyo.
		 *
		 * @param  {object} puyo        	The current puyo, given as {col: number, row: number, colour: rgba value}
		 * @param  {number} colour_length   The running length of the puyo chain.
		 * @return {object}                 The branch's result, given as {length: colour_length, puyos: chain_puyos}.
		 */
		const dfs = function(puyo, colour_length) {
			visited.push(puyo);
			const { col, row, colour } = puyo;

			// Search in all 4 cardinal directions
			for(let i = -1; i <= 1; i++) {
				for(let j = -1; j <= 1; j++) {
					const new_puyo = { col: col + i, row: row + j };

					if(Math.abs(i) + Math.abs(j) === 1 && board.validLoc(new_puyo)) {
						new_puyo.colour = board.boardState[col + i][row + j];

						// New location must be unvisited and have the same colour puyo
						if(notVisited(new_puyo) && colour === new_puyo.colour) {
							// Update with the leaf puyo of this branch
							const length = dfs(new_puyo, colour_length + 1);
							colour_length = length;
						}
					}
				}
			}
			// Done with all branches, return the findings
			return colour_length;
		}

		/**
		 * Determines if the visited array contains the passed location.
		 */
		const notVisited = function(location) {
			const { col, row } = location;
			return visited.filter(loc => loc.col === col && loc.row === row).length === 0;
		}

		// Iterate through the entire board to find all starting points
		for(let i = 0; i < board.boardState.length; i++) {
			for(let j = 0; j < board.boardState[i].length; j++) {
				const puyo = { col: i, row: j, colour: board.boardState[i][j] };

				if(notVisited(puyo) && puyo.colour !== window.PUYO_COLOURS['Gray']) {
					// Find the extent of this colour, starting here
					const length = dfs(puyo, 1, [puyo]);
					if(length < 4) {
						value += length * length;
					}
				}
			}
		}
		return value;
	}
}
