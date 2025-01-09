import { Figure } from "./Figure";

export class Queen extends Figure {
	constructor(color, cell) {
		super(color, cell);
		this.model = "queen";
	}

	canMove(target) {
		if (!super.canMove(target))
			return false;
		if (this.cell.isEmptyVertical(target))
			return true;
		if (this.cell.isEmptyHorizontal(target))
			return true;
		if (this.cell.isEmptyDiagonal(target))
			return true;
		return false;
	}
}