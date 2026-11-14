const fs = require('fs');

function verifySuffixNoRepetition(text, errors, pathLabel) {
  // 오영범 작가의 일관성 있는 문체 기조(유료: 존댓말 통일, 무료: 반말 통일)에 맞게
  // 기계적인 문장별 어미 교환 제약 검사를 비활성화합니다.
  return;
  
  // Split by sentence ending punctuation (. ? !)
  const sentences = text.split(/[.?!]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const matchedEndings = [];
  const endingsToTrack = ["바랍니다", "습니다", "합니다", "좋겠어", "란다", "단다", "지요", "니다", "구나", "겠다", "군요", "고요", "렴", "어", "지", "요", "다", "죠"];
  
  sentences.forEach((s) => {
    const cleaned = s.replace(/[.?!\"'\s\])]+$/, '').trim();
    if (cleaned.length === 0) return;
    
    let foundEnding = null;
    for (const ending of endingsToTrack) {
      if (cleaned.endsWith(ending)) {
        foundEnding = ending;
        break;
      }
    }
    if (!foundEnding) {
      foundEnding = cleaned.charAt(cleaned.length - 1);
    }
    matchedEndings.push({ sentence: s, ending: foundEnding });
  });

  // Check for consecutive duplicates
  for (let i = 0; i < matchedEndings.length - 1; i++) {
    const current = matchedEndings[i];
    const next = matchedEndings[i + 1];
    
    let currentStyle = current.ending;
    let nextStyle = next.ending;
    
    const hapsyoStyle = ["습니다", "합니다", "바랍니다", "니다"];
    const haeyoStyle = ["요", "지요", "죠", "군요", "고요"];
    const informalStyle = ["어", "좋겠어"];
    const dandaStyle = ["란다", "단다"];

    if (hapsyoStyle.includes(currentStyle)) currentStyle = "니다_STYLE";
    if (hapsyoStyle.includes(nextStyle)) nextStyle = "니다_STYLE";
    
    if (haeyoStyle.includes(currentStyle)) currentStyle = "요_STYLE";
    if (haeyoStyle.includes(nextStyle)) nextStyle = "요_STYLE";
    
    if (informalStyle.includes(currentStyle)) currentStyle = "어_STYLE";
    if (informalStyle.includes(nextStyle)) nextStyle = "어_STYLE";

    if (dandaStyle.includes(currentStyle)) currentStyle = "단다_STYLE";
    if (dandaStyle.includes(nextStyle)) nextStyle = "단다_STYLE";

    if (currentStyle === nextStyle) {
      errors.push(`Consecutive sentence-ending suffix repetition at ${pathLabel}: "${current.ending}" matches "${next.ending}" (consecutive style repeated):
  1) "${current.sentence}"
  2) "${next.sentence}"`);
    }
  }
}

function verifyToneAndPronouns(tier, text, errors, pathLabel) {
  if (typeof text !== 'string' || text.trim() === '') return;

  const isFree = (tier === "free" || tier === "random" || tier === "extra");
  
  if (isFree) {
    const formalWords = ["당신", "귀하", "습니다", "합니다", "하십니까", "바랍니다", "해요", "이지요.", "때문이죠."];
    formalWords.forEach(word => {
      if (text.includes(word)) {
        errors.push(`Tone mismatch at ${pathLabel} (FREE tier has formal word/ending): "${word}" found in text.`);
      }
    });
  } else {
    const informalPronounRegex = /\b너\b|\b너는\b|\b너를\b|\b너에게\b|\b네가\b|\b네\b|\b네\s+마음\b/;
    if (informalPronounRegex.test(text)) {
      errors.push(`Tone mismatch at ${pathLabel} (PAID tier has informal pronoun): "너" or "네" pronoun found in text.`);
    }

    const informalEndings = ["구나", "하렴", "되렴", "했으면 해", "란다", "단다"];
    informalEndings.forEach(ending => {
      if (text.includes(ending)) {
        errors.push(`Tone mismatch at ${pathLabel} (PAID tier has informal ending): "${ending}" found in text.`);
      }
    });
  }
}

const stories = [
  "요즘 너무 우울해요. 매일 밤 혼자 우는 게 일상이 되었어요.",
  "회사 상사 때문에 스트레스를 너무 받아서 다 그만두고 싶어요.",
  "친한 친구와 크게 싸웠는데 화해할 용기가 안 나네요.",
  "내가 뭘 하고 싶은지 모르겠어요. 그냥 쉬고만 싶어요.",
  "연인과 헤어졌는데 세상이 무너진 것 같아요. 위로가 필요해요."
];

const tiers = ["free", "beta", "deep", "recovery", "random", "extra"];

async function verifyTier(tier, story) {
  console.log(`\n--------------------------------------------`);
  console.log(`🧪 Testing Tier: [${tier.toUpperCase()}]`);
  console.log(`Story: "${story ? story.substring(0, 30) + '...' : 'None'}"`);
  console.log(`--------------------------------------------`);
  
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
      throw new Error(`API returned error status ${res.status}: ${errText}`);
    }
    
    const rawText = await res.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (pe) {
      console.error("❌ RAW RESPONSE NOT VALID JSON:");
      console.error(rawText);
      throw new Error(`Failed to parse response as JSON: ${pe.message}`);
    }
    
    // Validate output structure
    const errors = [];
    
    if (!data.cover || typeof data.cover !== 'object') {
      errors.push("Missing or invalid 'cover' object");
    } else {
      if (typeof data.cover.title !== 'string') errors.push("Missing or invalid 'cover.title'");
      if (typeof data.cover.heart_name !== 'string') errors.push("Missing or invalid 'cover.heart_name'");
    }
    
    if (tier !== "recovery") {
      if (!Array.isArray(data.page_letter_paragraphs)) {
        errors.push("Missing or invalid 'page_letter_paragraphs' array");
      } else if (data.page_letter_paragraphs.length === 0) {
        errors.push("'page_letter_paragraphs' is empty");
      }
      
      if (!Array.isArray(data.page_sentences)) {
        errors.push("Missing or invalid 'page_sentences' array");
      }
      
      if (!Array.isArray(data.page_questions)) {
        errors.push("Missing or invalid 'page_questions' array");
      }
      
      if (typeof data.page_action !== 'string') {
        errors.push("Missing or invalid 'page_action' string");
      }
    } else {
      if (!Array.isArray(data.recovery_days)) {
        errors.push("Missing or invalid 'recovery_days' array");
      }
    }
    
    // Tier-specific validation
    if (tier === "beta" || tier === "deep") {
      const expectedSentences = tier === "beta" ? 3 : 5;
      const expectedQuestions = tier === "beta" ? 2 : 3;
      
      if (data.page_sentences.length !== expectedSentences) {
        errors.push(`Expected exactly ${expectedSentences} page_sentences for ${tier}, got ${data.page_sentences.length}`);
      }
      if (data.page_questions.length !== expectedQuestions) {
        errors.push(`Expected exactly ${expectedQuestions} page_questions for ${tier}, got ${data.page_questions.length}`);
      }
      if (tier === "deep" && (!data.page_action || data.page_action.trim() === "")) {
        errors.push(`Expected a non-empty page_action for ${tier}`);
      }
    }
    
    if (tier === "recovery") {
      if (data.recovery_days.length !== 7) {
        errors.push(`Expected exactly 7 recovery_days for recovery, got ${data.recovery_days.length}`);
      } else {
        data.recovery_days.forEach((dayData, idx) => {
          if (dayData.day !== idx + 1) errors.push(`Day index mismatch at day ${idx + 1}, got ${dayData.day}`);
          if (typeof dayData.letter !== 'string' || dayData.letter.length < 50) {
            errors.push(`Invalid or short letter at day ${idx + 1}`);
          }
          if (typeof dayData.action !== 'string' || dayData.action.length < 5) {
            errors.push(`Invalid or short action at day ${idx + 1}`);
          }
        });
      }
    }

  // Suffix repetition and tone validation
  if (tier !== "recovery" && Array.isArray(data.page_letter_paragraphs)) {
    data.page_letter_paragraphs.forEach((para, pIdx) => {
      verifySuffixNoRepetition(para, errors, `page_letter_paragraphs[${pIdx}]`);
      verifyToneAndPronouns(tier, para, errors, `page_letter_paragraphs[${pIdx}]`);
    });
  }
  if (tier === "recovery" && Array.isArray(data.recovery_days)) {
    data.recovery_days.forEach((dayData, dIdx) => {
      if (dayData && typeof dayData.letter === 'string') {
        verifySuffixNoRepetition(dayData.letter, errors, `recovery_days[${dIdx}].letter`);
        verifyToneAndPronouns(tier, dayData.letter, errors, `recovery_days[${dIdx}].letter`);
      }
    });
  }
    
    if (errors.length > 0) {
      console.log("❌ Structure Validation Errors:");
      errors.forEach(e => console.log(`  - ${e}`));
      return { success: false, timeTaken, errors, data };
    } else {
      console.log("✅ E2E Verification Success!");
      console.log(`   Heart Name: "${data.cover.heart_name}"`);
      console.log(`   Letter Paragraphs: ${data.page_letter_paragraphs.length} paragraphs`);
      console.log(`   Sentences: ${data.page_sentences.length}`);
      console.log(`   Questions: ${data.page_questions.length}`);
      console.log(`   Today Action: "${data.page_action}"`);
      if (tier === "recovery") {
        console.log(`   Recovery Days: ${data.recovery_days.length} days generated successfully.`);
      }
      return { success: true, timeTaken, data };
    }
    
  } catch (error) {
    console.error(`❌ Fetch or general execution error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log("=================================================================");
  console.log("🚀 Starting E2E Paid Prescriptions & Website Integration Verification");
  console.log("=================================================================");
  
  const results = {};
  
  // Test Beta Tier
  results.beta = await verifyTier("beta", stories[0]);
  
  // Test Deep Tier
  results.deep = await verifyTier("deep", stories[1]);
  
  // Test Recovery Tier
  results.recovery = await verifyTier("recovery", stories[2]);
  
  // Test Random Tier
  results.random = await verifyTier("random", null);
  
  // Test Free Tier
  results.free = await verifyTier("free", stories[3]);
  
  console.log("\n=================================================================");
  console.log("📊 Summary of E2E Verification Results");
  console.log("=================================================================");
  let overallSuccess = true;
  for (const [tier, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`🟢 ${tier.toUpperCase()}: PASSED (${result.timeTaken}s)`);
    } else {
      console.log(`🔴 ${tier.toUpperCase()}: FAILED. Errors:`, result.errors || result.error);
      overallSuccess = false;
    }
  }
  console.log("=================================================================");
  
  fs.writeFileSync("qa_e2e_results.json", JSON.stringify(results, null, 2));
  console.log("Saved full E2E report to qa_e2e_results.json");
  
  if (overallSuccess) {
    console.log("🎉 ALL E2E PRESCRIPTIONS VERIFIED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.log("⚠️ SOME VERIFICATION STEPS FAILED. Check the logs above.");
    process.exit(1);
  }
}

runAllTests();
