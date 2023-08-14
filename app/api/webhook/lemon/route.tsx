import { NextRequest, NextResponse } from "next/server";
import { LemonOrderData, LemonOrderMeta } from "@/types/lemon";
import { sendMail } from "@/pkg/mail";

export async function POST(req: NextRequest) {
  //https://docs.lemonsqueezy.com/help/webhooks
  await checkLemonSignature(req);
  const event = req.headers.get("X-Event-Name");
  const { meta, data }: { meta: LemonOrderMeta; data: LemonOrderData } =
    await req.json();
  switch (event) {
    case "order_created":
      console.log(meta, data);
      break;
    case "order_refunded":
      console.log(meta, data);
      break;
    default:
      console.error("Unknown event", event);
  }
  return NextResponse.json({ ok: true });
}

async function checkLemonSignature(req: NextRequest) {
  const secret = process.env.LEMON_WEBHOOK_SECRET || "";
  if (!secret) {
    throw new Error("No LEMON_WEBHOOK_SECRET in env");
  }
  const rawBody = await req.text();
  if (!rawBody) {
    throw new Error("No body");
  } else {
    await sendMail("erikchau@icloud.com", "lemon webhook", rawBody);
  }
  console.info("rawBody", rawBody);
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const signature = Buffer.from(req.headers.get("X-Signature") || "", "utf8");
  if (!crypto.timingSafeEqual(digest, signature)) {
    throw new Error("Invalid signature.");
  }
}
