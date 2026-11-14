const fs = require('fs');
const path = require('path');

const stories = [
  "요즘 너무 우울해요. 매일 밤 혼자 우는 게 일상이 되었어요.",
  "회사 상사 때문에 스트레스를 너무 받아서 다 그만두고 싶어요.",
  "친한 친구와 크게 싸웠는데 화해할 용기가 안 나네요.",
  "내가 뭘 하고 싶은지 모르겠어요. 그냥 쉬고만 싶어요.",
  "연인과 헤어졌는데 세상이 무너진 것 같아요. 위로가 필요해요."
];

async function verifyTier(tier, story) {
  console.log(`\n============================================`);
  console.log(`🧪 [SPEC CHECK] Testing Tier: ${tier.toUpperCase()}`);
  console.log(`============================================`);
  
  const startTime = Date.now();
  try {
    const res = await fetch("http://localhost:3000/api/generate-letter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        story: story,
        productType: tier,
        language: "ko"
      })
    });
    
    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Response Status: ${res.status} (Time: ${timeTaken}s)`);
    
    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `API error ${res.status}: ${errText}` };
    }
    
    const data = await res.json();
    const errors = [];
    const specs = {};

    // 1. 공통 필드 및 기본 타입 체크
    if (!data.cover || typeof data.cover !== 'object') {
      errors.push("Missing 'cover' object");
    }
    
    const letterText = (data.page_letter_paragraphs || []).join("\n\n") || data.letter || "";
    const letterCharCount = letterText.length;
    specs.letterCharCount = letterCharCount;
    specs.paragraphsCount = data.page_letter_paragraphs ? data.page_letter_paragraphs.length : 0;

    // 2. 티어별 스펙 매칭 상세 검증
    if (tier === "free") {
      // 00 무료 안부 편지: 600글자 내외 (500~700자), 2문단
      console.log(`[free] Letter Char Count: ${letterCharCount} (Expected: ~600자)`);
      console.log(`[free] Paragraphs Count: ${specs.paragraphsCount} (Expected: 2)`);
      if (letterCharCount < 450 || letterCharCount > 750) {
        errors.push(`[free] 글자수가 규격(600자 내외, 450~750자 허용)을 벗어남: ${letterCharCount}자`);
      }
      if (specs.paragraphsCount !== 2) {
        errors.push(`[free] 문단 수가 2문단이 아님: ${specs.paragraphsCount}개`);
      }
      // 무료 편지는 오래 간직할 문장 묶음(page_sentences), 질문(page_questions), 작은행동(page_action)을 제공하지 않음
      if (data.page_sentences && data.page_sentences.length > 0) {
        errors.push(`[free] 무료 편지는 '간직할 문장'을 제공해선 안 됨`);
      }
      if (data.page_questions && data.page_questions.length > 0) {
        errors.push(`[free] 무료 편지는 '나에게 묻는 질문'을 제공해선 안 됨`);
      }
      if (data.page_action && data.page_action.trim() !== "") {
        errors.push(`[free] 무료 편지는 '오늘의 행동'을 제공해선 안 됨`);
      }
    } 
    
    else if (tier === "beta") {
      // 02 beta: 맞춤 편지 900~1,200자, 오래 간직할 문장 3개, 나에게 묻는 질문 2개
      console.log(`[beta] Letter Char Count: ${letterCharCount} (Expected: 900~1200자)`);
      console.log(`[beta] Sentences Count: ${data.page_sentences ? data.page_sentences.length : 0} (Expected: 3)`);
      console.log(`[beta] Questions Count: ${data.page_questions ? data.page_questions.length : 0} (Expected: 2)`);
      
      if (letterCharCount < 900 || letterCharCount > 1300) {
        errors.push(`[beta] 편지 글자수 규격(900~1,200자) 불일치: ${letterCharCount}자`);
      }
      if (!data.page_sentences || data.page_sentences.length !== 3) {
        errors.push(`[beta] 오래 간직할 문장이 3개가 아님: ${data.page_sentences ? data.page_sentences.length : 0}개`);
      }
      if (!data.page_questions || data.page_questions.length !== 2) {
        errors.push(`[beta] 질문이 2개가 아님: ${data.page_questions ? data.page_questions.length : 0}개`);
      }
    } 
    
    else if (tier === "deep") {
      // 03 깊은 beta: 맞춤 편지 1,800~2,500자, 오래 간직할 문장 5개, 나에게 묻는 질문 3개, 3일 문장 3개, 작은행동 1개
      console.log(`[deep] Letter Char Count: ${letterCharCount} (Expected: 1800~2500자)`);
      console.log(`[deep] Sentences Count: ${data.page_sentences ? data.page_sentences.length : 0} (Expected: 5)`);
      console.log(`[deep] Questions Count: ${data.page_questions ? data.page_questions.length : 0} (Expected: 3)`);
      
      if (letterCharCount < 1700 || letterCharCount > 2600) {
        errors.push(`[deep] 편지 글자수 규격(1,800~2,500자) 불일치: ${letterCharCount}자`);
      }
      if (!data.page_sentences || data.page_sentences.length !== 5) {
        errors.push(`[deep] 오래 간직할 문장이 5개가 아님: ${data.page_sentences ? data.page_sentences.length : 0}개`);
      }
      if (!data.page_questions || data.page_questions.length !== 3) {
        errors.push(`[deep] 질문이 3개가 아님: ${data.page_questions ? data.page_questions.length : 0}개`);
      }
      if (!data.page_action || data.page_action.trim() === "") {
        errors.push(`[deep] 사연에서 찾은 작은 행동이 없음`);
      }
    } 
    
    else if (tier === "recovery") {
      // 04 7일 회복 편지: 하루 분량 500~700자, 매일 문장 1개, 매일 작은 행동 1개, 마지막 날 정리 문장 3개
      console.log(`[recovery] Recovery Days Count: ${data.recovery_days ? data.recovery_days.length : 0} (Expected: 7)`);
      
      if (!data.recovery_days || data.recovery_days.length !== 7) {
        errors.push(`[recovery] 7일 회복 편지가 7일 분량이 아님: ${data.recovery_days ? data.recovery_days.length : 0}일`);
      } else {
        data.recovery_days.forEach((dayData, idx) => {
          const dayLen = dayData.letter ? dayData.letter.length : 0;
          console.log(`  - Day ${dayData.day} Letter Char Count: ${dayLen} (Expected: 500~700자)`);
          console.log(`  - Day ${dayData.day} Sentence Field Present: ${!!dayData.sentence}`);
          console.log(`  - Day ${dayData.day} Action Field Present: ${!!dayData.action}`);
          
          if (dayLen < 500 || dayLen > 750) {
            errors.push(`[recovery] Day ${dayData.day} 편지 글자수 규격(500~700자) 불일치: ${dayLen}자`);
          }
          if (!dayData.sentence || dayData.sentence.trim() === "") {
            errors.push(`[recovery] Day ${dayData.day} 오래 간직할 '오늘의 문장 1개'가 없음`);
          }
          if (!dayData.action || dayData.action.trim() === "") {
            errors.push(`[recovery] Day ${dayData.day} '오늘의 작은 행동 1개'가 없음`);
          }
          
          // 7일차에는 정리 문장 3개가 있는지 확인
          if (dayData.day === 7) {
            console.log(`  - Day 7 Summary Sentences Present: ${dayData.summary_sentences ? dayData.summary_sentences.length : 'none'}`);
            if (!dayData.summary_sentences || !Array.isArray(dayData.summary_sentences) || dayData.summary_sentences.length !== 3) {
              errors.push(`[recovery] 7일차에 '정리 문장 3개'가 없음 또는 개수가 3개가 아님`);
            }
          }
        });
      }
    }

    if (errors.length > 0) {
      console.log(`❌ SPEC CHECK FAILED for [${tier.toUpperCase()}]:`);
      errors.forEach(e => console.log(`   - ${e}`));
      return { success: false, timeTaken, errors, data };
    } else {
      console.log(`✅ SPEC CHECK PASSED for [${tier.toUpperCase()}]!`);
      return { success: true, timeTaken, data };
    }

  } catch (error) {
    console.error(`❌ general execution error for [${tier}]:`, error.message);
    return { success: false, error: error.message };
  }
}

async function run() {
  const results = {};
  results.free = await verifyTier("free", stories[0]);
  results.beta = await verifyTier("beta", stories[1]);
  results.deep = await verifyTier("deep", stories[2]);
  results.recovery = await verifyTier("recovery", stories[3]);
  
  console.log("\n=============================================");
  console.log("📊 Summary of Spec Checker");
  console.log("=============================================");
  for (const [tier, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`🟢 ${tier.toUpperCase()}: PASSED (${result.timeTaken}s)`);
    } else {
      console.log(`🔴 ${tier.toUpperCase()}: FAILED`);
    }
  }
  console.log("=============================================");
}

run();
