import * as THREE from 'three';
import { requestRenderIfNotRequested } from './rendering.js';
import { canvas } from './rendering.js';
import { scene, camera, controls, board } from './scene.js';
import { getSettings } from '../utils/settings.js';
import { Player } from '../models/Player.js';
import { notify, toggleGameResult } from './userInterface.js';

export const figureModels = {
	playerOne: new Map(),
	playerTwo: new Map()
};

const statusNode = document.getElementById('gameStatus');
const timerNode = document.getElementById('timer');

const redModelColor = 0xc00f00;
const blueModelColor = 0x0725E1;
const playerOne = new Player(redModelColor, getSettings('highlightEnabled'));
const playerTwo = new Player(blueModelColor, getSettings('highlightEnabled'));
let useTimer = null;
let sessionTime = null;
let remainingTimeOne = null;
let remainingTimeTwo = null;
let interval = null;
let currentPlayer = playerOne;
let selectedFigure = null;
let isLocalSession = false;
let isCheck = false;

export function initOnlineSession(enableTimer, time, figures = null) {
	isLocalSession = false;
	useTimer = enableTimer;
	sessionTime = time;
	startGame(figures);
}

export function initLocalSession(enableTimer, time) {
	isLocalSession = true;
	useTimer = enableTimer;
	sessionTime = time;
	startGame();
}

export function startGame(figures = null) {
	// set board state
	if (figures) {
		board.setState(figures);
		requestRenderIfNotRequested(scene, camera, controls);
	} else if (!board.isInitialState) {
		board.reset();
		requestRenderIfNotRequested(scene, camera, controls);
	}

	currentPlayer = playerOne;
	selectedFigure = null;

	if (statusNode.classList.length) {
		statusNode.classList.remove("red");
		statusNode.classList.remove("blue");
	}

	if (useTimer) {
		setTimer();
	} else {
		if (interval) {
			clearInterval(interval);
			timerNode.style.visibility = 'hidden';
		}
		statusNode.className = "red";
	}

	handleCanvasClick();
}

function setTimer() {
	remainingTimeOne = sessionTime;
	remainingTimeTwo = sessionTime;

	timerNode.style.visibility = 'visible';
	timerNode.innerHTML = `${remainingTimeOne} : ${remainingTimeTwo}`;
	timerNode.className = "red";

	if (interval) clearInterval(interval);
	interval = setInterval(timerCallback, 1000);
}

function timerCallback() {
	if (currentPlayer === playerOne) {
		remainingTimeOne = remainingTimeOne - 1;
	} else {
		remainingTimeTwo = remainingTimeTwo - 1;
	}

	timerNode.innerHTML = `${remainingTimeOne} : ${remainingTimeTwo}`;

	if (remainingTimeOne === 0 || remainingTimeTwo === 0) {
		const winner = remainingTimeOne === 0 ? playerTwo : playerOne;
		endGame(winner);
	}
}

function endGame(winner) {
	clearInterval(interval);
	canvas.removeEventListener('click', onCanvasClick);
	currentPlayer = playerOne;
	selectedFigure = null;
	statusNode.classList.remove("red");
	statusNode.classList.remove("blue");

	// show popup with game result and offer to play again
	if (winner.username) {
		toggleGameResult(winner.username, startGame, endSession);
	} else {
		const color = winner.color === redModelColor ? 'Red' : 'Blue';
		toggleGameResult(color, startGame, endSession);
	}

	if (!isLocalSession) {
		// send game result to server & update user stats
	}
}

export function endSession() {
	if (!board.isInitialState) {
		board.reset();
		requestRenderIfNotRequested(scene, camera, controls);
	}

	canvas.removeEventListener('click', onCanvasClick);
	timerNode.style.visibility = 'hidden';
}

function swapPlayers() {
	currentPlayer === playerOne ? currentPlayer = playerTwo : currentPlayer = playerOne;
	if (!useTimer) {
		statusNode.classList.toggle("red");
		statusNode.classList.toggle("blue");
	} else {
		timerNode.classList.toggle("red");
		timerNode.classList.toggle("blue");
	}
}

function handleCanvasClick() {
	canvas.removeEventListener('click', onCanvasClick);
	canvas.addEventListener('click', onCanvasClick);
}

function onCanvasClick(event) {
	// slow down camera rotation after game start
	controls.autoRotateSpeed = 0.1;

	const target = traceTarget(event);

	if (!target) {
		if (selectedFigure) {
			dropSelection();
			requestRenderIfNotRequested(scene, camera, controls);
			return;
		}
		return;
	}

	console.log(target.parent.userData.maintainingObject);

	// prevent selecting defeated figures
	if (isDefeatedFigure(target)) return;

	if (!selectedFigure) {
		// select player's figure
		if (target.userData.isFigure && target.parent.userData.maintainingObject.color === currentPlayer.color) {
			selectFigure(target.parent);
		} else if (target.parent.userData.maintainingObject.figure && target.parent.userData.maintainingObject.figure.color === currentPlayer.color) {
			// also select by cell
			selectFigure(target.parent.userData.maintainingObject.figure.figure);
		}
	} else {
		// select another figure
		if (target.userData.isFigure && target.parent.userData.maintainingObject.color === currentPlayer.color) {
			dropSelection();
			selectFigure(target.parent);
		} else if (target.parent.userData.maintainingObject.figure && target.parent.userData.maintainingObject.figure.color === currentPlayer.color) {
			// also select by cell
			dropSelection();
			selectFigure(target.parent.userData.maintainingObject.figure.figure);
		} else {
			// move or drop selection
			if (target.userData.isFigure) {
				handleMove(target.parent.userData.maintainingObject.cell);
			} else {
				handleMove(target.parent.userData.maintainingObject);
			}
		}
	}

	requestRenderIfNotRequested(scene, camera, controls);
}

function isDefeatedFigure(target) {
	return target.userData.isFigure && target.parent.userData.maintainingObject.defeated;
}

function traceTarget(event) {
	let target = null;
	const mouse = new THREE.Vector2();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse, camera);

	const intersects = raycaster.intersectObjects(scene.userData.playBoard.board.children, true);
	if (intersects.length > 0) {
		target = intersects[0].object;
	}

	return target;
}

function handleMove(cell) {
	if (!selectedFigure.userData.maintainingObject.canMove(cell, isCheck ? currentPlayer.color : null)) {
		dropSelection();
		return false;
	}

	selectedFigure.userData.maintainingObject.move(cell);

	if (board.isInitialState) board.isInitialState = false;

	if (isCheck) {
		isCheck = false;
	} else {
		handleCheckmate();
	}

	// handleCheckmate();

	dropSelection();
	swapPlayers();
	return true;
}

function handleCheckmate() {
	const color = currentPlayer.color === redModelColor ? blueModelColor : redModelColor;

	if (!board.isCheck(color)) return;

	if (board.isCheckmate(color)) {
		endGame(currentPlayer);
	} else {
		isCheck = true;
		notify("Check!", 3500);
	}
}

function dropSelection() {
	selectedFigure = null;
	scene.userData.playBoard.clearHighlights();
}

function selectFigure(figure) {
	if (selectedFigure) scene.userData.playBoard.clearHighlights();
	selectedFigure = figure;
	scene.userData.playBoard.highlightAvailableMoves(selectedFigure.userData.maintainingObject, isCheck);
}