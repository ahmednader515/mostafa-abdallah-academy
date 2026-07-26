import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import {
  META_STANDARD_EVENTS,
  clientIpFromHeaders,
  metaCookiesFromHeader,
  sendMetaCapiEvents,
  type MetaCustomData,
  type MetaStandardEvent,
} from "@/lib/meta-capi";

type Body = {
  eventName?: string;
  eventId?: string;
  eventSourceUrl?: string;
  customData?: MetaCustomData;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    externalId?: string;
  };
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = String(body.eventName ?? "").trim();
  const eventId = String(body.eventId ?? "").trim();
  if (!eventName || !eventId) {
    return NextResponse.json({ error: "eventName and eventId required" }, { status: 400 });
  }
  if (!(META_STANDARD_EVENTS as readonly string[]).includes(eventName)) {
    return NextResponse.json({ error: "Unsupported event" }, { status: 400 });
  }

  const cookies = metaCookiesFromHeader(request.headers.get("cookie"));
  const session = await getServerSession(authOptions).catch(() => null);
  let email = body.userData?.email?.trim() || "";
  let phone = body.userData?.phone?.trim() || "";
  let firstName = body.userData?.firstName?.trim() || "";
  let externalId = body.userData?.externalId?.trim() || session?.user?.id || "";

  if (session?.user?.id) {
    externalId = session.user.id;
    if (!email && session.user.email) email = session.user.email;
    if (!firstName && session.user.name) firstName = session.user.name.split(/\s+/)[0] || "";
    if (!phone) {
      try {
        const user = await getUserById(session.user.id);
        const sn = (user as { studentNumber?: string | null; student_number?: string | null } | null)
          ?.studentNumber ||
          (user as { student_number?: string | null } | null)?.student_number;
        if (sn) phone = String(sn);
      } catch {
        /* optional */
      }
    }
  }

  const result = await sendMetaCapiEvents([
    {
      eventName: eventName as MetaStandardEvent,
      eventId,
      eventSourceUrl: body.eventSourceUrl || request.headers.get("referer") || undefined,
      customData: body.customData,
      userData: {
        email: email || null,
        phone: phone || null,
        firstName: firstName || null,
        lastName: body.userData?.lastName || null,
        externalId: externalId || null,
        fbp: cookies.fbp,
        fbc: cookies.fbc,
        clientIpAddress: clientIpFromHeaders(request.headers),
        clientUserAgent: request.headers.get("user-agent"),
      },
    },
  ]);

  return NextResponse.json({ success: result.ok, skipped: result.skipped === true, error: result.error });
}
