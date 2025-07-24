import { initUI } from './src/modules/userInterface.js';
import { handleUserPreferences } from './src/utils/settings.js';
import { User } from './src/models/User.js';

window.Telegram.WebApp.ready();

async function main() {
	if (!window.Telegram.WebApp.initData.length) {
		alert("Please, open this page via Telegram @digital_duels_bot");
		return;
	}
	// user needs to be set properly, right?
	// TODO: switch to initData & validate
	window.user = new User(window.Telegram.WebApp.initDataUnsafe.user);
	await handleUserPreferences();
	initUI();
}

main();