export async function onRequest(context) {
    const { next } = context;
    let response;

    try {
        response = await next();
    } catch (err) {
        // Catch-all error handler to prevent internal stack traces from leaking
        return new Response(JSON.stringify({ error: "An internal server error occurred." }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Clone the response so that its headers can be modified
    const modifiedResponse = new Response(response.body, response);

    // Apply security headers consistently to all API responses
    modifiedResponse.headers.set('X-Frame-Options', 'DENY');
    modifiedResponse.headers.set('X-Content-Type-Options', 'nosniff');
    modifiedResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // We replicate the CSP here although API responses don't usually render HTML
    modifiedResponse.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' cdn.tailwindcss.com fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.mistral.ai https://api.x.ai https://openrouter.ai https://api.cohere.ai"
    );

    return modifiedResponse;
}
