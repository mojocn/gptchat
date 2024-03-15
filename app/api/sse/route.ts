export const dynamic = "force-dynamic";
function generateRandomString(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function GET(req: Request): Promise<Response> {
  const encoder = new TextEncoder();
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
    },
  });
  const writer = transformStream.writable.getWriter();
  let counter = 0;
  const interval = setInterval(() => {
    counter++;
    if (counter > 10) {
      clearInterval(interval);
      return;
    }
    const message = `id:${counter}\nevent:message\ndata:rand string: ${generateRandomString(
      16,
    )}\n\n`;
    const messageUint8Array = encoder.encode(message);
    writer.write(messageUint8Array);
  }, 250);

  return new Response(transformStream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
      "Content-Encoding": "none",
    },
  });
}

export async function POST(req: Request): Promise<Response> {
  const encoder = new TextEncoder();
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
    },
  });
  const writer = transformStream.writable.getWriter();
  let counter = 0;
  const interval = setInterval(() => {
    counter++;
    if (counter > 10) {
      clearInterval(interval);
      return;
    }
    const message = `id:${counter}\nevent:message\ndata:rand string: ${generateRandomString(
      16,
    )}\n\n`;
    const messageUint8Array = encoder.encode(message);
    writer.write(messageUint8Array);
  }, 250);

  return new Response(transformStream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
      "Content-Encoding": "none",
    },
  });
}
