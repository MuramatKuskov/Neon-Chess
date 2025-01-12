export class Figure {
	constructor(color, cell) {
		this.color = color;
		this.cell = cell;
		this.locked = false;
		this.model = null;
		this.figure = null;
	}

	place(scene, userCache, x, y, rotation, color) {
		const cachedModel = userCache.get(this.model).clone();

		cachedModel.children[0].material.color.set(color);

		cachedModel.position.set(x, y, 0.9);
		cachedModel.rotation.y = rotation;

		cachedModel.userData = {
			maintainingObject: this,
		};
		this.figure = cachedModel;
		this.cell.figure = this;
		scene.userData.playBoard.board.add(cachedModel);
	}

	canMove(target) {
		if (this.cell === target) return false;
		if (target.figure?.color === this.color) return false;
		if (target.figure?.model === "king") return false;

		return true;
	}

	move(target) {
		if (!this.canMove(target)) return false;
		if (target.figure) {
			target.figure.cell = null;
			if (target.figure.model === "pawn") {
				target.figure.figure.position.set(this.color === 0x2200AA ? -5.5 : 5.5, target.figure.figure.position.x, target.figure.figure.position.z);
			} else if (target.figure !== null) {
				target.figure.figure.position.set(this.color === 0x2200AA ? -6.5 : 6.5, target.figure.figure.position.x, target.figure.figure.position.z);
			}
		}
		this.cell.figure = null;
		console.log(target);

		this.figure.position.set(target.x, target.y, 0.9);
		target.figure = this;
		this.cell = target;

		return true;
	}
}