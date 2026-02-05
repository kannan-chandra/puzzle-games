/**
 * Get the unlocked date in America/New_York timezone (YYYY-MM-DD format)
 * Puzzles unlock at midnight ET (00:00 America/New_York)
 */
export function getUnlockedDateET(now: Date): string {
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone: 'America/New_York',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	});

	const parts = formatter.formatToParts(now);
	const year = parts.find((p) => p.type === 'year')?.value;
	const month = parts.find((p) => p.type === 'month')?.value;
	const day = parts.find((p) => p.type === 'day')?.value;

	return `${year}-${month}-${day}`;
}

/**
 * Compare two date strings in YYYY-MM-DD format
 * Returns -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareDates(a: string, b: string): -1 | 0 | 1 {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}
