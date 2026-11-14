const fs = require('fs');
const path = require('path');
const OpenAI = require('openai'); // Make sure to run this in the global-letters directory

async function main() {
  try {
    console.log("==========================================");
    console.log("🤖 AI 수석 상담사(Assistant) 자동 생성 시작");
    console.log("==========================================\n");

    console.log("[1/5] API 키 읽어오는 중...");
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const apiKeyMatch = envContent.match(/OPENAI_API_KEY="(.*?)"/);
    
    if (!apiKeyMatch || !apiKeyMatch[1] || apiKeyMatch[1].startsWith("여기에_")) {
      throw new Error("❌ .env.local 파일에서 유효한 OPENAI_API_KEY를 찾을 수 없습니다.");
    }
    
    const apiKey = apiKeyMatch[1];
    const openai = new OpenAI({ apiKey });
    console.log("✅ API 키 로드 완료.");

    console.log("\n[2/5] 심리학 지식 자료(본 계정 글.txt) 업로드 중...");
    const filePath = path.join(__dirname, '..', '본 계정 글.txt');
    
    if (!fs.existsSync(filePath)) {
       throw new Error(`❌ 자료 파일을 찾을 수 없습니다: ${filePath}`);
    }
    
    const file = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: "assistants",
    });
    console.log(`✅ 파일 업로드 완료 (ID: ${file.id})`);

    console.log("\n[3/5] 지식 저장소(Vector Store) 구축 중...");
    // Vector Store API takes time, sometimes requires polling, but create handles initial creation
    const vectorStore = await openai.vectorStores.create({
      name: "Global Letters Psychology Knowledge Base",
      file_ids: [file.id]
    });
    console.log(`✅ 지식 저장소 생성 완료 (ID: ${vectorStore.id})`);

    console.log("\n[4/5] 수석 상담사(Assistant) 임명 중...");
    const assistant = await openai.beta.assistants.create({
      name: "Global Psychological Counselor",
      instructions: "당신은 세계 최고의 심리 상담사입니다. 첨부된 심리학 논문과 자료(File Search)를 활용하여 사용자의 사연을 깊이 있게 분석하세요. 답변은 반드시 영문으로 작성해야 하며, 아래의 JSON 포맷을 엄격히 준수하세요.\n\n{\"letter\": \"CBT 및 자기연민 이론을 바탕으로 한 1000자 분량의 따뜻하고 깊이 있는 공감 편지 (영문)\", \"action\": \"오늘 당장 실천할 수 있는 구체적인 행동 지침 1가지 (영문)\"}",
      model: "gpt-4o-mini",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id]
        }
      }
    });
    console.log(`✅ 수석 상담사 생성 완료! (ID: ${assistant.id})`);

    console.log("\n[5/5] 서버 설정 파일(.env.local) 자동 업데이트 중...");
    // Update the OPENAI_ASSISTANT_ID line
    const updatedEnv = envContent.replace(
      /OPENAI_ASSISTANT_ID=".*?"/, 
      `OPENAI_ASSISTANT_ID="${assistant.id}"`
    );
    
    fs.writeFileSync(envPath, updatedEnv, 'utf8');
    console.log(`✅ 설정 파일 업데이트 성공!`);
    
    console.log("\n✨ 모든 자동화 설정이 완벽하게 끝났습니다! 이제 서버를 재시작하세요.");

  } catch (error) {
    console.error("\n❌ 오류 발생:", error.message || error);
  }
}

main();
