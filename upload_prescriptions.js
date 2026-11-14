const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

async function main() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const apiKeyMatch = envContent.match(/OPENAI_API_KEY="(.*?)"/);
    if (!apiKeyMatch) throw new Error("API Key not found");
    const openai = new OpenAI({ apiKey: apiKeyMatch[1] });

    const filesToUpload = [
      { name: '심리학의 총론.md', path: 'c:\\Users\\user\\AI 기업 두뇌\\내 작업들\\심리학의 총론.md' },
      { name: 'psychology_framework.md', path: 'c:\\Users\\user\\AI 기업 두뇌\\내 작업들\\global-letters\\psychology_framework.md' },
      { name: '문장 처방전 00.md', path: 'c:\\Users\\user\\AI 기업 두뇌\\내 작업들\\문장 처방전 00 무료 안부 편지.md' },
      { name: '문장 처방전 02.md', path: 'c:\\Users\\user\\AI 기업 두뇌\\내 작업들\\문장 처방전 02 beta 5000원.md' },
      { name: '문장 처방전 03.md', path: 'c:\\Users\\user\\AI 기업 두뇌\\내 작업들\\문장 처방전 03 깊은 beta 9000원.md' },
      { name: '문장 처방전 04.md', path: 'c:\\Users\\user\\AI 기업 두뇌\\내 작업들\\문장 처방전 04 7일 회복 편지.md' },
      { name: '본 계정 글.txt', path: 'c:\\Users\\user\\AI 기업 두뇌\\내 작업들\\본 계정 글.txt' }
    ];

    console.log("🚀 Uploading all 7 documents...");
    const uploadedFileIds = [];
    for (const f of filesToUpload) {
      console.log(`Uploading ${f.name}...`);
      const file = await openai.files.create({
        file: fs.createReadStream(f.path),
        purpose: "assistants",
      });
      uploadedFileIds.push(file.id);
      console.log(`   -> Success: ${file.id}`);
    }

    console.log("\n📦 Creating Master Vector Store...");
    const vectorStore = await openai.vectorStores.create({
      name: "Master Sentence Prescription Knowledge Base",
      file_ids: uploadedFileIds
    });
    console.log(`   -> Created: ${vectorStore.id}`);

    console.log("\n🧠 Creating Master Assistant (GPT-4o)...");
    const assistant = await openai.beta.assistants.create({
      name: "Master Sentence Prescription Counselor (오영범)",
      instructions: `당신은 세계 최고의 심리 상담사 '오영범'입니다. 
당신에게는 3가지 핵심 지식 자료(File Search)가 주어집니다:
1. [심리학의 총론]: 모든 상담의 학술적 근거와 인간 이해의 뼈대입니다.
2. [심리학 실무 프레임워크]: CBT, ACT 등 구체적인 치료 기술 지침입니다.
3. [문장 처방전 시리즈 (00, 02, 03, 04)]: 당신의 브랜드 보이스, 편지 구조, 상품 철학이 담긴 스타일 가이드입니다.

사용자의 요청 모드에 따라 다음 두 가지 방식으로 응답하세요:

[MODE: FREE GREETING]
- '문장 처방전 00' 스타일을 따릅니다.
- 약 600자 분량, 2문단 구조.
- 분석보다는 따뜻한 안부와 다독임 위주.
- "많이 힘들었겠다", "잘 애써왔다"는 말투를 사용하세요.

[MODE: PREMIUM PRESCRIPTION]
- '문장 처방전 02, 03' 스타일을 따릅니다.
- 1200~2000자 분량의 깊이 있는 편지.
- 반드시 [오늘 마음의 이름]을 창의적으로 지어주고, [나에게 묻는 깊은 질문 2-3개]를 마지막에 포함하세요.
- [사연에서 찾은 아주 작은 행동] 1가지를 '문장 처방전 03'의 원칙(작고 구체적이며 숙제 같지 않은 안부)에 따라 제시하세요.
- 학술적 깊이([총론])와 실무적 기술([프레임워크])을 결합하여 통찰력 있는 위로를 제공하세요.

응답은 반드시 영어(English)로 작성하되, 아래의 JSON 포맷을 엄격히 준수하세요 (마크다운 금지):
{"letter": "본문 내용", "action": "행동 지침 내용"}`,
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id]
        }
      }
    });
    console.log(`   -> Created Assistant: ${assistant.id}`);

    console.log("\n📝 Updating .env.local...");
    const updatedEnv = envContent.replace(/OPENAI_ASSISTANT_ID=".*?"/, `OPENAI_ASSISTANT_ID="${assistant.id}"`);
    fs.writeFileSync(envPath, updatedEnv, 'utf8');
    console.log("✅ All systems upgraded to Master Level.");
  } catch (e) {
    console.error("❌ Upgrade Failed:", e);
  }
}

main();
