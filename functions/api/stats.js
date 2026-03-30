export async function onRequestGet(context) {
    const { env } = context;

    try {
        if (!env.KV_RATELIMIT) {
            return new Response(JSON.stringify({ count: 0 }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const globalCountKey = 'global_stats_chats_count';
        const globalCountStr = await env.KV_RATELIMIT.get(globalCountKey) || '0';
        
        return new Response(JSON.stringify({ count: parseInt(globalCountStr, 10) }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
