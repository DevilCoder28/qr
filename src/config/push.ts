import admin from "firebase-admin";

function initAdmin() {
  if (admin.apps.length) return;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    return;
  }

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!b64) throw new Error("Missing Firebase credentials");
  const json = Buffer.from(b64, "base64").toString("utf-8");
  const svc = JSON.parse(json);
  admin.initializeApp({
    credential: admin.credential.cert(svc),
  });
}
initAdmin();

export const push = {
  notifyMany: async (
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ) => {
    if (!tokens?.length) return;
    const res = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: data || {},
    });
    return res;
  },
};
