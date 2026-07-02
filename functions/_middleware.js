export async function onRequest(context) {
    const response = await context.next();
    const clonedResponse = new Response(response.body, response);

    clonedResponse.headers.set('X-Frame-Options', 'DENY');
    clonedResponse.headers.set('X-Content-Type-Options', 'nosniff');
    clonedResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    clonedResponse.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' cdn.tailwindcss.com fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.mistral.ai https://openrouter.ai https://api.groq.com https://api.cohere.ai;");

    return clonedResponse;
}
