// api/kakao.js
const axios = require("axios");

const MAKE_WEBHOOK_URL =
  process.env.MAKE_WEBHOOK_URL ||
  "https://hook.eu2.make.com/vfxnus1ei4omfma2up1d9cxor6161mbc";

function kakaoSimpleText(message) {
  return {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: { text: message },
        },
      ],
    },
  };
}

function parseCommand(text) {
  text = (text || "").trim();
  let m = text.match(/^(출근|ㅎㅇ)(\d+)$/);
  if (m) return { command: "check_in", employee_no: m[2] };

  m = text.match(/^(퇴근|ㅂㅇ)(\d+)$/);
  if (m) return { command: "check_out", employee_no: m[2] };

  m = text.match(/^(\d+)번\s+(.+)$/);
  if (m)
    return {
      command: "register_employee",
      employee_no: m[1],
      name: m[2],
    };

  m = text.match(/^(\d+)번\s*누적근무일수\s*(\d+)일\s*추가$/);
  if (m) return { command: "add_days", employee_no: m[1], amount: Number(m[2]) };

  m = text.match(/^(\d+)번\s*누적근무일수\s*(\d+)일\s*제거$/);
  if (m)
    return { command: "remove_days", employee_no: m[1], amount: Number(m[2]) };

  return null;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const utterance = req.body?.userRequest?.utterance?.trim() || "";
    const commandData = parseCommand(utterance);

    if (!commandData) {
      return res.json(kakaoSimpleText("지원하지 않는 형식입니다."));
    }

    const makeResponse = await axios.post(MAKE_WEBHOOK_URL, commandData, {
      headers: { "Content-Type": "application/json" },
    });

    const message = makeResponse.data?.message || "응답 오류";

    return res.json(kakaoSimpleText(message));
  } catch (err) {
    return res.json(kakaoSimpleText("서버 오류 발생"));
  }
};
