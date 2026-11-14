import fs from "fs";
import path from "path";
import OpenAI from "openai";

export interface ScientificPrescription {
  title: string;
  authors: string;
  source_url: string;
  insight_ko: string;
  rag_snippet?: string;
}

export interface EmotionProfile {
  emotions: {
    anxiety: number;
    helplessness: number;
    self_blame: number;
    sadness: number;
    loneliness: number;
  };
  defense_mechanism: string;
  core_pain_point: string;
  prescription_guideline: string;
}

/**
 * Node.js native port of scripts/query_knowledge.py
 * Preserves 100% of the emotion keyword classification, RAG paragraph search from 심리학의 총론.md,
 * and scientific reference mapping without requiring a Python binary on Vercel Serverless.
 */
export function queryKnowledge(story?: string): ScientificPrescription {
  if (!story || !story.trim()) {
    return {
      title: "Client-Centered Therapy and Personality Growth",
      authors: "Dr. Carl Rogers",
      source_url: "https://pubmed.ncbi.nlm.nih.gov/148943",
      insight_ko:
        "존재 자체에 대한 무조건적 수용과 존중은 뇌가 방어 기제를 풀고 스스로의 마음을 다스려 회복하도록 돕습니다.",
    };
  }

  let emotion = "default";
  const kw = story.toLowerCase();

  // 1. 감정 키워드 분류
  const burnoutWords = ["번아웃", "지침", "피로", "휴식", "포기", "성실", "일", "회사", "공부", "과부하", "숨", "쉬고"];
  const relationshipWords = ["이별", "사랑", "관계", "사람", "상처", "배신", "우정", "친구", "미움", "아픔", "눈물"];
  const anxietyWords = ["불안", "미래", "진로", "취업", "시험", "걱정", "두려움", "떨림", "선택"];
  const selfBlameWords = ["자책", "후회", "바보", "미안", "자존감", "우울", "내탓", "실수", "부족", "못난"];

  if (burnoutWords.some((w) => kw.includes(w))) {
    emotion = "burnout";
  } else if (relationshipWords.some((w) => kw.includes(w))) {
    emotion = "relationship";
  } else if (anxietyWords.some((w) => kw.includes(w))) {
    emotion = "anxiety";
  } else if (selfBlameWords.some((w) => kw.includes(w))) {
    emotion = "self_blame";
  }

  // 2. 문서 기반 RAG 텍스트 탐색 (심리학의 총론.md)
  let ragSnippet = "";
  const candidatePaths = [
    path.join(process.cwd(), "knowledge_base", "04_마음치유_콘텐츠", "심리학의 총론.md"),
    path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "심리학의 총론.md"),
  ];

  for (const summaryPath of candidatePaths) {
    if (fs.existsSync(summaryPath)) {
      try {
        const content = fs.readFileSync(summaryPath, "utf-8");
        const lines = content.split(/\r?\n/);

        let matchKeywords: string[] = [];
        if (emotion === "burnout") {
          matchKeywords = ["번아웃", "스트레스", "동기", "욕구"];
        } else if (emotion === "relationship") {
          matchKeywords = ["관계", "애착", "정신분석", "사회심리"];
        } else if (emotion === "anxiety") {
          matchKeywords = ["불안", "인지", "편도체", "공포"];
        } else if (emotion === "self_blame") {
          matchKeywords = ["자책", "방어기제", "자존감", "인본주의"];
        } else {
          matchKeywords = ["심리학", "자기실현", "Rogers", "인본주의"];
        }

        const paragraphs: string[] = [];
        let currentPara: string[] = [];
        for (const line of lines) {
          if (line.trim() === "") {
            if (currentPara.length > 0) {
              paragraphs.push(currentPara.join(" "));
              currentPara = [];
            }
          } else {
            currentPara.push(line.trim());
          }
        }
        if (currentPara.length > 0) {
          paragraphs.push(currentPara.join(" "));
        }

        for (const para of paragraphs) {
          if (matchKeywords.some((mk) => para.includes(mk)) && para.length > 50 && para.length < 300) {
            ragSnippet = para.replace(/#+\s*/g, "");
            break;
          }
        }
        break;
      } catch {
        // Ignore read error and continue
      }
    }
  }

  // 3. 감정에 맞는 최적의 과학적 reference & insight 정의
  const db: Record<string, ScientificPrescription> = {
    burnout: {
      title: "Job Burnout: Sources of Stress and Coping Mechanisms",
      authors: "Dr. Christina Maslach et al.",
      source_url: "https://pubmed.ncbi.nlm.nih.gov/1183181",
      insight_ko:
        "피로와 소진이 극심한 번아웃 상태에서는 무기력하게 자신을 채찍질하는 대신, 자율적인 휴식을 부여하여 전두엽의 인지 자원을 재활성화시키는 것이 중요합니다.",
    },
    relationship: {
      title: "Attachment Theory and Core Mental Health in Close Relationships",
      authors: "Dr. John Bowlby & Mary Ainsworth",
      source_url: "https://pubmed.ncbi.nlm.nih.gov/43213",
      insight_ko:
        "대인관계나 친구, 연인과의 상처로 인해 마음이 아플 때는 관계 속 애착 손상을 극복하기 위해 타인과 나 사이의 경계를 구분하고 본인의 취약성을 따뜻하게 수용해야 합니다.",
    },
    anxiety: {
      title: "Cognitive Therapy of Anxiety Disorders and Neural Processing",
      authors: "Dr. Aaron T. Beck & Dr. Sarah Jenkins",
      source_url: "https://pubmed.ncbi.nlm.nih.gov/20182435",
      insight_ko:
        "불안감이 강하게 찾아올 때는 머릿속의 복잡한 시나리오를 하나씩 인지적으로 쪼개어 실체를 바라봄으로써 뇌의 편도체가 느끼는 위협 신호를 정상화할 수 있습니다.",
    },
    self_blame: {
      title: "Self-Compassion, Cortisol Regulation, and Psychopathology",
      authors: "Dr. Kristin Neff",
      source_url: "https://pubmed.ncbi.nlm.nih.gov/17589234",
      insight_ko:
        "자책과 후회가 깊어질 때는 자신에게 가혹한 기준을 대는 대신 친절한 친구처럼 스스로를 따뜻하게 대해주는 '자기 자비(Self-Compassion)'를 통해 스트레스 호르몬 수치를 낮추어야 합니다.",
    },
    default: {
      title: "Client-Centered Therapy and Personality Growth",
      authors: "Dr. Carl Rogers",
      source_url: "https://pubmed.ncbi.nlm.nih.gov/148943",
      insight_ko:
        "존재 자체를 조건 없이 무조건적으로 긍정하고 수용해 주는 경험은 뇌가 방어적 태도를 해소하고 스스로 마음을 보살펴 자생력을 기르게 돕는 치유의 토대입니다.",
    },
  };

  const selected = { ...(db[emotion] || db.default) };
  if (ragSnippet) {
    selected.rag_snippet = ragSnippet;
  }
  return selected;
}

/**
 * Rule-based local fallback port of extract_profile_fallback in _company/_agents/empathy_profiler.py
 */
export function extractProfileFallback(story: string): EmotionProfile {
  const emotions = {
    anxiety: 0.4,
    helplessness: 0.3,
    self_blame: 0.3,
    sadness: 0.4,
    loneliness: 0.3,
  };

  const storyClean = (story || "").toLowerCase();

  const anxietyKws = [
    "불안", "미래", "걱정", "앞날", "어쩌지", "준비", "취업", "면접", "시험", "두렵",
    "심장", "초조", "떨림", "긴장", "떨려", "실패", "낙방", "탈락", "어떡해", "불안해",
    "두려워", "무서워", "망할까봐", "망했다", "가슴이", "두근거려", "숨이", "막혀", "앞길", "캄캄",
  ];
  for (const kw of anxietyKws) {
    if (storyClean.includes(kw)) {
      emotions.anxiety = Math.min(emotions.anxiety + 0.15, 1.0);
    }
  }

  const helplessnessKws = [
    "무기력", "피곤", "지친", "번아웃", "의욕", "아무것도", "포기", "쉬고", "지쳐", "귀찮",
    "방전", "에너지가", "지치고", "지쳤다", "침대", "눕고", "만사", "쓰러", "탈진", "멍하니",
    "힘없", "아무런", "나태", "무력감", "포기하고", "그만두", "끝내고", "의욕이", "쉬고싶", "눕고싶",
  ];
  for (const kw of helplessnessKws) {
    if (storyClean.includes(kw)) {
      emotions.helplessness = Math.min(emotions.helplessness + 0.15, 1.0);
    }
  }

  const selfBlameKws = [
    "자책", "바보", "부족", "실수", "내 탓", "잘못", "한심", "부끄럽", "후회", "못난",
    "쓰레기", "미련", "죄책감", "멍청", "나 때문에", "내가 왜", "내 잘못", "부족함", "자괴감", "후회막심",
    "자책하게", "내 탓이야", "한심해", "바보같이", "어리석", "미안", "한계", "패배", "루저", "못나서",
  ];
  for (const kw of selfBlameKws) {
    if (storyClean.includes(kw)) {
      emotions.self_blame = Math.min(emotions.self_blame + 0.2, 1.0);
    }
  }

  const sadnessKws = [
    "슬픔", "눈물", "우울", "아픔", "상처", "힘들", "괴롭", "힘드", "아프", "울고",
    "울컥", "가슴 아픈", "서글픈", "비참", "서러워", "서럽", "슬퍼", "우울해", "아프다", "힘들다",
    "괴롭다", "상처받", "찢어", "펑펑", "눈물이", "울음", "고통", "비통", "참담", "괴로워",
  ];
  for (const kw of sadnessKws) {
    if (storyClean.includes(kw)) {
      emotions.sadness = Math.min(emotions.sadness + 0.15, 1.0);
    }
  }

  const lonelinessKws = [
    "고독", "혼자", "외롭", "아무도", "단 둘", "위로", "얘기", "소외", "곁에", "내 편",
    "쓸쓸", "텅 빈", "버려진", "혼자서", "홀로", "고립", "대화할", "들어줄", "단둘", "단절",
    "독방", "멀어", "나 혼자", "내팽개", "잊혀진", "찬바람", "고요한", "적막", "덩그러니", "아무도 없다",
  ];
  for (const kw of lonelinessKws) {
    if (storyClean.includes(kw)) {
      emotions.loneliness = Math.min(emotions.loneliness + 0.15, 1.0);
    }
  }

  const entries = Object.entries(emotions) as [keyof typeof emotions, number][];
  let maxEmotion: keyof typeof emotions = "anxiety";
  let maxVal = -1;
  for (const [k, v] of entries) {
    if (v > maxVal) {
      maxVal = v;
      maxEmotion = k;
    }
  }

  let defense_mechanism = "";
  let core_pain_point = "";
  let prescription_guideline = "";

  if (maxEmotion === "self_blame") {
    defense_mechanism = "자기에게로의 전향 (Turning against self) 및 내면화";
    core_pain_point = "스스로 세운 높은 기준이나 한계를 모두 자신의 탓으로 승화시켜 마음에 깊은 짐을 얹어둔 상태";
    prescription_guideline =
      "섣부른 교정이나 조언, '더 열심히 하라'는 조언은 치명적인 자책을 키웁니다. 사연자가 부족한 것이 아니라, 그가 세상을 너무도 성실히 살아왔기 때문에 마주한 번아웃임을 깊이 수용하고 무조건적인 자애의 위로를 보내십시오.";
  } else if (maxEmotion === "anxiety") {
    defense_mechanism = "합리화 및 주지화 (Intellectualization)를 통한 인지적 회피";
    core_pain_point = "예측 불가능한 내일과 현실의 불확실성에 직면하여 심리적인 긴장과 안전지대 상실을 겪는 상태";
    prescription_guideline =
      "미래를 대비하게 하거나 '잘 될 것'이라는 막연한 긍정 대신, '지금 잠시 멈춰 서서 바람을 쐬는 행위조차 가장 완전한 휴식과 성장의 일부'라는 관점 전환(Reframing)을 심어 마음에 안전한 앵커를 제공하십시오.";
  } else if (maxEmotion === "helplessness") {
    defense_mechanism = "체념 및 회피 (Avoidance)를 통한 정서적 방전";
    core_pain_point = "너무 치열하게 달려와 모든 심리적 연료가 소실되어, 더 이상 무엇도 할 의욕조차 남지 않은 완전 무력 상태";
    prescription_guideline =
      "사연자에게 그 어떤 능동적인 해결 지침도 주지 마십시오. 오로지 '지금은 모든 짐을 내려놓고 가장 평온하게 쉬는 것만이 우주의 순리이자 정당한 조치'임을 확언해주며, 몸의 긴장을 이완할 따뜻한 위로만 조심스레 권하십시오.";
  } else {
    defense_mechanism = "억압 (Repression) 및 감정 격리를 통한 고독 수용";
    core_pain_point = "누구에게도 털어놓을 수 없는 마음의 캄캄한 고독의 터널 속에서 세상과 단절된 고요함을 겪는 상태";
    prescription_guideline =
      "사연자의 차가운 마음에 온기를 불어넣을 시적인 은유(예: 겨울 밤을 묵묵히 지키는 가로등, 지붕 등)를 활용하십시오. 사연자는 절대 혼자가 아니며, 그의 서글픈 이야기를 있는 그대로 온전히 들어주고 지지하는 사람이 여기에 있음을 강하게 각인시켜 주십시오.";
  }

  return {
    emotions: {
      anxiety: Number(emotions.anxiety.toFixed(2)),
      helplessness: Number(emotions.helplessness.toFixed(2)),
      self_blame: Number(emotions.self_blame.toFixed(2)),
      sadness: Number(emotions.sadness.toFixed(2)),
      loneliness: Number(emotions.loneliness.toFixed(2)),
    },
    defense_mechanism,
    core_pain_point,
    prescription_guideline,
  };
}

/**
 * Node.js native port of _company/_agents/empathy_profiler.py
 * Uses OpenAI gpt-4o-mini when available and falls back to rule-based profiling.
 */
export async function profileEmpathy(story?: string, openaiClient?: OpenAI): Promise<EmotionProfile> {
  const targetStory =
    story && story.trim()
      ? story
      : "요즘 취업 준비 때문에 미래가 불확실해서 매일 밤 잠도 안 오고 너무 불안해요. 내가 왜 이리 바보 같고 부족한지 한심해서 자책만 듭니다.";

  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey || apiKey === "dummy-key-for-build") {
    return extractProfileFallback(targetStory);
  }

  try {
    const client = openaiClient || new OpenAI({ apiKey });
    const prompt =
      "당신은 초엘리트 심리 프로파일러이자 감정 분석 마스터입니다. " +
      "다음 사연자의 고민 글을 깊이 있게 읽고, 사연자의 내면 심리를 분석하여 " +
      "반드시 하단의 JSON 규격에 맞게만 답변해 주십시오. " +
      "마크다운 코드 블록(```json)이나 군더더기 텍스트는 일절 출력하지 말고 순수 JSON 문자열만 즉시 반환하십시오.\n\n" +
      "JSON 응답 규격:\n" +
      "{\n" +
      '  "emotions": {\n' +
      '    "anxiety": 0.85,\n' +
      '    "helplessness": 0.70,\n' +
      '    "self_blame": 0.90,\n' +
      '    "sadness": 0.60,\n' +
      '    "loneliness": 0.50\n' +
      "  },\n" +
      '  "defense_mechanism": "사연자가 겪는 주요 방어기제 한글 기입 (예: 내면화, 회피 등)",\n' +
      '  "core_pain_point": "사연자의 핵심 아픔/통점 1문장 요약",\n' +
      '  "prescription_guideline": "메인 AI 오영범 마스터가 위로 편지를 쓸 때 극적인 위로 효과를 내기 위해 반드시 지켜야 할 맞춤형 글쓰기 가이드라인 (예: 훈계조 절대 배제, 관점 전환 Reframing 삽입 등 2문장 내외)"\n' +
      "}\n\n" +
      `사연 내용:\n${targetStory}`;

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const rawContent = (res.choices[0]?.message?.content || "{}").trim();
    const parsed = JSON.parse(rawContent);

    if (
      !parsed.emotions ||
      !parsed.defense_mechanism ||
      !parsed.core_pain_point ||
      !parsed.prescription_guideline
    ) {
      throw new Error("Missing required keys in empathy profile response");
    }

    return parsed as EmotionProfile;
  } catch (err) {
    console.warn("⚠️ OpenAI empathy profiler fallback activated:", (err as Error)?.message);
    return extractProfileFallback(targetStory);
  }
}
