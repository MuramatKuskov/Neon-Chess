import { Figure } from "./Figure";

export class Pawn extends Figure {
	constructor(color, cell) {
		super(color, cell);
		this.model = "pawn";
		this.isFirstStep = true;
	}

	canMove(target) {
		if (!super.canMove(target)) return false;

		const direction = this.cell.figure?.color === 0x2200AA ? -1 : 1;
		const firstStepDirection = this.cell.figure?.color === 0x2200AA ? -2 : 2;

		if ((target.y === this.cell.y + direction || this.isFirstStep
			&& (target.y === this.cell.y + firstStepDirection))
			&& target.x === this.cell.x
			&& target.isEmpty()) {
			return true;
		}

		if (target.y === this.cell.y + direction
			&& (target.x === this.cell.x + 1 || target.x === this.cell.x - 1)
			&& this.cell.isEnemy(target)) {
			return true;
		}

		return false;
	}

	move(target) {
		if (!super.move(target)) return false;
		this.isFirstStep = false;

		return true;
	}
}