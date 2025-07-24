import { board } from "../../modules/scene";

export class Figure {
	constructor(color, x, y) {
		this.id = x + "" + y;
		this.color = color;
		this.defeated = false;
		this.name = null;
		this.model = null;
		this.initialPosition = {
			x,
			y,
			z: 0.9,
			rotation: this.color === board.redModelColor ? Math.PI : Math.PI * 2,
		};
		this.isInitialPosition = true;
	}

	canMove(target) {
		if (target.x === this.model.position.x && target.y === this.model.position.y) return false;
		if (target.figure?.color === this.color) return false;

		return true;
	}

	move(targetCell) {
		board.getCellByCoordinates(this.model.position.x, this.model.position.y)
			.figure = null;
		// return this to session to send to the server
		let beatenFigure = null;

		// beat enemy figure
		if (targetCell.figure) {
			targetCell.figure.isInitialPosition = false;
			targetCell.figure.defeated = true;
			if (targetCell.figure.name === "pawn") {
				targetCell.figure.model.position.set(this.color === board.redModelColor ? 5.5 : -5.5, targetCell.figure.initialPosition.x, targetCell.figure.initialPosition.z);
			} else {
				targetCell.figure.model.position.set(this.color === board.redModelColor ? 6.5 : -6.5, targetCell.figure.initialPosition.x, targetCell.figure.initialPosition.z);
			}
			targetCell.figure.model.rotation.y = this.color === board.redModelColor ? Math.PI * 1.5 : Math.PI * 0.5;
			// shallow copy?
			beatenFigure = targetCell.figure;
		}

		targetCell.figure = this;
		this.model.position.set(targetCell.x, targetCell.y, this.initialPosition.z);

		this.isInitialPosition = false;
		board.isInitialState = false;

		return beatenFigure;
	}

	simulateMove(target, color) {
		// save current state
		const startingCell = board.getCellByCoordinates(this.model.position.x, this.model.position.y);
		const targetFigure = target.figure;
		const targetStartingPos = { ...targetFigure?.model?.position };

		// simulate move
		this.move(target);
		const check = board.isCheck(color);

		// rollback
		this.move(startingCell);
		if (targetFigure) {
			target.figure = targetFigure;
			targetFigure.defeated = false;
			targetFigure.model.position.set(targetStartingPos.x, targetStartingPos.y, targetStartingPos.z);
			targetFigure.model.rotation.y = targetFigure.initialPosition.rotation;
		}

		return check;
	}

	addToBoard(userCache) {
		const clonedModel = userCache.get(this.name).clone();
		clonedModel.children[0].material.color.set(this.color);
		this.model = clonedModel;

		const { x, y, z, rotation } = this.initialPosition;
		this.model.position.set(x, y, z);
		this.model.rotation.y = rotation;

		this.model.userData = {
			id: this.id,
		};

		board.getCellByCoordinates(x, y).figure = this;
		board.board.add(clonedModel);
		board.figures.set(this.id, this);
	}
}