import { initUI } from './src/modules/userInterface.js';
import { API_BASE_URL } from "./src/apiConfig.js";
import { initLocalSession } from './src/modules/gameSession.js';

window.Telegram.WebApp.ready();
const back_url = API_BASE_URL || 'http://localhost:8080';
window.language;

async function main() {
	// if (!window.Telegram.WebApp.initData.length) return alert("Please, open this page from Telegram @digital_duels_bot");
	initUI();
	// initLocalSession(true, 60);
}

main();

async function fetchPublicGames() {
	const response = await fetch(`${back_url}/api/getPublicSessions`);
	const data = await response.json();
	return data;
}