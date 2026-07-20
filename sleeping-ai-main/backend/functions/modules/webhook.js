// Functions Firebase v2 API
const { admin, logger } = require("../core/bootstrap");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { Timestamp } = require("firebase-admin/firestore");

// Bind the secret set from firebase functions:secrets:set STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

exports.stripeWebhook = onRequest(
  { region: "us-central1", secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

   // Initialize Stripe with secret
    const stripe = require("stripe")(STRIPE_SECRET_KEY.value());

    // Verify Stripe signature using the raw request body
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      logger.error("Stripe signature verification failed:", err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object || {};
          const metadata = session.metadata || {};

          const uid = metadata.uid || null;
          const creditsToAdd = Number(metadata.credits || 0);
          const packId = metadata.packId || null;

          logger.info("checkout.completed metadata", {
            uid,
            creditsToAdd,
            packId,
            sessionId: session.id,
          });

         // Safely add credits to user’s account in Firestore atomically
          if (uid && creditsToAdd > 0) {
            try {
              await admin.firestore().collection("users").doc(uid).set(
                {
                  credits: admin.firestore.FieldValue.increment(creditsToAdd),
                  updatedAt: Timestamp.now(),
                },
                { merge: true }
              );
              logger.info("credits incremented", { uid, by: creditsToAdd });
            } catch (e) {
              logger.error("credits increment failed", { uid, err: String(e) });
            }
          }

          // Record the purchase in Firestore using the Stripe session ID 
          await admin.firestore().collection("purchases").doc(session.id).set(
            {
              uid,
              packId,
              credits: creditsToAdd,
              amountCents: session.amount_total || null,
              currency: session.currency || "usd",
              stripeSessionId: session.id,
              status: "paid",
              createdAt: Timestamp.now(),
            },
            { merge: true }
          );

          break;
        }

        case "checkout.session.expired": {
          const session = event.data.object || {};
          const metadata = session.metadata || {};

          await admin.firestore().collection("purchases").doc(session.id).set(
            {
              uid: metadata.uid || null,
              packId: metadata.packId || null,
              credits: Number(metadata.credits || 0),
              stripeSessionId: session.id,
              status: "expired",
              createdAt: Timestamp.now(),
            },
            { merge: true }
          );
          break;
        }
          // Log refund details in Firestore
        case "refund.created": {
          const obj = event.data.object || {};
          await admin.firestore().collection("refunds").doc(obj.id).set(
            {
              stripeRefundId: obj.id || null,
              amountCents: obj.amount || null,
              status: obj.status || "succeeded",
              createdAt: Timestamp.now(),
            },
            { merge: true }
          );
          break;
        }

        default:
          logger.info("Unhandled Stripe event:", event.type);
      }

      return res.json({ received: true });
    } catch (err) {
      logger.error("stripeWebhook handler error:", err);
      return res.status(500).send("Webhook handler error");
    }
  }
);

