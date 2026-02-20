const { db } = require('./firebaseAdmin');
const line = require('@line/bot-sdk');

const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "DEBUG_TOKEN",
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new line.messagingApi.MessagingApiClient({ channelAccessToken: config.channelAccessToken });

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Basic Auth Check (In a real app, verify the Firebase ID token from headers)
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    try {
        const { studentId, text } = JSON.parse(event.body);
        if (!studentId || !text) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing parameters' }) };
        }

        const studentDoc = await db.collection('students').doc(studentId).get();
        if (!studentDoc.exists) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Student not found' }) };
        }

        const lineId = studentDoc.data().lineId;
        if (!lineId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Student has no linked LINE ID' }) };
        }

        // Call LINE API
        await client.pushMessage({
            to: lineId,
            messages: [{ type: 'text', text }]
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true })
        };
    } catch (err) {
        console.error("Push Message Error:", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error sending message', details: err.message })
        };
    }
};
