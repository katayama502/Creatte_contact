import * as dotenv from 'dotenv';
dotenv.config();

import { handler } from './netlify/functions/sendPushMessage.js';

const mockEvent = {
  httpMethod: 'POST',
  headers: { authorization: 'Bearer DUMMY_TOKEN' },
  body: JSON.stringify({
    testLineId: 'U7562023e8ec2cc7373cfeddf8dca0757',
    text: 'テスト配信です'
  })
};

(async () => {
  try {
    const result = await handler(mockEvent, {});
    console.log('Function returned:', result);
  } catch (err) {
    console.error('Thrown error:', err);
  }
})();
