import { Figure } from "./Figure";

export class Queen extends Figure {
	constructor(color, cell) {
		super(color, cell);
		this.model = "queen";
	}

	canMove(target, color = null) {
		if (!super.canMove(target))
			return false;

		if (this.cell.isEmptyVertical(target)) {
			if (color && this.simulateMove(target, color)) {
				return false;
			}
			return true;
		}
		if (this.cell.isEmptyHorizontal(target)) {
			if (color && this.simulateMove(target, color)) {
				return false;
			}
			return true;
		}
		if (this.cell.isEmptyDiagonal(target)) {
			if (color && this.simulateMove(target, color)) {
				return false;
			}
			return true;
		}

		return false;
	}
}