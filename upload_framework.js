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

    console.log("Uploading psychology_framework.md...");
    const filePath = path.join(__dirname, 'psychology_framework.md');
    const file = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: "assistants",
    });
    console.log("File uploaded. ID:", file.id);

    console.log("Creating Advanced Vector Store...");
    const vectorStore = await openai.vectorStores.create({
      name: "Advanced Psychology Knowledge Base",
      file_ids: [file.id]
    });
    console.log("Vector Store created. ID:", vectorStore.id);

    console.log("Creating Upgraded Assistant...");
    const assistant = await openai.beta.assistants.create({
      name: "Master Psychological Counselor",
      instructions: "당신은 세계 최고의 심리 상담사입니다. 첨부된 심리학 교과서 및 논문 자료(File Search)를 철저히 검색하여 사용자의 사연을 깊이 있게 분석하세요. 답변은 CBT, ACT, 자기연민 등 구체적인 이론을 바탕으로 작성해야 하며, 아래의 JSON 포맷을 엄격히 준수하세요.\n\n{\"letter\": \"심리학 이론을 바탕으로 한 1000자 분량의 따뜻하고 깊이 있는 공감 편지 (영문)\", \"action\": \"오늘 당장 실천할 수 있는 구체적인 행동 지침 1가지 (영문)\"}\n\nDo not include any markdown formatting like ```json in the output. Just return the raw JSON object.",
      model: "gpt-4o-mini",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id]
        }
      }
    });
    console.log("Assistant created! ID:", assistant.id);

    console.log("Updating .env.local...");
    const updatedEnv = envContent.replace(/OPENAI_ASSISTANT_ID=".*?"/, `OPENAI_ASSISTANT_ID="${assistant.id}"`);
    fs.writeFileSync(envPath, updatedEnv, 'utf8');
    console.log("✅ Success! The new Master Assistant is ready.");
  } catch (e) {
    console.error(e);
  }
}

main();
