import admin from "firebase-admin";
import path from "path";

function initAdmin() {
  if (admin.apps.length) return;

  var serviceAccount = require("../../serviceAccountKey.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
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
