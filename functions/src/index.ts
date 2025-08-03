import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";
import {onCall} from "firebase-functions/v2/https";

initializeApp();

export const syncCustomClaims = onCall({}, async (request) => {
  const context = request;
  const auth = context.auth;

  if (!auth) {
    throw new Error("User not authenticated");
  }

  const uid = auth.uid;

  const userRecord = await getAuth().getUser(uid);
  const phoneNumber = userRecord.phoneNumber;

  if (!phoneNumber) {
    throw new Error("Phone number not found on user record");
  }

  const db = getFirestore();
  const userSnap = await db
    .collection("users")
    .where("phoneNumber", "==", phoneNumber)
    .limit(1)
    .get();

  if (userSnap.empty) {
    throw new Error("User not found in Firestore");
  }

  const userDoc = userSnap.docs[0].data();

  const claims = {
    role: userDoc.role || null,
    city: userDoc.city || null,
    district: userDoc.district || null,
  };

  await getAuth().setCustomUserClaims(uid, claims);

  return {success: true};
});
