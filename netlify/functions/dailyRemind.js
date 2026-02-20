const { schedule } = require('@netlify/functions');
const { db } = require('./firebaseAdmin');
const line = require('@line/bot-sdk');

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "DEBUG_TOKEN",
    channelSecret: process.env.LINE_CHANNEL_SECRET || "DEBUG_SECRET",
};
const client = new line.messagingApi.MessagingApiClient({ channelAccessToken: config.channelAccessToken });

const handler = async (event, context) => {
    console.log("Running Daily Reminder task");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    try {
        // Get all confirmed schedules for tomorrow
        const schedulesSnap = await db.collection("schedules")
            .where("status", "==", "confirmed")
            .where("startAt", ">=", tomorrow)
            .where("startAt", "<", dayAfterTomorrow)
            .get();

        if (schedulesSnap.empty) {
            console.log("No schedules for tomorrow.");
            return { statusCode: 200 };
        }

        for (const schedDoc of schedulesSnap.docs) {
            const data = schedDoc.data();

            const studentDoc = await db.collection("students").doc(data.studentId).get();
            if (studentDoc.exists && studentDoc.data().lineId) {
                const lineId = studentDoc.data().lineId;
                const timeStr = data.startAt.toDate().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
                const text = `明日の授業のリマインドです。\n日時: ${timeStr} から\nお待ちしております！`;

                try {
                    await client.pushMessage({
                        to: lineId,
                        messages: [{ type: 'text', text }]
                    });
                    console.log(`Reminded student ${data.studentId}`);
                } catch (e) {
                    console.error(`Failed to send reminder to ${data.studentId}`, e);
                }
            }
        }

        return { statusCode: 200 };
    } catch (err) {
        console.error("Error in scheduled task", err);
        return { statusCode: 500, body: "Error" };
    }
};

// Run every day at 20:00 JST (11:00 UTC)
exports.handler = schedule('0 11 * * *', handler);
