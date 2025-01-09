import { Figure } from "./Figure";

export class Rook extends Figure {
	constructor(color, cell) {
		super(color, cell);
		this.model = "rook";
	}

	canMove(target) {
		if (!super.canMove(target))
			return false;
		if (this.cell.isEmptyVertical(target))
			return true;
		if (this.cell.isEmptyHorizontal(target))
			return true;
		return false;
	}
}