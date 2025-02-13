import { Figure } from "./Figure";

export class King extends Figure {
	constructor(color, cell) {
		super(color, cell);
		this.model = "king";
	}

	canMove(target) {
		if (!super.canMove(target))
			return false;

		const dx = Math.abs(this.cell.x - target.x);
		const dy = Math.abs(this.cell.y - target.y);

		const validMove = (dx === 1 && dy === 1)
			|| (dx === 1 && dy === 1)
			|| (dx === 1 && dy === 0)
			|| (dx === 0 && dy === 1);

		if (!validMove) return false;

		// check if move will put king in check
		if (this.simulateMove(target, this.color)) {
			return false;
		}

		return true;
	}
}