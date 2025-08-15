import admin from "firebase-admin";

function initAdmin() {
  if (admin.apps.length) return;

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is missing");
  }
  console.log("FIREBASE_SERVICE_ACCOUNT_BASE64 length:", process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.length);

  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
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

    // Add datetime to the data payload
    const payloadData = {
      ...data,
      timestamp: new Date().toISOString(), // ISO8601 timestamp
    };

    const res = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: payloadData, // send datetime in data
    });

    console.log('FCM result:', {
      successCount: res.successCount,
      failureCount: res.failureCount,
    });

    // log per token error and remove invalid tokens
    const failedTokens: string[] = [];
    res.responses.forEach((r, i) => {
      if (!r.success) {
        console.error('FCM error for token:', tokens[i], r.error);
        failedTokens.push(tokens[i]);
      }
    });

    return res;
  },
};
