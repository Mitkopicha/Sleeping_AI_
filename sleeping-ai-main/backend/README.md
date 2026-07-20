npm install -g firebase-tools
firebase login
firebase use bed-stories-bff80
# one time per user

npm install 
npm i fluent-ffmpeg ffmpeg-static
# from cd functions

firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
# for backend only use

run firebase deploy --only functions
firebase deploy --only hosting
# deploy
npm install
npm i firebase
# from frontend project root
firebase functions:log --only generateSummaries
firebase functions:log --only generateStoryAndAudio
# logs
https://bed-stories-bff80.web.app/test.html
# for the Tester go to the hosted URL generate a Story + Audio 
# signup with credentials email/paswword i gave you earlier(15 tokens available each)

firebase init emulators 
firebase emulators:start
# emulators/select emulators and press enter

firebase functions:list
# List deployed functions

firebase functions:secrets:access STRIPE_SECRET_KEY
firebase functions:secrets:access STRIPE_WEBHOOK_SECRET
# Shows Stripe secret keys/webhook
