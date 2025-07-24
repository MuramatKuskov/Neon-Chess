import { getSettings } from "../utils/settings";

export class Player {
	constructor(color, timeReserve = null) {
		this.enabeHighlighting = getSettings("highlightEnabled");
		this.timeReserve = timeReserve;
		this.color = color;
	}
}

export class OnlinePlayer extends Player {
	constructor({ color, timeReserve = null, user = null }) {
		super(color, timeReserve);
		// maybe user should contain player?
		this.user = user;
		// user has it's own socketId
		this.socketId = null;
		this.online = false;
		// this.figureModels = new Map();
	}

	setUser(user) {
		this.user = user;
	}
}