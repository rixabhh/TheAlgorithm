export async function onRequest(context) {
  const response = await context.next();

  // Clone the response so that it's mutable
  const newResponse = new Response(response.body, response);

  // Prevent clickjacking
  newResponse.headers.set('X-Frame-Options', 'DENY');
  // Prevent MIME sniffing
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  // Control referrer information
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Content Security Policy
  newResponse.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' cdn.tailwindcss.com fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'"
  );

  return newResponse;
}
