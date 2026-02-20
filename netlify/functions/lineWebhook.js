const { db } = require('./firebaseAdmin');
const line = require('@line/bot-sdk');

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "DEBUG_TOKEN",
    channelSecret: process.env.LINE_CHANNEL_SECRET || "DEBUG_SECRET",
};
const client = new line.messagingApi.MessagingApiClient({ channelAccessToken: config.channelAccessToken });

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Validate signature
    const signature = event.headers['x-line-signature'];
    if (!signature || !line.validateSignature(event.body, config.channelSecret, signature)) {
        return { statusCode: 403, body: 'Invalid signature' };
    }

    try {
        const body = JSON.parse(event.body);
        const events = body.events;

        for (const lineEvent of events) {
            if (lineEvent.type === 'message' && lineEvent.message.type === 'text') {
                const text = lineEvent.message.text.trim();
                const userId = lineEvent.source.userId;

                // Simplistic check for cancellation intent
                if (text.includes("キャンセル") || text.includes("お休み")) {
                    // 1. Get student from lineId
                    const studentsSnap = await db.collection("students").where("lineId", "==", userId).limit(1).get();

                    if (!studentsSnap.empty) {
                        const studentId = studentsSnap.docs[0].id;

                        // 2. Find next active schedule
                        const now = new Date();
                        const schedulesSnap = await db.collection("schedules")
                            .where("studentId", "==", studentId)
                            .where("status", "==", "confirmed")
                            .where("startAt", ">=", now)
                            .orderBy("startAt", "asc")
                            .limit(1)
                            .get();

                        if (!schedulesSnap.empty) {
                            const schedDoc = schedulesSnap.docs[0];
                            await schedDoc.ref.update({ status: 'canceled' });

                            // Send reply confirmation
                            await client.replyMessage({
                                replyToken: lineEvent.replyToken,
                                messages: [{ type: 'text', text: '次回の予定をキャンセルしました。ご連絡ありがとうございます。' }]
                            });
                            continue;
                        }
                    }
                }

                // Default reply
                await client.replyMessage({
                    replyToken: lineEvent.replyToken,
                    messages: [{ type: 'text', text: 'メッセージを受け付けました。システムによる自動返信です。' }]
                });
            }
        }

        return { statusCode: 200, body: 'OK' };
    } catch (err) {
        console.error("Webhook Error:", err);
        return { statusCode: 500, body: 'Webhook Error' };
    }
};
