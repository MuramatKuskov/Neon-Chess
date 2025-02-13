import { listenParameters } from './parameters.js';
import { handleTelegramError } from '../utils/handleTelegramError.js';
import { initOnlineSession, initLocalSession, startGame, endSession } from './gameSession.js';
import { getSettings } from '../utils/settings.js';

const menus = {
	// placeholder: document.getElementById('placeholder'),
	browse: document.getElementById('browse'),
	play: document.getElementById('play'),
	settings: document.getElementById('settings'),
	profile: document.getElementById('profile'),
};

const icons = {
	// placeholder: document.getElementById('wutIcon'),
	browse: document.getElementById('browseIcon'),
	play: document.getElementById('playIcon'),
	settings: document.getElementById('settingsIcon'),
	profile: document.getElementById('profileIcon')
};

const songCount = 15;
let currentTrack = 0;

let notificationInteval = null;
let notificationTimeout = null;

export function initUI() {
	toggleLangIcon();
	applyLocaleText();
	setListeners();

	const customRange = document.querySelector(".custom-range");
	drawProgress(customRange.firstElementChild, customRange.querySelector('input').value, customRange.querySelector('input').max);

	if (getSettings('musicOn')) {
		const audio = document.querySelector("audio");
		audio.play();
		audio.volume = 0.4;
		audio.addEventListener('ended', (e) => nextTrack(e));
	}
}

export function nextTrack(event) {
	const audio = event.target;
	currentTrack = (currentTrack + 1) % songCount - 1;
	audio.src = `/sound/music/${currentTrack}.mp3`;
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
	// Show popup on icon click
	Object.entries(icons).forEach(([key, node]) => {
		node.onclick = () => toggleMenus(key);
	});

	// Close popups on click outside
	document.querySelectorAll(".popup__wrapper").forEach(node => {
		node.addEventListener('click', event => handlePopupWrapperPress(event, node));
		node.addEventListener('touchstart', event => handlePopupWrapperPress(event, node));
	});

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
		if (node.getAttribute('data-lang') === window.language) node.style.display = 'block';
		else node.style.display = 'none';
	});
}

async function applyLocaleText() {
	try {
		fetch(`/src/locales/${window.language}.json`)
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
	if (event.target === node) {
		node.parentNode.style.display = "none";
	}
}

// toggle popup visibility
function toggleMenus(popupKey) {
	Object.entries(menus).forEach(([key, node]) => {
		// hide all popups except the one that was clicked
		if (key !== popupKey) {
			icons[key].style.filter = 'brightness(1)';
			node.style.display = 'none';
			return;
		}

		// toggle visibility of the clicked popup & highlight icon
		if (window.getComputedStyle(node).display === 'block') {
			icons[key].style.filter = 'brightness(1)';
			node.style.display = 'none';
		} else {
			icons[key].style.filter = 'brightness(2)';
			node.style.display = 'block';
		}

		// update popup content if required
		if (key === "profile" && node.getAttribute('data-isInitialized') === "false") {
			initProfile(node);
		}
	});
}

function listenPlaySection() {
	const playSection = menus.play;
	const playLocal = playSection.querySelector('#playLocal');
	const timerDurationInput = playSection.querySelector('#setTimer');
	const timerDurationIndicator = playSection.querySelector('#timerValue');

	timerDurationIndicator.innerText = timerDurationInput.value;

	timerDurationInput.addEventListener('input', () => {
		drawProgress(timerDurationInput.parentNode.querySelector(".custom-range__background"), timerDurationInput.value, timerDurationInput.max);
		timerDurationIndicator.innerText = timerDurationInput.value;
	});
	playLocal.addEventListener('click', () => startSession("local"));

	listenGameResult();
}

async function startSession(type, id = null) {
	const useTimer = document.getElementById('useTimer').checked;
	const minutes = document.getElementById('setTimer').value;
	const seconds = minutes * 60;

	if (type === "local") {
		initLocalSession(useTimer, seconds);
	} else if (id) {
		// join by id
		// const data = await fetchGame(id);
		// initOnlineSession(useTimer, timer, data);
	} else {
		// create new session
		// const allowSpectators = document.getElementById('allowSpectators').checked;
		// const data = await createGame(allowSpectators, useTimer, timer);
		// initOnlineSession(useTimer, timer);
	}
	toggleMenus();
}

// update profile popup content
function initProfile(node) {
	node.querySelector('#username').innerText = window.Telegram.WebApp.initDataUnsafe.user.username;

	window.Telegram.WebApp.CloudStorage.getItems(["matches", "wins"], (err, items) => {
		handleTelegramError(err);
		node.querySelector('#userMatchCount').innerText = items.matches;
		node.querySelector('#userWinCount').innerText = items.wins;
	});

	node.setAttribute('data-isInitialized', "true");
}

export function toggleGameResult(winner) {
	const popupContainer = document.getElementById('gameResult');
	const winnerNode = popupContainer.querySelector('#winner');

	const isOpen = window.getComputedStyle(popupContainer).display === 'block';

	if (isOpen) {
		popupContainer.style.display = 'none';
	} else {
		winnerNode.innerText = winner;
		popupContainer.style.display = 'block';
	}
}

function listenGameResult() {
	const playAgainNode = document.getElementById('rematch');
	const exitNode = document.getElementById('exit');

	playAgainNode.addEventListener('click', () => {
		toggleGameResult();
		startGame();
	});
	exitNode.addEventListener('click', () => {
		toggleGameResult();
		endSession();
	});
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