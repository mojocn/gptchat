import { OpenAIStream, StreamingTextResponse } from "ai";
import OpenAI from "openai";
import { NextResponse } from "next/server";

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
  // 将 SSE 数据编码为 Uint8Array
  const encoder = new TextEncoder();
  // 创建 TransformStream
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
    },
  });

  const writer = transformStream.writable.getWriter();

  // 定义一个计数器
  let counter = 0;
  // 每秒发送一个消息
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
  //then close the writer accord to request

  return new Response(transformStream.readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
      "Content-Encoding": "none",
    },
  });
}
