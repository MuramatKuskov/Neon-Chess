import { controls } from './scene.js';
import { nextTrack } from './userInterface.js'
import { handleTelegramError } from '../utils/handleTelegramError.js';
import { getSettings, setSettings } from '../utils/settings.js';

export function listenParameters(toggleLangIcon, applyLocaleText) {
	// toggle autoRotate
	document.getElementById("cameraAutoRotate").onchange = (event) => {
		controls.autoRotate = event.target.checked;
		setSettings({ cameraAutoRotate: event.target.checked });
		window.Telegram.WebApp.CloudStorage.setItem("settings", JSON.stringify(getSettings()), handleTelegramError);
	}

	// toggle inertia
	document.getElementById("cameraInertia").onchange = (event) => {
		controls.enableDamping = event.target.checked;
		setSettings({ cameraInertia: event.target.checked });
		window.Telegram.WebApp.CloudStorage.setItem("settings", JSON.stringify(getSettings()), handleTelegramError);
	}

	// Toggle language on switcher click
	document.querySelectorAll("[data-lang]").forEach(node => {
		node.onclick = event => {
			language = event.target.getAttribute('data-lang') === 'en' ? 'ua' : 'en';
			toggleLangIcon();
			applyLocaleText();
		};
	});

	// Toggle sound
	document.getElementById("musicOn").onchange = (event) => {
		const audio = document.querySelector("audio");

		if (audio.paused) {
			audio.play();
			audio.volume = 0.4;
			audio.addEventListener("ended", (e) => nextTrack(e));
		} else {
			audio.pause();
		}

		setSettings({ musicOn: event.target.checked });
		window.Telegram.WebApp.CloudStorage.setItem("settings", JSON.stringify(getSettings()), handleTelegramError);
	};

	// const highlightToggle = document.getElementById('highlight-toggle');
	// highlightToggle.onchange = () => {
	// 	scene.userData.playBoard.highlightEnabled = highlightToggle.checked;
	// 	if (!highlightToggle.checked) {
	// 		scene.userData.playBoard.clearHighlights();
	// 		requestRenderIfNotRequested(scene, camera, controls);
	// 	}
	// };
}

export function applyUserPreferences() {
	return new Promise((resolve, reject) => {
		window.Telegram.WebApp.CloudStorage.getItems(["settings", "language"], (error, items) => {
			if (error) {
				handleTelegramError(err);
				reject(error);
			} else {
				window.language = items.language;

				const cachedSettings = JSON.parse(items.settings);

				Object.keys(getSettings()).forEach(key => {
					setSettings({ [key]: cachedSettings[key] });
					document.getElementById(key).checked = cachedSettings[key];
				});

				resolve();
			}
		});
	});
}