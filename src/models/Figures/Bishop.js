import { Figure } from "./Figure";

export class Bishop extends Figure {
	constructor(color, cell) {
		super(color, cell);
		this.model = "bishop";
	}

	canMove(target) {
		if (!super.canMove(target)) return false;
		if (this.cell.isEmptyDiagonal(target)) return true;

		return false;
	}
}