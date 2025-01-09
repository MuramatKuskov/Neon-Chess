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

		return (
			(dx === 1 && dy === 1)
			|| (dx === 1 && dy === 1)
			|| (dx === 1 && dy === 0)
			|| (dx === 0 && dy === 1)
		);
	}
}