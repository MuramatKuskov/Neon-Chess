import { Figure } from "./Figure";

export class Bishop extends Figure {
	constructor(color, cell) {
		super(color, cell);
		this.model = "bishop";
	}

	canMove(target, color = null) {
		if (!super.canMove(target)) return false;

		if (this.cell.isEmptyDiagonal(target)) {
			if (color && this.simulateMove(target, color)) {
				return false;
			}
			return true;
		}

		return false;
	}
}