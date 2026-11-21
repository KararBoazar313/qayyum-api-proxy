
const ALLOWED_ORIGIN = "https://kararboazar313.github.io";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");

    if (origin && origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods":
        "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    const incoming = new URL(request.url);
    const target = new URL(
      incoming.pathname + incoming.search,
      env.BACKEND_API_URL
    );

    const headers = new Headers(request.headers);
    headers.delete("Origin");
    headers.delete("Host");

    const upstreamRequest = new Request(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method)
        ? null
        : request.body,
      redirect: "follow"
    });

    try {
      const response = await fetch(upstreamRequest);
      const resultHeaders = new Headers(response.headers);

      for (const [key, value] of Object.entries(corsHeaders)) {
        resultHeaders.set(key, value);
      }

      resultHeaders.set("Cache-Control", "no-store");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: resultHeaders
      });
    } catch {
      return new Response(
        JSON.stringify({ error: "backend_unavailable" }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
  }
};
