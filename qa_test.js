const stories = [
  "I got laid off yesterday after 10 years of loyal service. I feel like my entire identity is gone and I don't know who I am anymore. I just sit in the dark.",
  "My partner of 5 years just left me without any explanation. I keep blaming myself, thinking I wasn't attractive enough or good enough.",
  "I am a mother of two and I feel completely burned out. I snap at my kids and then I feel immense guilt. I feel like a terrible mother.",
  "I have a massive presentation tomorrow and I am paralyzed by fear. If I mess this up, my career is over. My heart is pounding constantly.",
  "I feel nothing. I wake up, go to work, come home, and stare at the wall. I don't feel sad, I just feel completely empty and disconnected from the world."
];

async function runTests() {
  console.log("==========================================");
  console.log("🧪 AI 심리 상담사 품질 테스트 (5회 연속 실행)");
  console.log("==========================================\n");

  let successCount = 0;

  for (let i = 0; i < stories.length; i++) {
    console.log(`\n[테스트 ${i + 1}/5] 사연 분석 중...`);
    console.log(`사연 요약: "${stories[i].substring(0, 50)}..."`);
    
    const startTime = Date.now();
    try {
      const res = await fetch("http://localhost:3000/api/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: stories[i], isPremium: true })
      });
      
      const data = await res.json();
      const endTime = Date.now();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(1);
      
      if (!res.ok) {
        console.error(`❌ 에러 발생 (${res.status} 상태 코드):`, data);
      } else {
        console.log(`✅ 응답 성공 (소요 시간: ${timeTaken}초)`);
        console.log(`📝 편지 길이: ${data.letter ? data.letter.length : 0}자`);
        console.log(`🏃 행동 지침: ${data.action}`);
        successCount++;
      }
    } catch (e) {
      console.error("❌ 네트워크 오류:", e.message);
    }
  }

  console.log("\n==========================================");
  console.log(`📊 테스트 결과: 5개 중 ${successCount}개 성공`);
  console.log("==========================================");
}

runTests();
