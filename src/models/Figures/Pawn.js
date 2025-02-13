import { Figure } from "./Figure";

export class Pawn extends Figure {
	constructor(color, cell) {
		super(color, cell);
		this.model = "pawn";
		this.isFirstStep = true;
	}

	canMove(target, color = null) {
		if (!super.canMove(target)) return false;

		const direction = this.cell.figure?.color === 0xc00f00 ? 1 : -1;
		const firstStepDirection = this.cell.figure?.color === 0xc00f00 ? 2 : -2;

		// first step
		if ((target.y === this.cell.y + direction || this.isFirstStep
			&& (target.y === this.cell.y + firstStepDirection))
			&& target.x === this.cell.x
			&& target.isEmpty() && this.cell.isEmptyVertical(target)) {
			if (color && this.simulateMove(target, color)) {
				return false;
			}
			return true;
		}

		if (target.y === this.cell.y + direction
			&& (target.x === this.cell.x + 1 || target.x === this.cell.x - 1)
			&& this.cell.isEnemy(target)) {
			if (color && this.simulateMove(target, color)) {
				return false;
			}
			return true;
		}

		return false;
	}

	move(target) {
		super.move(target);
		this.isFirstStep = false;
	}
}