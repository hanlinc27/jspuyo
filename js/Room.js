'use strict';

const roomIds = new Set();		// Set of roomIds currently in use
const roomIdToRoom = new Map();
const idToRoomId = new Map();

class Room {
	constructor(members, roomSize, settingsString, roomType = 'default') {
		this.roomId = generateRoomId(6);
		this.roomSize = (roomSize > 16) ? 16 : (roomSize < 1) ? 1 : roomSize;	// clamp between 1 and 16
		this.settingsString = settingsString;
		this.members = members;
		this.roomType = roomType;
		this.quickPlayTimer = null;		// Only used if roomType is 'ffa'

		this.started = false;
		this.paused = [];
		this.spectating = new Map();
		this.timeout = null;

		switch(this.roomType) {
			case 'ffa':
				Room.defaultQueueRoomId = this.roomId;
				break;
			case 'ranked':
				Room.rankedRoomId = this.roomId;
				break;
		}

		this.members.forEach((player, gameId) => {
			idToRoomId.set(gameId, this.roomId);

			// Send update to all players
			if(gameId > 0) {
				player.socket.emit('roomUpdate', this.roomId, Array.from(this.members.keys()), this.roomSize, this.settingsString, this.roomType === 'ffa');
				player.socket.join(this.roomId);
			}
		});
		console.log(`Creating room ${this.roomId} with gameIds: ${JSON.stringify(Array.from(this.members.keys()))}`);
	}

	/**
	 * Adds a player to an existing room. Returns the new room size. Throws an error if the room cannot be joined.
	 */
	join(gameId, socket) {
		if(this.members.size === this.roomSize) {
			throw new Error(`The room you are trying to join (id ${this.roomId}) is already full.`);
		}
		else if(this.started) {
			throw new Error(`The room you are trying to join (id ${this.roomId}) has already started a game.`);
		}

		this.members.set(gameId, { socket, frames: 0 });
		idToRoomId.set(gameId, this.roomId);
		socket.join(this.roomId);
		console.log(`Added gameId ${gameId} to room ${this.roomId}`);

		// Room is full
		if(this.members.size === this.roomSize && this.roomType !== 'ffa') {
			this.start();
		}
		// Room is not full yet - send progress update to all members who are not CPUs
		else {
			// Dynamic allocation of size for FFA matches (even if it might be full)
			if(this.roomType === 'ffa') {
				this.roomSize++;
			}
			this.members.forEach((player, id) => {
				if(id > 0) {
					player.socket.emit('roomUpdate', this.roomId, Array.from(this.members.keys()), this.roomSize, this.settingsString, this.roomType === 'ffa');
				}
			});
		}
	}

	/**
	 * Spectates a room (receives player data but does not play).
	 */
	spectate(gameId, socket) {
		if(this.members.has(gameId)) {
			this.members.delete(gameId);
		}
		else {
			socket.join(this.roomId);
			idToRoomId.set(gameId, this.roomId);
			socket.emit('spectate', this.roomId, Array.from(this.members.keys()), this.settingsString);
		}
		this.spectating.set(gameId, socket);
	}

	/**
	 * Starts a room by sending a 'start' event to all sockets.
	 */
	start() {
		const allIds = Array.from(this.members.keys());

		this.members.forEach((player, gameId) => {
			// Send start to all members who are not CPUs
			if(gameId > 0) {
				const opponentIds = allIds.filter(id => id > 0 && id !== gameId);
				const cpus = allIds.filter(id => id < 0).map(cpuId => {
					// Add the gameId to the cpu object
					const cpu = this.members.get(cpuId);
					cpu.gameId = cpuId;
					return cpu;
				});
				player.socket.emit('start', this.roomId, opponentIds, cpus, this.settingsString);
			}
		});

		switch(this.roomType) {
			case 'ffa':
				this.quickPlayTimer = null;
				Room.defaultQueueRoomId = null;
				break;
			case 'ranked':
				Room.rankedRoomId = null;
				break;
		}

		console.log(`Started room ${this.roomId}`);
		this.started = true;
	}

	/**
	 * Removes a player from a room (if possible).
	 */
	leave(gameId) {
		if(this.roomType === 'cpu' && gameId > 0 && this.members.has(gameId)) {
			console.log(`Ending CPU game ${this.roomId} due to player disconnect.`);

			this.end();		// Since only games with 1 player and the rest CPU are supported, the game must end on player disconnect.
		}
		else {
			if(this.spectating.has(gameId)) {
				const socket = this.spectating.get(gameId);
				socket.leave(this.roomId);
				idToRoomId.delete(gameId);
				console.log(`Removed spectator ${gameId} from room ${this.roomId}`);
				return;
			}

			const socket = this.members.get(gameId).socket;
			socket.leave(this.roomId);		// Remove the socket from the room

			// Remove player from maps
			this.members.delete(gameId);
			if(this.paused.includes(gameId)) {
				this.paused.splice(this.paused.indexOf(gameId), 1);
			}
			idToRoomId.delete(gameId);

			console.log(`Removed ${gameId} from room ${this.roomId}`);

			// Disconnect the CPU socket, since they leave due to game over
			if(gameId < 0) {
				socket.disconnect();
				return;
			}

			// Game has started, so need to emit disconnect event to all members
			if(this.started) {
				this.members.forEach((player, id) => {
					if(id > 0) {
						player.socket.emit('playerDisconnect', gameId);
					}
				});
			}
			// Game is waiting or in queue, so send update to all members
			else {
				this.members.forEach((player, id) => {
					if(id > 0) {
						player.socket.emit('roomUpdate', this.roomId, Array.from(this.members.keys()), this.roomSize, this.settingsString, this.roomType === 'ffa');
					}
				});

				// Cancel start if not enough players
				if(this.roomType === 'ffa' && this.members.size < 2 && this.quickPlayTimer !== null) {
					clearTimeout(this.quickPlayTimer);
					this.quickPlayTimer = null;
					console.log('Cancelled start. Not enough players.');
				}

				// Close custom room if it is empty
				if(this.members.size === 0 && this.roomType === 'default') {
					roomIdToRoom.delete(this.roomId);
					roomIds.delete(this.roomId);
					console.log(`Closed room ${this.roomId} since it was empty.`);
				}
			}
		}
	}

	/**
	 * Ends the room by removing all players and the room from maps.
	 */
	end() {
		// Remove all players from the room
		this.members.forEach((player, id) => {
			idToRoomId.delete(id);

			// Disconnect the CPU sockets
			if(id < 0) {
				player.socket.disconnect();
			}
			// Remove the player sockets from the room
			else {
				player.socket.leave(this.roomId);
			}
		});

		// Clear room entry
		roomIdToRoom.delete(this.roomId);
		roomIds.delete(this.roomId);
	}

	/* ------------------------------ Helper Methods (RoomManager) ------------------------------*/

	static createRoom(members, roomSize, settingsString, roomType = 'default') {
		const room = new Room(members, roomSize, settingsString, roomType);
		roomIdToRoom.set(room.roomId, room);
		return room;
	}

	static joinRoom(gameId, roomId, socket) {
		const room = roomIdToRoom.get(roomId);
		if(room === undefined) {
			throw new Error(`The room you are trying to join (id ${roomId}) does not exist.`);
		}
		room.join(gameId, socket);
		return room;
	}

	static spectateRoom(gameId, socket, roomId = null) {
		const room = (roomId === null) ? roomIdToRoom.get(idToRoomId.get(gameId)) : roomIdToRoom.get(roomId);
		if(room === undefined) {
			socket.emit('spectateFailure', 'The room you are trying to join does not exist or has ended.');
			return;
		}
		room.spectate(gameId, socket);
		return room;
	}

	static startRoom(roomId) {
		const room = roomIdToRoom.get(roomId);
		room.start();
		return room;
	}

	static leaveRoom(gameId, roomId = null) {
		// The old roomId is explicitly provided when force disconnecting from a room, since joining happens faster than leaving
		const room = (roomId === null) ? roomIdToRoom.get(idToRoomId.get(gameId)) : roomIdToRoom.get(roomId);

		if(room === undefined) {
			console.log(`Attempted to remove ${gameId}, but they were not in a room.`);
			return;
		}
		room.leave(gameId);
		return room;
	}

	/**
	 * Returns a list of room ids excluding the one the player is already part of.
	 */
	static getAllRooms(gameId) {
		return Array.from(roomIds).filter(id => {
			const room = roomIdToRoom.get(id);
			return room.started && !room.members.has(gameId);
		});
	}

	/**
	 * Returns a list of the players in the room, if the room is valid.
	 */
	static getPlayers(roomId) {
		const room = roomIdToRoom.get(roomId);

		if(room === undefined || !room.started) {
			return [];
		}
		return Array.from(room.members.keys());
	}

	static cpuAssign(gameId, socket) {
		const room = roomIdToRoom.get(idToRoomId.get(gameId));

		// Assign the socket to the CPU player in the room
		room.members.get(gameId).socket = socket;
		socket.join(room.roomId);
	}

	static disconnectAll(roomId) {
		const room = roomIdToRoom.get(roomId);

		// Game has already been ended (usually caused by leaving a CPU game)
		if(room === undefined) {
			console.log(`ERROR: Received game end signal from non-existent room ${roomId}.`);
			return;
		}

		room.end();
		console.log(`Ended game with room id ${room.roomId}`);
	}

	static getRoomIdFromId(gameId) {
		return idToRoomId.get(gameId);
	}

	// clunky. try to remove if possible
	static getRoomFromId(gameId) {
		return roomIdToRoom.get(idToRoomId.get(gameId));
	}
}

const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateRoomId(length = 6) {
	let result;
	do {
		result = '';
		for (let i = 0; i < length; i++) {
			result += validChars.charAt(Math.floor(Math.random() * validChars.length));
		}
	}
	while(roomIds.has(result));

	roomIds.add(result);
	return result;
}

Room.defaultQueueRoomId = null;
Room.rankedRoomId = null;

module.exports = { Room };
