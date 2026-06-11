import admin from "firebase-admin";

let messagingMock = null;
let isMock = false;

const initFirebase = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("⚠️  [Firebase Admin SDK]: Firebase credentials missing in environment variables. Falling back to MOCK engine.");
    isMock = true;
    messagingMock = {
      send: async (payload) => {
        console.log(`[FCM Mock Send]: Dispatching push message payload to token "${payload.token}":`, payload.notification || payload.data);
        return "mock-message-id-" + Math.random().toString(36).substring(7);
      },
      sendEachForMulticast: async (payload) => {
        console.log(`[FCM Mock Multicast]: Dispatching push message payload to ${payload.tokens.length} tokens:`, payload.notification || payload.data);
        return {
          successCount: payload.tokens.length,
          failureCount: 0,
          responses: payload.tokens.map(() => ({ success: true, messageId: "mock-id" }))
        };
      }
    };
    return null;
  }

  try {
    const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey
      })
    });
    console.log("🔌 [Firebase Admin SDK]: Initialized successfully connected to cloud projects.");
    return admin.messaging();
  } catch (error) {
    console.error("💥 [Firebase Admin SDK Initializer Error]: Fail build connection. Falling back to MOCK engine.", error.message);
    isMock = true;
    messagingMock = {
      send: async (payload) => {
        console.log(`[FCM Mock Send]: Dispatching push message payload to token "${payload.token}":`, payload.notification);
        return "mock-message-id";
      },
      sendEachForMulticast: async (payload) => {
        return {
          successCount: payload.tokens.length,
          failureCount: 0,
          responses: payload.tokens.map(() => ({ success: true, messageId: "mock-id" }))
        };
      }
    };
    return null;
  }
};

const fcmInstance = initFirebase();

export const firebaseMessaging = {
  send: async (payload) => {
    if (isMock || !fcmInstance) {
      return messagingMock.send(payload);
    }
    return fcmInstance.send(payload);
  },
  sendEachForMulticast: async (payload) => {
    if (isMock || !fcmInstance) {
      return messagingMock.sendEachForMulticast(payload);
    }
    return fcmInstance.sendEachForMulticast(payload);
  }
};
