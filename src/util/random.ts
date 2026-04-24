const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function randomString(length: number): string {
	const buf = new Uint8Array(length)
	crypto.getRandomValues(buf)
	return Array.from(buf, (b) => ALPHABET[b % ALPHABET.length]).join('')
}
