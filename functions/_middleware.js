export async function onRequest(context) {
    const { next } = context;
    const response = await next();

    // Clone the response so that it's mutable
    const newResponse = new Response(response.body, response);

    newResponse.headers.set('X-Frame-Options', 'DENY');
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');
    newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Setup CSP
    const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' cdn.tailwindcss.com fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://generativelanguage.googleapis.com https://api.anthropic.com https://api.openai.com https://openrouter.ai";
    newResponse.headers.set('Content-Security-Policy', csp);

    return newResponse;
}