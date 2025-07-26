import * as THREE from 'three';
import { scene, camera, controls, board } from '../modules/scene.js';
import { requestRenderIfNotRequested } from '../modules/rendering.js';
import { canvas } from '../modules/rendering.js';
import { notify, toggleGameResult } from '../modules/userInterface.js';
import { Player } from '../models/Player.js';
import { Timer } from '../models/Timer.js';
import { socketURL } from '../apiConfig.js';
import { handleTelegramError } from '../utils/handleTelegramError.js';

export class Session {
	constructor({ timeCap = null }) {
		this.statusNode = document.getElementById('gameStatus');
		this.leaveNode = document.getElementById('leaveCurrentSession');
		this.leaveNode.classList.add('visible');
		this.playerOne = new Player(board.redModelColor, timeCap);
		this.playerTwo = new Player(board.blueModelColor, timeCap);
		this.timeCap = timeCap;
		this.timer = this.timeCap ?
			new Timer(this.playerOne, this.playerTwo)
			: null;
		this.currentPlayer = this.playerOne;
		this.selectedFigure = null;
		this.isCheck = false;
		this.boundOnCanvasInteract = this.onCanvasInteract.bind(this);
	}

	startGame() {
		if (this.timer) {
			// pass endGame callback and bind it's "this" context to the session instance
			this.timer.set(this.endGame.bind(this));
		} else {
			if (this.currentPlayer.color === this.playerOne.color) {
				this.statusNode.classList.remove("blue")
				this.statusNode.classList.add("red")
			} else {
				this.statusNode.classList.remove("red")
				this.statusNode.classList.add("blue");
			}
		}

		canvas.addEventListener('click', this.boundOnCanvasInteract);
	}

	restartGame() {
		this.playerOne.timeReserve = this.timeCap;
		this.playerTwo.timeReserve = this.timeCap;
		this.currentPlayer = this.playerOne;
		this.selectedFigure = null;

		if (board.hasHihlightedCells) board.clearHighlights();

		board.reset();
		requestRenderIfNotRequested(scene, camera, controls);
		this.startGame();
	}

	onCanvasInteract(event) {
		// slow down camera rotation
		controls.autoRotateSpeed = 0.1;

		const target = this.traceTarget(event);

		if (!target) {
			if (this.selectedFigure) {
				this.dropSelection();
				requestRenderIfNotRequested(scene, camera, controls);
				return;
			}
			return;
		}

		console.warn(
			board.figures.get(target.parent.userData.id)
			// or cell if !figure
			|| target.parent.userData.maintainingObject
		);

		// prevent moves if online user is not current player
		if (this.currentPlayer.user && window.user.id !== this.currentPlayer.user.id) return;

		// prevent selecting defeated figures
		if (this.isDefeatedFigure(target)) return;

		if (!this.selectedFigure) {
			// select player's figure
			if (target.userData.isFigure && board.figures.get(target.parent.userData.id).color === this.currentPlayer.color) {
				this.selectFigure(target.parent);
			} else if (!target.userData.isFigure && target.parent.userData.maintainingObject.figure && target.parent.userData.maintainingObject.figure.color === this.currentPlayer.color) {
				// also select by cell
				this.selectFigure(target.parent.userData.maintainingObject.figure.model);
			}
		} else {
			// select another figure
			if (target.userData.isFigure && board.figures.get(target.parent.userData.id).color === this.currentPlayer.color) {
				this.dropSelection();
				this.selectFigure(target.parent);
			} else if (!target.userData.isFigure && target.parent.userData.maintainingObject.figure && target.parent.userData.maintainingObject.figure.color === this.currentPlayer.color) {
				// also select by cell
				this.dropSelection();
				this.selectFigure(target.parent.userData.maintainingObject.figure.model);
			} else {
				// move if allowed
				if (target.userData.isFigure) {
					const cell = board.getCellByCoordinates(target.parent.position.x, target.parent.position.y);
					if (!board.figures.get(this.selectedFigure.userData.id).canMove(cell, this.isCheck ? this.currentPlayer.color : null)) {
						this.dropSelection();
						return;
					}
					this.handleMove(cell);
				} else {
					if (!board.figures.get(this.selectedFigure.userData.id).canMove(target.parent.userData.maintainingObject, this.isCheck ? this.currentPlayer.color : null)) {
						this.dropSelection();
						return;
					}
					this.handleMove(target.parent.userData.maintainingObject);
				}
			}
		}

		requestRenderIfNotRequested(scene, camera, controls);
	}

	traceTarget(event) {
		let target = null;
		const mouse = new THREE.Vector2();
		mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouse, camera);

		const intersects = raycaster.intersectObjects(board.board.children, true);
		if (intersects.length > 0) {
			target = intersects[0].object;
		}

		return target;
	}

	isDefeatedFigure(target) {
		return target.userData.isFigure && board.figures.get(target.parent.userData.id).defeated;
	}

	selectFigure(figure) {
		if (board.hasHighlightedCells) board.clearHighlights();
		this.selectedFigure = figure;
		board.highlightAvailableMoves(board.figures.get(this.selectedFigure.userData.id), this.isCheck);
	}

	dropSelection() {
		this.selectedFigure = null;
		board.clearHighlights();
	}

	handleMove(targetCell) {
		const beatenFigure = board.figures.get(this.selectedFigure.userData.id).move(targetCell);

		if (this.timer) this.timer.inverseCountdown = 0;
		board.isInitialState = false;

		if (this.isCheck) {
			this.isCheck = false;
		} else {
			this.handleCheckmate();
		}

		this.dropSelection();
		this.switchPlayers();

		return beatenFigure;
	}

	switchPlayers() {
		this.currentPlayer = this.currentPlayer.color === this.playerOne.color ? this.playerTwo : this.playerOne;

		if (this.timer) {
			this.timer.switchPlayers(this.currentPlayer);
		} else {
			this.statusNode.className = this.currentPlayer.color === board.redModelColor ? "red" : "blue";
		}
	}

	handleCheckmate() {
		const color = this.currentPlayer.color === board.redModelColor ? board.blueModelColor : board.redModelColor;

		if (!board.isCheck(color)) return;

		if (board.isCheckmate(color)) {
			this.endGame(this.currentPlayer);
		} else {
			this.isCheck = true;
			notify("Check!", 3500);
		}
	}

	endGame(winner, restartAllowed = true) {
		if (this.timer) this.timer.stop();
		canvas.removeEventListener('click', this.boundOnCanvasInteract);

		if (!winner) return;

		const winnerOutput = winner.user?.username ||
			(winner.color === board.redModelColor ? 'Red' : 'Blue');

		toggleGameResult(winnerOutput, restartAllowed);
	}

	terminate() {
		this.leaveNode.classList.remove('visible');
		canvas.removeEventListener('click', this.boundOnCanvasInteract);

		if (!board.isInitialState) {
			board.reset();
			requestRenderIfNotRequested(scene, camera, controls);
		}

		if (board.hasHighlightedCells) {
			board.clearHighlights();
			requestRenderIfNotRequested(scene, camera, controls);
		}

		if (this.timer) {
			clearInterval(this.timer.interval);
			this.timer.interval = null;
			this.timer.node.style.visibility = 'hidden';
		}
		if (this.statusNode.classList.length) {
			this.statusNode.classList.remove("red");
			this.statusNode.classList.remove("blue");
		}
	}
}

export class OnlineSession extends Session {
	// set visibility false by default when implement private sessions
	constructor(playerOne, playerTwo, { id = null, timeCap = null, visibility = true }) {
		super({ timeCap });
		this.id = id;
		this.playerOne = playerOne;
		this.playerTwo = playerTwo;
		this.currentPlayer = this.playerOne;
		this.socket = null;
		this.reconnectInterval = null;
		this.sessionVisible = visibility;
		this.isStarted = false;
		this.connectWS();
	}

	connectWS() {
		this.socket = new WebSocket(socketURL);

		this.socket.onerror = (error) => {
			notify("Connection error: " + error.message, 5000);
			console.error("Socket Error: ", error.message);
		};

		// arrow function keeps "this" context of a class instance
		this.socket.onopen = (e) => {
			console.log('Connection established');
			let message;

			// connect to existing session
			if (this.id) {
				message = {
					type: 'join session',
					data: {
						sessionID: this.id,
						user
					}
				};
			} else {
				// prepare figures data for session creation
				const figures = [];
				board.figures.forEach((figure) => {
					const figureData = {
						color: figure.color,
						name: figure.name,
						initialPosition: figure.initialPosition,
						isInitialPosition: figure.isInitialPosition,
						defeated: figure.defeated,
						position: figure.model.position,
						rotation: figure.model.rotation.y,
					}
					if (figure.hasOwnProperty('isFirstStep')) {
						figureData.isFirstStep = figure.isFirstStep;
					}

					figures.push([
						figure.id,
						figureData
					]);
				});
				message = {
					type: 'create session',
					data: {
						host: this.playerOne,
						visibility: this.sessionVisible,
						timeCap: this.timeCap,
						opponent: this.playerTwo,
						figures: figures,
					}
				};
			}

			this.socket.send(JSON.stringify(message));
		};

		this.socket.onmessage = (event) => {
			const message = JSON.parse(event.data);

			switch (message.type) {
				case 'session created':
					this.id = message.data.id;
					this.playerOne.socketId = message.data.player1.socketId;
					window.user.socketId = message.data.player1.socketId;
					notify('Waiting for opponent...', 5000);
					break;

				case 'session joined':
					this.id = message.data.id;
					this.playerOne = message.data.player1;
					this.playerTwo = message.data.player2;
					this.currentPlayer = message.data.currentPlayer;
					this.sessionVisible = message.data.visibility;
					this.timeCap = message.data.timeCap;
					this.timer = this.timeCap ?
						new Timer(this.playerOne, this.playerTwo)
						: null;

					if (this.timer) {
						this.timer.inverseCountdown = message.data.inverseCountdown;

						if (this.currentPlayer.color !== this.playerOne.color) {
							this.timer.switchPlayers(this.currentPlayer);
						}
					}

					window.user.socketId = message.data.socketId;

					if (window.user.username === this.playerOne.user.username) {
						notify('Joined as red player', 5000);
						// increment matches count on 1st connection
						if (message.data.isNewPlayer) {
							window.Telegram.WebApp.CloudStorage
								.setItem("matches", window.Telegram.WebApp.CloudStorage.getItem("matches")[1] + 1, handleTelegramError);
						}
					} else if (window.user.username === this.playerTwo.user.username) {
						notify('Joined as blue player', 5000);
						// increment matches count on 1st connection
						if (message.data.isNewPlayer) {
							window.Telegram.WebApp.CloudStorage.getItem("matches", (err, data) => {
								if (err) {
									handleTelegramError(err);
									return;
								}
								if (data) {
									window.Telegram.WebApp.CloudStorage
										.setItem("matches", data[1] + 1, handleTelegramError);
								}
							});
						}
					} else {
						notify('Joined as spectator', 5000);
					}

					if (message.data.isStarted) {
						this.currentPlayer =
							message.data.currentPlayer.user.id === this.playerOne.user.id
								? this.playerOne : this.playerTwo;

						board.setState(message.data.figures);
						if (this.timer) this.timer.inverseCountdown = message.data.inverseCountdown;
						this.startGame();
						this.handleCheckmate();
						requestRenderIfNotRequested(scene, camera, controls);
					} else if (message.data.turn > 0) {
						// isChecked
						this.isCheck = message.data.isChecked;
						board.setState(message.data.figures);
						requestRenderIfNotRequested(scene, camera, controls);
						const restartAllowed = window.user.id === this.playerOne.user.id
							|| window.user.id === this.playerTwo.user.id;
						toggleGameResult(this.currentPlayer.user.id === this.playerOne.user.id
							? this.playerTwo.user.username : this.playerOne.user.username, restartAllowed);
					}

					break;

				case 'player joined':
					// no invited/previously joined opponent
					if (!this.playerTwo.user) {
						this.playerTwo.user = message.data.player.user;
						if (this.timer) this.timer.playerTwo = this.playerTwo;
						// increment matches count for host when opponent joins
						window.Telegram.WebApp.CloudStorage.getItem("matches", (err, data) => {
							if (err) {
								handleTelegramError(err);
								return;
							}
							if (data) {
								window.Telegram.WebApp.CloudStorage
									.setItem("matches", data[1] + 1, handleTelegramError);
							}
						});
					} else if (message.data.player.user.id === this.playerTwo.user.id) {
						// opponent connected
						this.playerTwo.online = true;
						this.playerTwo.socketId = message.data.player.socketId;
						if (this.timer) this.timer.playerTwo = this.playerTwo;
					} else if (message.data.player.user.id === this.playerOne.user.id) {
						// host reconnect
						this.playerOne.online = true;
						if (this.timer) this.timer.playerOne = this.playerOne;
					}

					if (message.data.isStarted) {
						const opponent = user.username === this.playerOne.user.username ? this.playerTwo : this.playerOne;
						notify('Game started: ' + opponent.user.username, 5000);
						if (this.timer) this.timer.inverseCountdown = message.data.inverseCountdown;
						this.startGame();
					}

					break;

				case 'figure moved':
					const { movedFigure, beatenFigure } = message.data;
					const figureToMove = board.figures.get(movedFigure.id);
					const figureToBeat = beatenFigure ? board.figures.get(beatenFigure.id) : null;

					if (figureToBeat) {
						figureToBeat.isInitialPosition = false;
						figureToBeat.defeated = true;
						if (figureToBeat.model.name === "pawn") {
							figureToBeat.model.position.set(figureToBeat.color === board.redModelColor ? 5.5 : -5.5, figureToBeat.model.position.x, figureToBeat.model.position.z);
						} else {
							figureToBeat.model.position.set(figureToBeat.color === board.redModelColor ? 6.5 : -6.5, figureToBeat.model.position.x, figureToBeat.model.position.z);
						}
					}

					// sync local timer with server
					if (this.timer) {
						this.timer.inverseCountdown = 0;
						// this.timer.playerOne.timeReserve = message.data.playerOneTimeReserve;
						// this.timer.playerTwo.timeReserve = message.data.playerTwoTimeReserve;
					}

					figureToMove.move(board.getCellByCoordinates(movedFigure.position.x, movedFigure.position.y));
					board.isInitialState = false;
					this.isStarted = true;
					this.handleCheckmate();
					this.switchPlayers();
					requestRenderIfNotRequested(scene, camera, controls);
					break;

				case 'game restarted':
					document.getElementById('rematch')
						.classList.remove('highlighted');

					if (
						window.getComputedStyle(
							document.getElementById('gameResult')
						).display === 'block'
					) {
						toggleGameResult();
					}

					if (this.timer) this.timer.inverseCountdown = message.data.inverseCountdown;
					this.restartGame();
					notify('Game started!', 5000);
					break;

				case 'vote for restart':
					document.getElementById('rematch')
						.classList.add('highlighted');
					break;

				case 'player disconnected':
					const { disconnectedPlayerID } = message.data;
					const disconnectedPlayer = this.playerOne.socketId === disconnectedPlayerID ? this.playerOne : this.playerTwo;
					disconnectedPlayer.online = false;
					disconnectedPlayer.socket = null;
					notify(`${disconnectedPlayer.user.username} disconnected`, 5000);
					break;

				case 'player left':
					const winner = message.data.winner;
					// this.terminate(false);
					this.endGame(winner, false);
					notify('Opponent left the game', 5000);
					break;

				case 'timer exceeded':
					notify('Time is up!', 5000);
					this.endGame(message.data.winner, true, true);
					break;

				case 'cancel inverse countdown':
					this.timer.inverseCountdown = message.data.inverseCountdown;
					this.timer.node.innerHTML = this.timer.inverseCountdown;
					this.endGame();
					break;

				case 'error':
					console.error('Error from server:', message.data.message);
					notify(message.data.message, 5000);
					break;

				default:
					console.warn('Unknown message type:', message.type);
			}
		};

		this.socket.onclose = (event) => {
			console.log('Code: ' + event.code);

			if (event.wasClean) {
				console.log('Closed cleanly');
			} else {
				console.log('Connection interrupted, attempt to reconnect');
				this.connectWS();
			}
		};
	}

	startGame() {
		if (this.timer) {
			// pass endGame callback and bind it's "this" context to the session instance
			this.timer.set(this.endGame.bind(this));
		} else {
			if (this.currentPlayer.user.username === this.playerOne.user.username) {
				this.statusNode.classList.remove("blue")
				this.statusNode.classList.add("red")
			} else {
				this.statusNode.classList.remove("red")
				this.statusNode.classList.add("blue");
			}
		}

		canvas.addEventListener('click', this.boundOnCanvasInteract);
	}

	voteForRematch() {
		if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			const message = {
				type: 'restart game',
				data: {
					sessionId: this.id,
					socketId: window.user.socketId
				}
			};
			this.socket.send(JSON.stringify(message));
		}
	}

	handleMove(targetCell) {
		// parent method drops selection
		const figureModel = this.selectedFigure;
		const beatenFigure = super.handleMove(targetCell);
		this.isStarted = true;
		const figure = board.figures.get(figureModel.userData.id);

		// prepare data to send to server
		const movedFigure = {
			id: figure.id,
			color: figure.color,
			name: figure.name,
			initialPosition: figure.initialPosition,
			isInitialPosition: figure.isInitialPosition,
			position: {
				x: figure.model.position.x,
				y: figure.model.position.y,
				z: figure.model.position.z,
			},
			rotation: figure.model.rotation.y,
		}
		if (figure.hasOwnProperty('isFirstStep')) {
			movedFigure.isFirstStep = figure.isFirstStep;
		}

		// prepare defeated figure data
		let defeatedFigure = null;
		if (beatenFigure) {
			defeatedFigure = {
				id: beatenFigure.id,
				color: beatenFigure.color,
				name: beatenFigure.name,
				initialPosition: beatenFigure.initialPosition,
				isInitialPosition: beatenFigure.isInitialPosition,
				position: {
					x: beatenFigure.model.position.x,
					y: beatenFigure.model.position.y,
					z: beatenFigure.model.position.z,
				},
				rotation: beatenFigure.model.rotation.y,
				defeated: true,
			}
			if (beatenFigure.hasOwnProperty('isFirstStep')) {
				defeatedFigure.isFirstStep = beatenFigure.isFirstStep;
			}
		}

		const message = {
			type: 'move',
			data: {
				sessionId: this.id,
				movedFigure,
				beatenFigure: defeatedFigure,
				playerId: window.user.id,
			}
		};

		this.socket.send(JSON.stringify(message));

		return beatenFigure;
	}

	endGame(winner, restartAllowed, endedByServerTimer = false) {
		super.endGame(winner, restartAllowed);

		// don't save stats if game hasn't started
		if (!this.isStarted) return;

		// don't proceed with spectators
		if (
			!window.user.id === this.playerOne.user.id
			&& !window.user.id === this.playerTwo.user.id
		) return;

		// notify server about game end
		if (!endedByServerTimer) {
			const message = {
				type: 'game ended',
				data: {
					sessionId: this.id,
				}
			};
			this.socket.send(JSON.stringify(message));
		}

		// stats wouldn't be saved if player is disconnected
		if (winner.user.id === window.user.id) {
			window.Telegram.WebApp.CloudStorage
				.setItem("wins", window.Telegram.WebApp.CloudStorage.getItem("wins")[1] + 1, handleTelegramError);
		}
	}

	terminate(keepAlive = true) {
		super.terminate();

		if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			const message = {
				type: 'leave session',
				data: {
					sessionID: this.id,
					socketId: window.user.socketId,
					userId: window.user.id,
					keepAlive
				}
			};
			this.socket.send(JSON.stringify(message));
			this.socket.close();
			window.user.socketId = null;
		}
	}
}