import { listenParameters } from './parameters.js';
import { handleTelegramError } from '../utils/handleTelegramError.js';
import { getSettings } from '../utils/settings.js';
import { board } from '../modules/scene.js';
import { OnlineSession, Session } from '../models/Session.js';
import { OnlinePlayer } from '../models/Player.js';
import { BACK_URL } from "../apiConfig.js";

const menus = {
	placeholder: document.getElementById('placeholder'),
	browse: document.getElementById('browse'),
	play: document.getElementById('play'),
	settings: document.getElementById('settings'),
	profile: document.getElementById('profile'),
	active: null
};

const icons = {
	placeholder: document.getElementById('wutIcon'),
	browse: document.getElementById('browseIcon'),
	play: document.getElementById('playIcon'),
	settings: document.getElementById('settingsIcon'),
	profile: document.getElementById('profileIcon')
};

const createSessionNode = (session) => {
	const isPlayer = window.user.id === session.player1.user.id || window.user.id === session.player2.user?.id;

	const opponent = window.user.id === session.player1.user.id
		? session.player2.user?.username || 'Empty'
		: session.player1.user.username;

	// Base template
	let players = '';
	// show leave btn if user is player in this session
	const leaveBtn = (session.player1.user.id === window.user.id || session.player2.user?.id === window.user.id)
		? `<button class="btn btn-small btn-exit popup__btn" data-id=${session.id} type="button">
			<img style="pointer-events: none;" class="icon popup__icon" src="./icons/Exit.svg" alt="Leave">
		</button>`
		: '';

	if (!isPlayer) {
		players = `
			<div class="popup__match-player">
			<div class="popup__match-indicator ${session.player1.online ? 'green' : 'red'}"></div>
				<span class="popup__match-text">${session.player1.user.username}</span>
			</div>
			<span class="popup__match-tag">vs:</span>
			<div class="popup__match-player">
			<div class="popup__match-indicator ${session.player2.online ? 'green' : 'red'}"></div>
				<span class="popup__match-text">${session.player2.user?.username || 'Empty'}</span>
			</div>
		`;
	} else {
		players = `
			<span class="popup__match-tag">vs:</span>
			<div class="popup__match-player">
			<div class="popup__match-indicator ${session.player2.online ? 'green' : 'red'}"></div>
				<span class="popup__match-text">${opponent}</span>
			</div>
		`;
	}

	return (`
		<li class="popup__match" data-id=${session.id}>
			<div class="popup__match-content">
				<div class="popup__match-players">${players}</div>
				<div class="popup__match-info">
					<span class="popup__match-text">${session.timeCap ? `Timer: ${session.player1.timeReserve}:${session.player2.timeReserve}` : 'No timer'}</span>
				</div>
			</div>
			<div class="popup__match-btns">
				${leaveBtn}
			</div>
		</li>
	`);
};

function updateSessionList(containerNode, sessions) {
	if (!sessions) {
		containerNode.innerHTML = '<p class="">No active sessions</p>';
		return;
	}
	// Clear previous content
	containerNode.innerHTML = '';

	sessions.forEach(session => {
		const node = new DOMParser()
			.parseFromString(createSessionNode(session), 'text/html')
			.body.firstElementChild;
		node.addEventListener('click', handleSessionInteract);
		containerNode.appendChild(node);
	});
}

const songCount = 15;
let currentTrack = 0;

let notificationInteval = null;
let notificationTimeout = null;

export let sessionRef = null;

export function initUI() {
	toggleLangIcon();
	applyLocaleText();
	setListeners();

	const customRange = document.querySelector(".custom-range");
	drawProgress(customRange.firstElementChild, customRange.querySelector('input').value, customRange.querySelector('input').max);

	document.addEventListener('click', playMusic);
	document.addEventListener('touch', playMusic);
}

function playMusic() {
	if (getSettings('musicOn')) {
		const audio = document.querySelector("audio");
		audio.play();
		audio.volume = 0.4;
		audio.addEventListener('ended', (e) => nextTrack(e));
	}

	document.removeEventListener('click', playMusic);
	document.removeEventListener('touch', playMusic);
}

export function nextTrack(event) {
	const audio = event.target;
	currentTrack = (currentTrack + 1) % songCount;
	audio.src = `./sound/music/${currentTrack}.mp3`;
	audio.play();
}

function drawProgress(node, value, max) {
	const percentage = value / max * 100;

	if (value > 20) {
		node.style.backgroundImage = `linear-gradient(100deg, transparent, 8%, var(--red-theme-color), ${100 - value}%, var(--blue-theme-color), 94%, transparent)`;
	} else if (value > 10) {
		node.style.backgroundImage = `linear-gradient(to right, transparent, 8%, var(--red-theme-color), ${100 - value}%, var(--blue-theme-color), 94%, transparent)`;
	} else {
		node.style.backgroundImage = `linear-gradient(to right, transparent, 8%, var(--red-theme-color), ${100 - value}%, var(--red-theme-color), 94%, transparent)`;
	}
	node.style.width = `${percentage}%`;
}

function setListeners() {
	// Show menu on icon click
	Object.entries(icons).forEach(([key, node]) => {
		node.onclick = () => toggleMenus(key);
	});

	// Close menus on click outside
	document.querySelectorAll(".popup__wrapper").forEach(node => {
		node.addEventListener('click', event => handlePopupWrapperPress(event, node));
		node.addEventListener('touchstart', event => handlePopupWrapperPress(event, node));
	});

	// listen "leave current session" button
	document.getElementById('leaveCurrentSession')
		.addEventListener('click', toggleLeavePopup);
	// listen for leaveCurrentSession confirmation
	document.getElementById('leave')
		.addEventListener('click', () => {
			toggleLeavePopup();
			leaveSession(sessionRef.id);
		});
	// listen for leaveCurrentSession declination
	document.getElementById('stay')
		.addEventListener('click', toggleLeavePopup);

	// init parameters
	listenParameters(toggleLangIcon, applyLocaleText);
	// listen for play section events
	listenPlaySection();

	// Listen for checkbox clicks
	document.querySelectorAll(".popup__field:has(input[type='checkbox'])")
		.forEach(node => {
			node.onclick = (e) => {
				const checkbox = node.querySelector('input[type="checkbox"]');
				// propagate click event to checkbox if it wasn't the target
				if (checkbox !== e.target) checkbox.checked = !checkbox.checked;

				// toggle additional content
				if (node.classList.contains("popup__expand-trigger")) {
					const content = node.nextElementSibling;

					if (window.getComputedStyle(content).height === '0px') {
						content.style.height = 'fit-content';
					} else {
						content.style.height = '0';
					}
				}
			};
		});

	// listen notification close
	document.getElementById('notification').addEventListener('click', () => {
		clearTimeout(notificationTimeout);
		clearInterval(notificationInteval);

		notificationInteval = null;
		notificationTimeout = null;

		document.getElementById('notification').classList.remove('active');
	});
}

function toggleLangIcon() {
	document.querySelectorAll("[data-lang]").forEach(node => {
		if (node.getAttribute('data-lang') === user.language) node.style.display = 'block';
		else node.style.display = 'none';
	});
}

async function applyLocaleText() {
	try {
		fetch(`/src/locales/${user.language}.json`)
			.then(response => response.json())
			.then(dictionary => {
				// img alt text
				document.querySelectorAll('[data-alt]').forEach(img => {
					const alt = img.getAttribute('data-alt');
					img.alt = dictionary[alt];
				});

				// content text
				document.querySelectorAll('[data-text]').forEach(node => {
					const key = node.getAttribute('data-text');
					node.innerText = dictionary[key];
				});
			});
	} catch (error) {
		alert("Failed to load translations");
		console.log(error);
	}
}

function handlePopupWrapperPress(event, node) {
	if (event.target !== node) return;
	icons[menus.active].style.filter = 'brightness(1)';
	menus[menus.active].style.display = 'none';
	menus.active = null;
}

// toggle menu appearance
function toggleMenus(key) {
	if (key === "placeholder") {
		if (!getSettings('musicOn')) return;
		nextTrack({ target: document.querySelector("audio") });
		return;
	}

	// close currently active menu
	if (menus.active) {
		icons[menus.active].style.filter = 'brightness(1)';
		menus[menus.active].style.display = 'none';
		if (menus.active === key) return menus.active = null;
	}

	// show requested menu
	icons[key].style.filter = 'brightness(2)';
	menus[key].style.display = 'block';
	menus.active = key;

	// update page content if required
	switch (key) {
		case 'profile':
			if (menus[key].getAttribute('data-isInitialized') === "false") {
				initProfile(menus[key]);
			}
			break;
		case 'browse':
			fetchPublicSessions().then(data => {
				const contentNode = menus.browse.querySelector('.popup__body');
				updateSessionList(contentNode, data?.sessions || null);
			}).catch(error => {
				console.error("Failed to fetch public games:", error);
			});
			break;
		case 'play':
			fetchSessionsByUser(window.user.username, false)
				.then(data => {
					const contentNode = menus.play.querySelector('#myLiveSessions')
						.querySelector('.popup__list');

					updateSessionList(contentNode, data?.sessions || null, false);
				}).catch(error => {
					console.error("Failed to fetch user sessions:", error);
				});
			break;
	}
}

async function fetchPublicSessions() {
	const response = await fetch(`${BACK_URL}/api/chess/getPublicSessions`);
	if (response.status === 204) return null;
	const data = await response.json();

	return data;
}

async function fetchSessionsByUser(username, ignorePrivate = false) {
	const url = new URL(`${BACK_URL}/api/chess/getSessionsByUser`);
	url.searchParams.append('username', username);
	url.searchParams.append('ignorePrivate', ignorePrivate);

	const response = await fetch(url.toString());
	if (response.status === 204) return null;

	const data = await response.json();

	return data;
}

function listenPlaySection() {
	const playSection = menus.play;
	const playLocal = playSection.querySelector('#playLocal');
	const playOnline = playSection.querySelector('#createSession');
	const timerDurationInput = playSection.querySelector('#setTimer');
	const timerDurationIndicator = playSection.querySelector('#timerValue');

	timerDurationIndicator.innerText = timerDurationInput.value;

	timerDurationInput.addEventListener('input', () => {
		drawProgress(timerDurationInput.parentNode.querySelector(".custom-range__background"), timerDurationInput.value, timerDurationInput.max);
		timerDurationIndicator.innerText = timerDurationInput.value;
	});

	playLocal.addEventListener('click', () => initSession('local'));
	playOnline.addEventListener('click', () => initSession('online'));

	listenGameResult();
}

function initSession(type) {
	const useTimer = document.getElementById('useTimer').checked;
	const timerDurationInput = menus.play.querySelector('#setTimer');
	const timeCap = useTimer ? parseInt(timerDurationInput.value) * 60
		: null;

	if (sessionRef) sessionRef.terminate();

	if (type === 'online') {
		sessionRef = new OnlineSession(
			new OnlinePlayer({ timeReserve: timeCap, color: board.redModelColor, user }),
			new OnlinePlayer({ timeReserve: timeCap, color: board.blueModelColor }),
			{
				timeCap,
				// TODO: later
				// visibility: document.getElementById('allowSpectators').checked
			}
		);
	} else if (type === 'local') {
		sessionRef = new Session({ timeCap });
		sessionRef.startGame();
	}

	// close play section
	toggleMenus('play');
}

// update profile popup content
function initProfile(node) {
	node.querySelector('#username').innerText = window.user.username;

	window.Telegram.WebApp.CloudStorage.getItems(["matches", "victories"], (err, items) => {
		handleTelegramError(err);
		node.querySelector('#userMatchCount').innerText = items.matches || 0;
		node.querySelector('#userVictoryCount').innerText = items.victories || 0;
	});

	node.setAttribute('data-isInitialized', "true");
}

export function toggleGameResult(winner, restartAllowed) {
	const popupContainer = document.getElementById('gameResult');
	const winnerNode = popupContainer.querySelector('#winner');
	const rematchNode = popupContainer.querySelector('#rematch');

	console.warn(`Toggling game result popup: ${winner}, restartAllowed: ${restartAllowed}`);

	const isOpen = window.getComputedStyle(popupContainer).display === 'block';

	if (isOpen) {
		popupContainer.style.display = 'none';
		rematchNode.disabled = false;
	} else {
		if (!restartAllowed) {
			rematchNode.disabled = true;
		}

		winnerNode.innerText = winner;
		popupContainer.style.display = 'block';
	}
}

function listenGameResult() {
	const playAgainNode = document.getElementById('rematch');
	const exitNode = document.getElementById('exit');

	playAgainNode.addEventListener('click', () => {
		handlePlayAgain(playAgainNode);
	});
	exitNode.addEventListener('click', () => {
		toggleGameResult();
		sessionRef.terminate(false);
	});
}

function handlePlayAgain(node) {
	if (sessionRef instanceof OnlineSession) {
		// disable rematch button to prevent multiple clicks
		node.disabled = true;
		node.classList.add('highlighted');
		sessionRef.voteForRematch();
	} else {
		toggleGameResult();
		sessionRef.restartGame();
	}
}

export function notify(text, duration) {
	if (notificationInteval) return setTimeout(() => notify(text, duration), 1000);

	const notificationNode = document.getElementById('notification');
	const textNode = notificationNode.querySelector('.notification__text');
	const indicator = notificationNode.querySelector('.notification__indicator-bar');
	let indicatorWidth = 100;

	textNode.innerText = text;
	notificationNode.classList.add('active');

	notificationInteval = setInterval(() => {
		indicator.style.width = `${indicatorWidth}%`;
		indicatorWidth -= 1;
	}, duration / 100);

	notificationTimeout = setTimeout(() => {
		notificationNode.classList.remove('active');
		clearInterval(notificationInteval);
		notificationInteval = null;
		notificationTimeout = null;
	}, duration);
}

function handleSessionInteract(event) {
	const sessionId = event.currentTarget.getAttribute('data-id');

	if (event.target.classList.contains("btn-exit")) {
		leaveSession(sessionId);
		event.currentTarget.remove();
	} else {
		joinSession(sessionId);
	}
}

function joinSession(sessionId) {
	// disconnect from current session & keep it alive
	if (sessionRef) sessionRef.terminate();

	sessionRef = new OnlineSession(
		new OnlinePlayer({ color: board.redModelColor }),
		new OnlinePlayer({ color: board.blueModelColor }),
		{ id: sessionId }
	);

	// close active menu
	toggleMenus(menus.active);
}

function toggleLeavePopup() {
	const popup = document.getElementById('confirmLeave');
	if (window.getComputedStyle(popup).display === 'block') {
		popup.style.display = 'none';
	} else {
		popup.style.display = 'block';
	}
}

function leaveSession(sessionId) {
	// leave from current session
	if (sessionRef && sessionRef.id === sessionId) {
		sessionRef.terminate(false);
		sessionRef = null;
	} else {
		// leave via session list
		fetch(`${BACK_URL}/api/chess/exitSession`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId, userId: window.user.id })
		})
			.then(response => {
				if (response.ok) {
					notify("You have left the session", 2000);
					console.log("Exited session successfully");
				} else {
					notify("Failed to leave session", 2000);
					console.error("Failed to exit session:", response.statusText);
				}
			})
			.catch(error => console.error("Error exiting session:", error));
	}
}