// kakao-webhook-server.js
// Node.js + Express + Axios 기반 카카오 i 오픈빌더 Webhook 서버

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const MAKE_WEBHOOK_URL =
  process.env.MAKE_WEBHOOK_URL ||
  'https://hook.eu2.make.com/vfxnus1ei4omfma2up1d9cxor6161mbc';

function kakaoSimpleText(message) {
  return {
    version: '2.0',
    template: {
      outputs: [
        {
          simpleText: {
            text: message,
          },
        },
      ],
    },
  };
}

function parseCommand(text) {
  text = (text || '').trim();
  let m = text.match(/^(출근|ㅎㅇ)(\d+)$/);
  if (m) return { command: 'check_in', employee_no: String(m[2]) };

  m = text.match(/^(퇴근|ㅂㅇ)(\d+)$/);
  if (m) return { command: 'check_out', employee_no: String(m[2]) };

  m = text.match(/^(\d+)번\s+(.+)$/);
  if (m) return { command: 'register_employee', employee_no: String(m[1]), name: m[2] };

  m = text.match(/^(\d+)번\s*누적근무일수\s*(\d+)일\s*추가$/);
  if (m) return { command: 'add_days', employee_no: String(m[1]), amount: Number(m[2]) };

  m = text.match(/^(\d+)번\s*누적근무일수\s*(\d+)일\s*제거$/);
  if (m) return { command: 'remove_days', employee_no: String(m[1]), amount: Number(m[2]) };

  return null;
}

app.post('/kakao', async (req, res) => {
  try {
    const utterance = (req.body.userRequest?.utterance || '').trim();
    const commandData = parseCommand(utterance);

    if (!commandData)
      return res.json(kakaoSimpleText('지원하지 않는 형식입니다.'));

    let makeResponse = await axios.post(MAKE_WEBHOOK_URL, commandData);
    const message = makeResponse.data?.message;

    if (!message)
      return res.json(kakaoSimpleText('message 필드 없음'));

    return res.json(kakaoSimpleText(message));
  } catch (e) {
    return res.json(kakaoSimpleText('서버 내부 오류'));
  }
});

module.exports = app;
