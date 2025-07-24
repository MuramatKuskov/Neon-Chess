import { board } from "../../modules/scene";
import { Figure } from "./Figure";

export class Bishop extends Figure {
	constructor(color, x, y) {
		super(color, x, y);
		this.name = "bishop";
	}

	canMove(target, color = null) {
		if (!super.canMove(target)) return false;

		if (board.getCellByCoordinates(this.model.position.x, this.model.position.y).isEmptyDiagonal(target)) {
			if (color && this.simulateMove(target, color)) {
				return false;
			}
			return true;
		}

		return false;
	}
}