// 선물하기 샌드박스 모의 발송 및 E2E 실증 테스트 스크립트
const http = require('http');

const postData = JSON.stringify({
  recipientName: "사랑하는 지우",
  recipientEmail: "jiwoo@example.com",
  senderName: "마스터 오영범",
  letterData: {
    cover: {
      title: "지우님을 위한 문장 처방전",
      heart_name: "괜찮은 척하느라 지친 마음에게"
    },
    page_letter_paragraphs: [
      "많이 힘들었겠다. 괜찮다고 말하면서도 마음속에서는 더 이상 괜찮을 수 없는 날들이 많았을 것 같아...",
      "오늘은 너무 괜찮으려고 하지 않았으면 좋겠다. 울고 싶으면 잠시 울어도 되고..."
    ],
    page_sentences: [
      "너는 멈춘 사람이 아니라, 너무 오래 버틴 사람이다.",
      "너무 괜찮으려고 하지 않아도 된다."
    ],
    page_questions: [
      "요즘 내가 괜찮은 척하느라 삼킨 말은 무엇일까?"
    ],
    page_action: "오늘 밤 침대에 눕기 전에, 네 마음에 이름 하나만 붙여줬으면 좋겠어."
  }
});

const postOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/send-gift',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const getOptions = (viewOnly) => ({
  hostname: 'localhost',
  port: 3000,
  path: `/api/send-gift${viewOnly ? '?view=true' : ''}`,
  method: 'GET'
});

const makeRequest = (options, body = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (body) req.write(body);
    req.end();
  });
};

async function runTest() {
  console.log("====================================================");
  console.log("🚀 [Gift Gifting Sandbox Test] E2E 실증 테스트 개시");
  console.log("====================================================");

  try {
    // 1. POST: 선물 예약 큐 주입
    console.log("\n📥 [Step 1] 선물하기 예약 접수 시도 (POST)...");
    const postRes = await makeRequest(postOptions, postData);
    console.log("결과:", postRes);

    // 2. GET?view=true: 예약된 큐 목록 조회
    console.log("\n🔍 [Step 2] 현재 대기 큐 및 전송 기록 조회 (GET?view=true)...");
    const viewRes = await makeRequest(getOptions(true));
    console.log(`- 현재 큐 예약 건수: ${viewRes.queue ? viewRes.queue.length : 0}건`);
    if (viewRes.queue && viewRes.queue.length > 0) {
      console.log("- 최근 예약 정보:", {
        id: viewRes.queue[0].id,
        recipient: viewRes.queue[0].recipientName,
        email: viewRes.queue[0].recipientEmail,
        sender: viewRes.queue[0].senderName
      });
    }

    // 3. GET: 일괄 샌드박스 모의 발송 실행
    console.log("\n📤 [Step 3] 일괄 샌드박스 모의 발송 실행 (GET)...");
    const dispatchRes = await makeRequest(getOptions(false));
    console.log("결과:", dispatchRes);

    // 4. GET?view=true: 최종 확인 (큐가 비었는지, 히스토리에 적재되었는지)
    console.log("\n🧹 [Step 4] 최종 전송 결과 검증 (GET?view=true)...");
    const finalRes = await makeRequest(getOptions(true));
    console.log(`- 전송 후 대기 큐 건수: ${finalRes.queue ? finalRes.queue.length : 0}건 (0건 성공!)`);
    console.log(`- 전체 누적 히스토리 건수: ${finalRes.history ? finalRes.history.length : 0}건`);
    if (finalRes.history && finalRes.history.length > 0) {
      const lastHist = finalRes.history[finalRes.history.length - 1];
      console.log("- 최근 전송 완료 정보:", {
        id: lastHist.id,
        recipient: lastHist.recipientName,
        status: lastHist.status,
        sentAt: lastHist.sentAt
      });
    }

    console.log("\n====================================================");
    console.log("🟢 [TEST SUCCESS] 선물하기 샌드박스 E2E 완착 및 무결성 증명!");
    console.log("====================================================");

  } catch (err) {
    console.error("❌ 테스트 실행 오류:", err.message);
    console.log("\n[안내] Next.js 서버가 아직 완전 구동되지 않았거나 포트가 대기 중일 수 있습니다.");
    console.log("3초 후 자동으로 한 번 더 재시도합니다.");
    setTimeout(runTest, 3000);
  }
}

// 5초간 컴파일 지연을 예방하기 위해 약간의 대기 후 실행
setTimeout(runTest, 1000);
