// Functions (Firebase v2 API)  
const { admin } = require("../core/bootstrap");

// V2 imports 
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { Timestamp } = require("firebase-admin/firestore");

// Bind the secret
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");

exports.createCheckoutSession = onCall(
  { secrets: [STRIPE_SECRET_KEY] },
  async (request) => {
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError("unauthenticated", "Login required.");
    }
    const uid = request.auth.uid;

    const credits = Number((request.data && request.data.credits) || 0);
    const packId = String((request.data && request.data.packId) || "").trim();
    if (!credits || credits <= 0) {
      throw new HttpsError("invalid-argument", "Credits must be a positive number.");
    }

    const stripe = require("stripe")(STRIPE_SECRET_KEY.value());

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://example.com/cancel",
      metadata: {
        uid,
        credits: String(credits),
        packId: packId || `PACK_${credits}`
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 199,
            product_data: { name: `Credits ${credits}` },
          },
          quantity: 1,
        },
      ],
    });

    // Record intent
    await admin.firestore().collection("purchases").add({
      uid,
      packId: packId || null,
      credits,
      status: "created",
      stripeSessionId: session.id,
      createdAt: Timestamp.now(),
    });

    return { url: session.url, id: session.id };
  }
);
