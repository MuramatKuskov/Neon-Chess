import { board } from "../../modules/scene";

export class Figure {
	constructor(color, cell) {
		this.color = color;
		this.cell = cell;
		this.defeated = false;
		this.model = null;
		this.figure = null;
		this.isInitialPosition = true;
	}

	canMove(target) {
		if (this.cell === target) return false;
		if (target.figure?.color === this.color) return false;

		return true;
	}

	move(targetCell) {
		// cell = null if figure is defeated
		if (this.cell) this.cell.figure = null;

		if (targetCell.figure) {
			targetCell.figure.isInitialPosition = false;
			targetCell.figure.defeated = true;
			targetCell.figure.cell = null;
			if (targetCell.figure.model === "pawn") {
				targetCell.figure.figure.position.set(this.color === 0xc00f00 ? 5.5 : -5.5, targetCell.figure.figure.position.x, targetCell.figure.figure.position.z);
			} else {
				targetCell.figure.figure.position.set(this.color === 0xc00f00 ? 6.5 : -6.5, targetCell.figure.figure.position.x, targetCell.figure.figure.position.z);
			}
			targetCell.figure.figure.userData.maintainingObject.cell = null;
			targetCell.figure.figure.userData.maintainingObject.defeated = true;
			targetCell.figure = null;
		}

		// this.cell = targetCell;
		// targetCell.figure = { ...this, cell: targetCell };

		targetCell.figure = this;
		this.cell = targetCell;
		this.figure.position.set(targetCell.x, targetCell.y, 0.9);

		if (this.isInitialPosition) this.isInitialPosition = false;
	}

	simulateMove(target, color) {
		// remember starting cell
		const initialCell = this.cell;
		const targetFigure = target.figure;
		const targetPos = Object.assign({}, targetFigure?.figure?.position);

		this.move(target);

		const check = board.isCheck(color);

		// rollback
		this.move(initialCell);
		if (targetFigure) {
			target.figure = targetFigure;
			targetFigure.defeated = false;
			targetFigure.cell = target;
			targetFigure.figure.position.set(targetPos.x, targetPos.y, targetPos.z);
		}

		return check;
	}
}