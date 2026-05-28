export async function onRequest(context) {
    const response = await context.next();

    // Copy the original headers to a new Response object to modify them
    const headers = new Headers(response.headers);

    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Keep CSP aligned with the static _headers
    headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.x.ai https://openrouter.ai https://api.mistral.ai https://api.cohere.ai https://api.groq.com");

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
    });
}
