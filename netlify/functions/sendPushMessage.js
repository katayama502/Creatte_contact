import { db } from './firebaseAdmin.js';
import * as line from '@line/bot-sdk';

export const handler = async (event, context) => {
    // Basic Auth Check (In a real app, verify the Firebase ID token from headers)
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Basic Auth Check (In a real app, verify the Firebase ID token from headers)
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    try {
        const { studentId, testLineId, text } = JSON.parse(event.body);
        if (!studentId && !testLineId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing studentId or testLineId' }) };
        }
        if (!text) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing text content' }) };
        }

        let lineId = testLineId; // Use test ID if provided bypasses DB lookup

        if (!lineId && studentId) {
            const studentDoc = await db.collection('students').doc(studentId).get();
            if (!studentDoc.exists) {
                return { statusCode: 404, body: JSON.stringify({ error: 'Student not found' }) };
            }

            lineId = studentDoc.data().lineId;
            if (!lineId) {
                return { statusCode: 400, body: JSON.stringify({ error: 'Student has no linked LINE ID' }) };
            }
        }

        // Initialize client inside handler to ensure process.env is populated in the execution context
        const config = {
            channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
            channelSecret: process.env.LINE_CHANNEL_SECRET,
        };
        const client = new line.messagingApi.MessagingApiClient({ channelAccessToken: config.channelAccessToken });

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
        const errStatus = err.statusCode || 500;
        let errorMessage = err.message || 'Error sending message';
        if (errStatus === 400 && err.originalError?.response?.data?.message) {
            errorMessage += ' - ' + err.originalError.response.data.message;
        }

        return {
            statusCode: errStatus,
            body: JSON.stringify({ error: errorMessage, details: err.statusMessage || '' })
        };
    }
};
