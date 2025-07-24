export class User {
	constructor({ id, username, firstName, lastName, language_code }) {
		this.id = id;
		this.username = username;
		this.firstName = firstName;
		this.lastName = lastName;
		this.language = language_code;
		this.roles = ["guest", "user", "admin"];
		this.socketId = null;
	}
}