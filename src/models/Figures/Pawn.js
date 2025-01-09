import { Figure } from "./Figure";

export class Pawn extends Figure {
	constructor(color, cell) {
		super(color, cell);
		this.model = "pawn";
		this.isFirstStep = true;
	}

	canMove(target) {
		if (!super.canMove(target))
			return false;
		const direction = this.cell.figure?.color === Colors.BLACK ? 1 : -1;
		const firstStepDirection = this.cell.figure?.color === Colors.BLACK ? 2 : -2;

		if ((target.y === this.cell.y + direction || this.isFirstStep
			&& (target.y === this.cell.y + firstStepDirection))
			&& target.x === this.cell.x
			&& this.cell.board.getCell(target.x, target.y).isEmpty()) {
			return true;
		}

		if (target.y === this.cell.y + direction
			&& (target.x === this.cell.x + 1 || target.x === this.cell.x - 1)
			&& this.cell.isEnemy(target)) {
			return true;
		}

		return false;
	}

	moveFigure(target) {
		super.canMove(target);
		this.isFirstStep = false;
	}
}