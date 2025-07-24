import { applyUserPreferences } from '../modules/parameters.js';
import { handleTelegramError } from './handleTelegramError.js';

/**
 * Settings object containing configuration options.
 * @type {Object}
 * @property {boolean} cameraAutoRotate - Indicates if the camera should auto-rotate.
 * @property {boolean} cameraInertia - Indicates if the camera should have inertia.
 */
const settings = {
	cameraAutoRotate: document.getElementById("cameraAutoRotate").checked,
	cameraInertia: document.getElementById("cameraInertia").checked,
	musicOn: true,
};

/**
 * Retrieves the settings.
 * @param {string|string[]|null} [keys=null] - The key or keys of the settings to retrieve. If null, returns the entire settings object.
 * @returns {Object|boolean} The settings object, or the value of the specified key(s).
 */
export function getSettings(keys = null) {
	if (!keys) return settings;

	if (typeof keys === "string") return settings[keys];

	return keys.reduce((acc, key) => {
		acc[key] = settings[key];
		return acc;
	}, {});
}

/**
 * Updates the settings with new values.
 * @param {Object} newSettings - An object containing the new settings to be applied.
 */
export function setSettings(newSettings) {
	Object.entries(newSettings).forEach(([key, value]) => {
		settings[key] = value;
	});
}

function setDefaultParams() {
	let lang;
	if (user.language !== "ru" && user.language !== "ua") {
		lang = "en";
	} else {
		lang = "ua";
	}

	window.Telegram.WebApp.CloudStorage
		.setItem("language", lang, handleTelegramError)
		.setItem("isEarlyAccessMember", true, handleTelegramError)
		.setItem("matches", 0, handleTelegramError)
		.setItem("wins", 0, handleTelegramError)
		.setItem("applyWireframes", true, handleTelegramError)
		.setItem("soundOn", true, handleTelegramError)
		.setItem("settings", JSON.stringify(getSettings()), handleTelegramError);
}

export async function handleUserPreferences() {
	return new Promise((resolve, reject) => {
		window.Telegram.WebApp.CloudStorage.getKeys(async (error, keys) => {
			if (error) {
				handleTelegramError(err);
				return reject(error);
			}

			if (!keys.length) {
				setDefaultParams();
			} else {
				await applyUserPreferences();
			}

			resolve();
		});
	});
}