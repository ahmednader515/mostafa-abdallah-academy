import type { NextRequest } from "next/server";
import {
  clientIpFromHeaders,
  metaCookiesFromHeader,
  newMetaEventId,
  sendMetaCapiEvents,
  type MetaCustomData,
  type MetaStandardEvent,
  type MetaUserDataInput,
} from "@/lib/meta-capi";

/** Fire a Meta CAPI event from a server route, attaching request cookies/IP/UA when available. */
export async function trackMetaCapiServer(
  eventName: MetaStandardEvent,
  opts: {
    eventId?: string;
    eventSourceUrl?: string | null;
    customData?: MetaCustomData;
    userData?: MetaUserDataInput;
    request?: NextRequest | Request | null;
  } = {},
): Promise<string> {
  const eventId = opts.eventId?.trim() || newMetaEventId();
  const headers = opts.request?.headers;
  const cookies = headers ? metaCookiesFromHeader(headers.get("cookie")) : { fbp: null, fbc: null };

  await sendMetaCapiEvents([
    {
      eventName,
      eventId,
      eventSourceUrl: opts.eventSourceUrl || (headers?.get("referer") ?? undefined),
      customData: opts.customData,
      userData: {
        ...opts.userData,
        fbp: opts.userData?.fbp ?? cookies.fbp,
        fbc: opts.userData?.fbc ?? cookies.fbc,
        clientIpAddress: opts.userData?.clientIpAddress ?? (headers ? clientIpFromHeaders(headers) : null),
        clientUserAgent: opts.userData?.clientUserAgent ?? headers?.get("user-agent") ?? null,
      },
    },
  ]);

  return eventId;
}
