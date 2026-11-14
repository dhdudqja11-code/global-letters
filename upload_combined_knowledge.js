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

    console.log("1. Uploading 'psychology_framework.md'...");
    const file1Path = path.join(__dirname, 'psychology_framework.md');
    const file1 = await openai.files.create({
      file: fs.createReadStream(file1Path),
      purpose: "assistants",
    });
    console.log("   -> Uploaded. ID:", file1.id);

    console.log("2. Uploading '심리학의 총론.md'...");
    const file2Path = path.join(__dirname, '..', '심리학의 총론.md');
    const file2 = await openai.files.create({
      file: fs.createReadStream(file2Path),
      purpose: "assistants",
    });
    console.log("   -> Uploaded. ID:", file2.id);

    console.log("3. Creating Ultimate Vector Store...");
    const vectorStore = await openai.vectorStores.create({
      name: "Ultimate Psychology Knowledge Base",
      file_ids: [file1.id, file2.id]
    });
    console.log("   -> Vector Store created. ID:", vectorStore.id);

    console.log("4. Creating Ultimate Assistant (GPT-4o)...");
    const assistant = await openai.beta.assistants.create({
      name: "Ultimate Psychological Counselor",
      instructions: "당신은 세계 최고의 심리 상담사입니다. 첨부된 '심리학의 총론'과 '심리학 실무 프레임워크' 두 가지 방대한 지식 자료(File Search)를 철저히 교차 검증하여 사용자의 사연을 깊이 있게 분석하세요. 근본 원인(예: 방어기제, 애착 문제, 신경생물학적 요인)을 찾고, 실무적인 해결책(CBT, ACT 등)을 도출해야 합니다. 답변은 반드시 영문으로 작성하되, 아래의 JSON 포맷을 엄격히 준수하세요.\n\n{\"letter\": \"심리학 이론을 바탕으로 한 1000자 분량의 따뜻하고 통찰력 있는 공감 편지 (영문)\", \"action\": \"오늘 당장 실천할 수 있는 구체적인 행동 지침 1가지 (영문)\"}\n\nDo not include any markdown formatting like ```json in the output. Just return the raw JSON object.",
      model: "gpt-4o", // 업그레이드된 지능
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id]
        }
      }
    });
    console.log("   -> Assistant created! ID:", assistant.id);

    console.log("5. Updating .env.local...");
    const updatedEnv = envContent.replace(/OPENAI_ASSISTANT_ID=".*?"/, `OPENAI_ASSISTANT_ID="${assistant.id}"`);
    fs.writeFileSync(envPath, updatedEnv, 'utf8');
    console.log("✅ Success! The Ultimate Assistant is ready.");
  } catch (e) {
    console.error(e);
  }
}

main();
