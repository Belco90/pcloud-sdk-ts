const SECRET_PARAM_PATTERN =
	/([?&](access_token|auth|client_secret|password|code|request_id)=)[^&\s]+/gi

export function sanitizeUrlString(input: string): string {
	return input.replace(SECRET_PARAM_PATTERN, '$1***')
}
