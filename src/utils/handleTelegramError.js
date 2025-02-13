export function handleTelegramError(err) {
	if (err) {
		alert(JSON.stringify(err));
		console.error(err);
		return;
	}
}