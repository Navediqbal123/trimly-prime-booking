import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type Token,
  type PushNotificationSchema,
  type ActionPerformed,
} from "@capacitor/push-notifications";
import { registerDeviceToken, revokeDeviceToken } from "@/lib/api";

let activeUserId: string | null = null;
let latestToken: string | null = null;
let setupPromise: Promise<void> | null = null;
let registeredUserId: string | null = null;
let registeredToken: string | null = null;
const pendingRegistrations = new Map<string, Promise<void>>();

function getNotificationPath(data: Record<string, unknown>): string {
  const candidate = data.deep_link ?? data.url ?? data.path ?? data.route;

  if (typeof candidate === "string") {
    try {
      const url = new URL(candidate, window.location.origin);
      if (url.origin === window.location.origin) {
        return `${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      // Invalid notification URLs fall back to the app's dashboard.
    }
  }

  if (data.booking_id || data.bookingId) {
    return data.recipient_role === "barber" ? "/barber-hub/bookings" : "/bookings";
  }

  return "/dashboard";
}

function openNotification(action: ActionPerformed) {
  const data = action.notification.data;
  const path = getNotificationPath(
    data && typeof data === "object" ? data as Record<string, unknown> : {}
  );

  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

async function registerTokenForUser(token: string, userId: string) {
  if (registeredUserId === userId && registeredToken === token) return;

  const key = `${userId}:${token}`;
  const pending = pendingRegistrations.get(key);
  if (pending) {
    await pending;
    return;
  }

  const registration = (async () => {
    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    const result = await registerDeviceToken(token, platform);
    if (result.success) {
      registeredUserId = userId;
      registeredToken = token;
    } else {
      console.error("Failed to register push notification token.");
    }
  })();
  pendingRegistrations.set(key, registration);

  try {
    await registration;
  } finally {
    pendingRegistrations.delete(key);
  }
}

async function setupPushNotifications() {
  const permission = await PushNotifications.checkPermissions();
  const resolvedPermission = permission.receive === "prompt" ||
    permission.receive === "prompt-with-rationale"
    ? await PushNotifications.requestPermissions()
    : permission;

  if (resolvedPermission.receive !== "granted") {
    console.warn("Push notification permission was not granted.");
    return;
  }

  await PushNotifications.addListener("registration", (token: Token) => {
    latestToken = token.value;
    if (activeUserId) {
      void registerTokenForUser(token.value, activeUserId).catch(() => {
        console.error("Failed to register push notification token.");
      });
    }
  });

  await PushNotifications.addListener("registrationError", () => {
    console.error("Push registration failed.");
  });

  await PushNotifications.addListener(
    "pushNotificationReceived",
    (_notification: PushNotificationSchema) => {
      // In-app notifications continue to be handled by NotificationBell.
    }
  );

  await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    openNotification
  );

  await PushNotifications.register();
}

export async function activatePushNotifications(userId: string) {
  activeUserId = userId;
  if (!Capacitor.isNativePlatform()) return;

  if (!setupPromise) {
    setupPromise = setupPushNotifications();
  }

  try {
    await setupPromise;
    if (latestToken && activeUserId === userId) {
      await registerTokenForUser(latestToken, userId);
    }
  } catch {
    console.error("Push notification setup failed.");
  }
}

export async function deactivatePushNotifications() {
  const userId = activeUserId;
  activeUserId = null;

  if (!Capacitor.isNativePlatform() || !userId || !latestToken) return;

  const pendingResults = await Promise.allSettled(pendingRegistrations.values());
  if (pendingResults.some((result) => result.status === "rejected")) {
    console.error("An in-flight push notification token registration failed.");
  }

  try {
    const result = await revokeDeviceToken(latestToken);
    if (result.success) {
      if (registeredUserId === userId) {
        registeredUserId = null;
        registeredToken = null;
      }
    } else {
      console.error("Failed to revoke push notification token.");
    }
  } catch {
    console.error("Failed to revoke push notification token.");
  }
}