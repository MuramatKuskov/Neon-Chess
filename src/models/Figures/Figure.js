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
			containingClass: this,
		};
		this.figure = cachedModel;
		scene.userData.playBoard.board.add(cachedModel);
	}

	canMove(target) {
		if (target.figure?.color === this.color)
			return false
		if (target.figure?.name === FigureNames.KING)
			return false
		return true;
	}

	move(x, y) {
		this.figure.position.set(x, y, 0.9);
	}
}