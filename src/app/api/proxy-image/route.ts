import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);

    // Only allow HTTP/HTTPS
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return new NextResponse("Invalid protocol", { status: 400 });
    }

    // SSRF protection: reject local and internal private network addresses
    const hostname = parsedUrl.hostname.toLowerCase();
    const isLocalOrPrivate =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.16.') ||
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.2') ||
      hostname.startsWith('172.3') ||
      hostname.startsWith('169.254.') || // Cloud metadata service
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      hostname === '[::1]';

    if (isLocalOrPrivate) {
      return new NextResponse("Forbidden target host", { status: 403 });
    }

    const response = await fetch(url, {
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.statusText}`, { status: response.status });
    }

    // Ensure target resource is an image
    const contentType = response.headers.get("Content-Type") || "";
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Requested URL is not an image", { status: 400 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET");

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new NextResponse("Failed to fetch image", { status: 500 });
  }
}
