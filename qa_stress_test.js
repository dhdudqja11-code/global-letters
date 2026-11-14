const story = "I am so overwhelmed with work. My boss keeps piling on tasks and I feel like I'm drowning. I'm starting to hate my life and I can't sleep at night.";

async function runStressTest() {
  console.log("==========================================");
  console.log("🚀 AI 다양성 스트레스 테스트 (10회 연속 실행)");
  console.log("동일 사연: " + story);
  console.log("==========================================\n");

  const results = [];

  for (let i = 0; i < 10; i++) {
    console.log(`[테스트 ${i + 1}/10] 실행 중...`);
    const startTime = Date.now();
    try {
      const res = await fetch("http://localhost:3000/api/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story, isPremium: true })
      });
      
      const data = await res.json();
      const endTime = Date.now();
      
      results.push({
        id: i + 1,
        time: ((endTime - startTime) / 1000).toFixed(1),
        action: data.action,
        letterSnippet: data.letter ? data.letter.substring(0, 100) + "..." : "N/A"
      });
      
      console.log(`✅ 완료 (${results[i].time}초) -> 지침: ${data.action.substring(0, 50)}...`);
    } catch (e) {
      console.error("❌ 에러:", e.message);
    }
  }

  console.log("\n==========================================");
  console.log("📊 최종 요약 (행동 지침 모음)");
  console.log("==========================================");
  results.forEach(r => {
    console.log(`${r.id}. [${r.time}s] ${r.action}`);
  });
}

runStressTest();
