import { board } from "../../modules/scene";
import { Figure } from "./Figure";

export class Pawn extends Figure {
	constructor(color, x, y) {
		super(color, x, y);
		this.name = "pawn";
		this.isFirstStep = true;
	}

	canMove(target, color = null) {
		if (!super.canMove(target)) return false;

		const direction = this.color === board.redModelColor ? 1 : -1;
		const firstStepDirection = this.color === board.redModelColor ? 2 : -2;

		// first step
		if (
			(
				target.y === this.model.position.y + direction
				|| this.isFirstStep
				&& (target.y === this.model.position.y + firstStepDirection)
			)
			&& target.x === this.model.position.x
			&& (
				target.isEmpty()
				&& board.getCellByCoordinates(this.model.position.x, this.model.position.y)
					.isEmptyVertical(target)
			)) {
			if (color && this.simulateMove(target, color)) {
				return false;
			}
			return true;
		}

		if (target.y === this.model.position.y + direction
			&& (target.x === this.model.position.x + 1 || target.x === this.model.position.x - 1)
			&& board.getCellByCoordinates(this.model.position.x, this.model.position.y).isEnemy(target)) {
			if (color && this.simulateMove(target, color)) {
				return false;
			}
			return true;
		}

		return false;
	}

	move(target) {
		const beatenFigure = super.move(target);
		this.isFirstStep = false;
		return beatenFigure;
	}
}