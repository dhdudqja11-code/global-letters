const fs = require('fs');

const stories = [
  "요즘 너무 우울해요. 매일 밤 혼자 우는 게 일상이 되었어요.",
  "회사 상사 때문에 스트레스를 너무 받아서 다 그만두고 싶어요.",
  "친한 친구와 크게 싸웠는데 화해할 용기가 안 나네요.",
  "내가 뭘 하고 싶은지 모르겠어요. 그냥 쉬고만 싶어요.",
  "연인과 헤어졌는데 세상이 무너진 것 같아요. 위로가 필요해요."
];

async function runTests() {
  const results = [];
  for (let i = 0; i < 5; i++) {
    console.log(`[Test ${i + 1}/5] Starting... (Story: ${stories[i].substring(0, 10)}...)`);
    const startTime = Date.now();
    try {
      // 1. Fetching the local API
      const res = await fetch("http://localhost:3000/api/generate-letter", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "x-forwarded-for": `192.168.0.${i+1}` // IP 우회 (레이트 리미트 방지, beta는 안걸리지만 혹시나)
        },
        body: JSON.stringify({
          story: stories[i],
          productType: "beta",
          language: "ko"
        })
      });
      
      const responseText = await res.text();
      const elapsed = Date.now() - startTime;
      
      try {
        const data = JSON.parse(responseText);
        results.push({
          test: i + 1,
          time_ms: elapsed,
          status: res.status,
          success: true,
          cover: data.cover,
          sample_paragraph: data.page_letter_paragraphs ? data.page_letter_paragraphs[0] : null
        });
        console.log(`[Test ${i + 1}] Success in ${elapsed}ms`);
      } catch (parseError) {
        results.push({
          test: i + 1,
          time_ms: elapsed,
          status: res.status,
          success: false,
          error: "JSON Parsing Failed",
          raw_output: responseText
        });
        console.log(`[Test ${i + 1}] Failed: JSON Parsing error`);
      }
    } catch (e) {
      results.push({ test: i + 1, success: false, error: e.toString() });
      console.log(`[Test ${i + 1}] Error: ${e.toString()}`);
    }
  }
  
  fs.writeFileSync("test_results.json", JSON.stringify(results, null, 2));
  console.log("All 5 tests completed. Results saved to test_results.json");
}

runTests();
