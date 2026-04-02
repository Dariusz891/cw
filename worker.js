export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 🎯 dopasowanie /pixel/:id.png
    const match = path.match(/^\/pixel\/([a-zA-Z0-9_-]+)\.png$/);

    if (!match) {
      return new Response("Not Found", { status: 404 });
    }

    const id = match[1];

    // 📥 parametry
    const campaign = url.searchParams.get("campaign") || "none";

    // 🌐 podstawowe dane
    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
    const userAgent = request.headers.get("User-Agent") || "unknown";
    const referer = request.headers.get("Referer") || "direct";

    // 🌍 dane Cloudflare
    const cf = request.cf || {};

    const geo = {
      country: cf.country || "unknown",
      city: cf.city || "unknown",
      region: cf.region || "unknown",
      regionCode: cf.regionCode || "unknown",
      timezone: cf.timezone || "unknown",
      latitude: cf.latitude || null,
      longitude: cf.longitude || null
    };

    const network = {
      asn: cf.asn || null,
      isp: cf.asOrganization || "unknown",
      colo: cf.colo || "unknown"
    };

    const timestamp = new Date().toISOString();

    const data = {
      id,
      campaign,
      ip,
      userAgent,
      referer,
      geo,
      network,
      timestamp
    };

    // 🔑 klucz eventu z ID
    const eventKey = `track:${id}:${timestamp}:${Math.random()
      .toString(36)
      .slice(2)}`;

    // 💾 zapis do KV
    await env.PIXEL_KV.put(eventKey, JSON.stringify(data), {
      expirationTtl: 60 * 60 * 24 * 30
    });

    // 🪵 log
    console.log("TRACK:", JSON.stringify(data));

    // 🖼️ 1x1 pixel
    const pixel = Uint8Array.from([
      71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0,
      0, 0, 0, 255, 255, 255, 33, 249, 4, 1, 0, 0, 0,
      0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59
    ]);

    return new Response(pixel, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    });
  }
};