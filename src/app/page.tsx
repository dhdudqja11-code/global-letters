"use client";

import { useState, useRef, useEffect } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import MonteCarloChart from "../components/MonteCarloChart";

type ProductType = "random" | "free" | "beta" | "deep" | "recovery" | "gift" | "extra";
type ViewState = "input" | "tier" | "payment" | "loading" | "full";

interface LetterData {
  cover: { title: string; heart_name: string };
  page_letter_paragraphs: string[];
  page_sentences: string[];
  page_questions: string[];
  page_action: string;
  recovery_days?: { day: number; letter: string; sentence?: string; action: string; summary_sentences?: string[] }[];
  letter?: string;
  action?: string;
  scientific_reference?: {
    title: string;
    authors: string;
    source_url: string;
    insight_ko: string;
  };
  emotions?: Record<string, number>;
  defense_mechanism?: string;
  core_pain_point?: string;
}

const TIERS = [
  { id: "random", name: "Random", desc: "Daily sentence pick", priceText: "Free", priceVal: 0, usd: "0" },
  { id: "free", name: "Free", desc: "Short supportive letter based on your story", priceText: "Free (once per day)", priceVal: 0, usd: "0" },
  { id: "beta", name: "Beta", desc: "Standard prescription and psychological analysis", priceText: "$3.99", priceVal: 5000, usd: "3.99" },
  { id: "deep", name: "Deep", desc: "Deep psychological analysis and action guidance", priceText: "$6.99", priceVal: 9000, usd: "6.99" },
  { id: "recovery", name: "Recovery", desc: "7-day focused recovery journey", priceText: "$21.99", priceVal: 29000, usd: "21.99" },
  { id: "gift", name: "Gift Package", desc: "Gift a comforting PDF postcard to someone special", priceText: "$9.99", priceVal: 12000, usd: "9.99", popular: true }
];

const aestheticBackgrounds = [
  "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1436891620584-47fd0e565afb?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470770903672-71aa615dd6f4?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1445905595283-21f8ae8a33d2?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1532274402911-5a369e4c48f2?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483728642387-6c3ba6c6af81?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1422405153578-4bd676b19036?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=1000&auto=format&fit=crop"
];

const translations = {
  ko: {
    appTitle: "마음을 묻다",
    appSubtitle: "당신의 짐을 잠시 내려놓으세요. 따뜻한 편지로 답해드립니다.",
    selectTier: "어떤 처방을 원하시나요?",
    goBack: "뒤로 가기",
    chooseTier: "처방전 선택하기",
    inputHelpRegular: "짧아도 괜찮습니다. 다만 500자 안팎으로 적어주시면 당신의 마음에 더 잘 맞는 문장으로 써드릴 수 있습니다.",
    inputHelpRecovery: "7일 동안 함께 다독일 마음이라, 조금 자세히 적어주시면 좋습니다. 반복해서 무너지는 순간, 7일 뒤 바라는 마음까지 편하게 적어주세요.",
    q1Name: "1. 어떤 이름으로 불러드릴까요?",
    q2Category: "2. 지금 가장 가까운 마음을 골라주세요.",
    q2CategoryPlaceholder: "선택해주세요",
    q2CategoryOptions: [
      "너무 오래 버틴 마음",
      "괜찮은 척하느라 지친 마음",
      "혼자 울고 있는 마음",
      "사람에게 상처받은 마음",
      "다시 사랑받고 싶은 마음"
    ],
    q3Swallowed: "3. 요즘 가장 자주 삼키는 말은 무엇인가요?",
    q4Wants: "4. 지금 가장 듣고 싶은 말은 무엇인가요?",
    q5Avoid: "5. 원하지 않는 표현이나 피하고 싶은 말이 있나요?",
    q6Comfort: "6. 당신을 가장 편안하게 만드는 한 가지는 무엇인가요?",
    q7Wish: "7. 이 편지에 꼭 담겼으면 하는 한 문장을 적어주세요.",
    recoveryQ2Core: "2. 7일 동안 가장 다독이고 싶은 마음은 무엇인가요?",
    recoveryQ3Breakdown: "3. 요즘 반복해서 무너지는 순간은 언제인가요?",
    recoveryQ4Wish: "4. 7일 뒤 어떤 마음이 되었으면 하나요?",
    recoveryQ5Time: "5. 하루 중 가장 마음이 무너지는 시간대는 언제인가요?",
    recoveryQ6Action: "6. 그래도 해볼 수 있을 것 같은 아주 작은 행동이 있다면?",
    recoveryQ7Support: "7. 회복을 위해 지금 가장 필요한 한 가지는 무엇인가요?",
    questionsCompleted: "질문 입력 완료",
    nextStep: "다음 단계로",
    tierNames: {
      random: "Random",
      free: "Free",
      beta: "Beta",
      deep: "Deep",
      recovery: "Recovery",
      gift: "Gift Package"
    },
    tierDescriptions: {
      random: "오늘의 문장 (랜덤 뽑기)",
      free: "사연 기반 짧은 안부 편지",
      beta: "표준 처방전 및 심리 분석",
      deep: "심층 심리 분석 및 행동 지침",
      recovery: "7일 집중 회복 여정 (연속 처방)",
      gift: "소중한 사람에게 위로를 선물하세요 (PDF 엽서 발급)"
    },
    tierPriceText: {
      random: "무료",
      free: "무료 (일 1회)",
      beta: "5,000원 ($3.99)",
      deep: "9,000원 ($6.99)",
      recovery: "29,000원 ($21.99)",
      gift: "12,000원 ($9.99)"
    },
    popular: "인기",
    paymentSuffix: "처방전 결제",
    paymentDesc: "결제를 완료하시면 마스터 오영범의 따뜻한 편지가 즉시 작성됩니다.",
    giftRecipientLabel: "선물 받을 분의 성함(또는 애칭)을 적어주세요.",
    giftRecipientPlaceholder: "예: 사랑하는 지우님",
    giftRecipientEmailLabel: "선물 받을 분의 이메일 주소를 적어주세요.",
    giftRecipientEmailPlaceholder: "예: email@example.com",
    testPaymentBypass: "✨ [테스트용] 결제 우회 (개발자 전용)",
    loadingText: "당신의 이야기를 깊이 들여다보고 있습니다...",
    randomLoadingText: "오늘의 문장을 뽑고 있습니다...",
    pdfLoadingText: "💌 PDF 저장 중...",
    pdfDownloadLabel: "나만의 엽서 간직하기 (PDF)",
    pdfPermanentLabel: "이 처방전 영구 소장하기 (PDF 다운로드)",
    keepForever: "이 처방전 영구 소장하기 (PDF 다운로드)",
    storyHeader: "마음을 묻다",
    freeCardLabel: "마음을 묻다",
    premiumSentenceHeader: "오래 간직할 문장",
    premiumQuestionHeader: "나에게 묻는 질문",
    premiumActionHeader: "오늘의 작은 행동",
    recoveryDayHeader: "일차 회복 편지",
    reviewTitle: "오늘의 편지가 위로가 되었나요?",
    reviewSubtitle: "소중한 피드백을 남겨주시면 대표님께 전달됩니다. ✨",
    reviewPlaceholder: "당신의 마음에 어떤 변화가 있었나요? 감상평을 편하게 남겨주세요...",
    reviewSubmit: "리뷰 전송하기",
    reviewSuccess: "리뷰가 성공적으로 전송되었습니다. 소중한 피드백 감사합니다! 💛",
    reset: "처음으로 돌아가기",
    footerBrand: "마음을 묻다",
    footerCopyright: "© 2026 Master O.Y.B ALL RIGHTS RESERVED.",
    alertSelectTier: "먼저 원하는 처방전을 선택해주세요.",
    alertFillMore: "질문을 조금 더 작성해 주세요. 진짜 당신의 마음을 담아주세요.",
    alertDrawLimit: "오늘의 문장 뽑기는 하루에 3번까지만 가능합니다. 내일 다시 새로운 문장을 만나보세요! ✨",
    alertLetterError: "편지 생성 중 오류가 발생했습니다.",
    alertPdfError: "PDF 생성 중 오류가 발생했습니다.",
    pdfErrorDetail: "PDF 생성 중 오류가 발생했습니다.\n\n오류 내용: ",
    payPalError: "PDF 인쇄 라이브러리(Pro) 로드 실패: ",
    pdfLibError: "PDF 구성 파일(jsPDF)이 아직 로드되지 않았습니다.",
    pdfFilename: "마음을_묻다_위로엽서.pdf",
    dearRecipient: "소중한 마음",
    dearRecipientSuffix: "님",
    envelopeSender: "보낸 이: 오영범 마스터",
    envelopeIncoming: "💌 당신을 위한 위로의 편지가 도착했습니다.",
    sealHelp: "왁스 실을 클릭하여 열기",
    storyLabel: "당신의 이야기를 들려주세요 (자유 형식)",
    storyPlaceholder: "마음에 담아둔 이야기를 편하게 적어주세요..."
  },
  en: {
    appTitle: "Ask Your Heart",
    appSubtitle: "Leave your worries behind for a moment. We'll answer with a warm letter.",
    selectTier: "Which prescription do you need?",
    goBack: "Go Back",
    chooseTier: "Select prescription",
    inputHelpRegular: "A short note is fine. About 500 characters helps us write a more fitting letter for your feelings.",
    inputHelpRecovery: "This is a 7-day recovery journey, so please describe your feelings in detail. Include repeated breakdown moments and what you hope to feel after 7 days.",
    q1Name: "1. What name should we call you?",
    q2Category: "2. Choose the feeling closest to you right now.",
    q2CategoryPlaceholder: "Please choose",
    q2CategoryOptions: [
      "A heart that has endured too long",
      "A heart tired of pretending to be okay",
      "A heart crying alone",
      "A heart hurt by others",
      "A heart wanting to be loved again"
    ],
    q3Swallowed: "3. What phrase do you find yourself swallowing most often these days?",
    q4Wants: "4. What words do you most want to hear right now?",
    q5Avoid: "5. Is there any phrase you don't want to hear or want to avoid?",
    q6Comfort: "6. What is one thing that makes you feel most comfortable?",
    q7Wish: "7. Write one sentence you want included in this letter.",
    recoveryQ2Core: "2. What heart do you want to comfort most during these 7 days?",
    recoveryQ3Breakdown: "3. When do you find yourself breaking down repeatedly these days?",
    recoveryQ4Wish: "4. What kind of heart do you want to have after 7 days?",
    recoveryQ5Time: "5. When during the day does your heart feel the weakest?",
    recoveryQ6Action: "6. What's one small action you think you can still try?",
    recoveryQ7Support: "7. What do you need most right now for recovery?",
    questionsCompleted: "questions filled",
    nextStep: "Continue",
    tierNames: {
      random: "Random",
      free: "Free",
      beta: "Beta",
      deep: "Deep",
      recovery: "Recovery",
      gift: "Gift Package"
    },
    tierDescriptions: {
      random: "Daily sentence pick",
      free: "Short supportive letter based on your story",
      beta: "Standard prescription and psychological analysis",
      deep: "Deep psychological analysis and action guidance",
      recovery: "7-day focused recovery journey",
      gift: "Gift comfort to someone special with a PDF postcard"
    },
    tierPriceText: {
      random: "Free",
      free: "Free (once per day)",
      beta: "$3.99",
      deep: "$6.99",
      recovery: "$21.99",
      gift: "$9.99"
    },
    popular: "Popular",
    paymentSuffix: "prescription payment",
    paymentDesc: "After payment, a warm letter from Master O.Y.B will be created immediately.",
    giftRecipientLabel: "Enter the recipient's name or nickname.",
    giftRecipientPlaceholder: "e.g. Jiwon, my dear",
    giftRecipientEmailLabel: "Enter the recipient's email address.",
    giftRecipientEmailPlaceholder: "e.g. email@example.com",
    testPaymentBypass: "✨ [Test only] Payment bypass (dev only)",
    loadingText: "We are looking deeply into your story...",
    randomLoadingText: "Picking today's sentence...",
    pdfLoadingText: "💌 Saving PDF...",
    pdfDownloadLabel: "Save my postcard (PDF)",
    pdfPermanentLabel: "Keep this prescription forever (PDF download)",
    keepForever: "Keep this prescription forever (PDF download)",
    storyHeader: "Ask Your Heart",
    freeCardLabel: "Ask Your Heart",
    premiumSentenceHeader: "Sentences to cherish",
    premiumQuestionHeader: "Questions for yourself",
    premiumActionHeader: "Today's small action",
    recoveryDayHeader: "Day recovery letter",
    reviewTitle: "Did today's letter comfort you?",
    reviewSubtitle: "Your feedback will be delivered to the team. ✨",
    reviewPlaceholder: "How did this letter change your feelings? Share your thoughts.",
    reviewSubmit: "Send review",
    reviewSuccess: "Your review has been submitted successfully. Thank you for your precious feedback! 💛",
    reset: "Start over",
    footerBrand: "Ask Your Heart",
    footerCopyright: "© 2026 Master O.Y.B ALL RIGHTS RESERVED.",
    alertSelectTier: "Please select a prescription first.",
    alertFillMore: "Please write a bit more. Put your true feelings into the questions.",
    alertDrawLimit: "Daily sentence draw is limited to 3 times per day. Please return tomorrow for a new sentence! ✨",
    alertLetterError: "An error occurred while creating the letter.",
    alertPdfError: "An error occurred while generating the PDF.",
    pdfErrorDetail: "An error occurred while generating the PDF.\n\nError: ",
    payPalError: "Failed to load PDF print library (Pro): ",
    pdfLibError: "PDF library (jsPDF) is not loaded yet.",
    pdfFilename: "ask-your-heart-letter.pdf",
    dearRecipient: "Someone Special",
    dearRecipientSuffix: "",
    envelopeSender: "Sender: Master O.Y.B",
    envelopeIncoming: "💌 A comforting letter has arrived for you.",
    sealHelp: "Click seal to open",
    storyLabel: "Please share your story (Free format)",
    storyPlaceholder: "Feel free to write what's on your mind..."
  }
};

const paginateParagraphs = (paragraphs: string[], maxPageHeightPx: number = 720) => {
  if (typeof window === "undefined") return [paragraphs];
  const pages: string[][] = [[]];
  let currentPageIndex = 0;
  
  // Create a temporary hidden container to measure paragraph heights
  const tempContainer = document.createElement("div");
  tempContainer.style.width = "210mm";
  tempContainer.style.padding = "20mm";
  tempContainer.style.boxSizing = "border-box";
  tempContainer.style.fontFamily = "'Apple SD Gothic Neo', 'Malgun Gothic', 'Playfair Display', serif";
  tempContainer.style.fontSize = "1.125rem"; // text-lg equivalent
  tempContainer.style.lineHeight = "2.25"; // leading-loose equivalent
  tempContainer.style.position = "fixed";
  tempContainer.style.top = "-9999px";
  tempContainer.style.left = "-9999px";
  document.body.appendChild(tempContainer);

  for (const para of paragraphs) {
    // Append the paragraph to the current temp container to test size
    const pElement = document.createElement("p");
    pElement.style.marginBottom = "1.5rem"; // mb-6 equivalent
    pElement.innerText = para;
    tempContainer.appendChild(pElement);

    // Measure height
    if (tempContainer.scrollHeight > maxPageHeightPx && pages[currentPageIndex].length > 0) {
      // If it overflows the max height, move this paragraph to a new page
      currentPageIndex += 1;
      pages[currentPageIndex] = [para];
      
      // Reset the temp container and put only the new paragraph in it
      tempContainer.innerHTML = "";
      const newPElement = document.createElement("p");
      newPElement.style.marginBottom = "1.5rem";
      newPElement.innerText = para;
      tempContainer.appendChild(newPElement);
    } else {
      // Otherwise, add it to the current page list
      pages[currentPageIndex].push(para);
    }
  }

  // Clean up
  document.body.removeChild(tempContainer);
  return pages;
};

// SHA-256 Helper Function for premium digital signature verification
const generateSHA256 = async (message: string): Promise<string> => {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    // Simple fallback hash if Web Crypto is unavailable (e.g. non-secure environment)
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0').toUpperCase();
  }
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  } catch (e) {
    return "D1G1TAL-S1GNATURE-B2B-SECURE-HASH";
  }
};

const getRecoveryTextScale = (text: string) => {
  const len = text ? text.length : 0;
  if (len > 1000) {
    return {
      fontSize: "text-[12px] md:text-[13px]",
      lineHeight: "leading-[1.7]",
      paragraphMargin: "mb-3",
      containerPadding: "p-[15mm] border-[4px]",
      actionMargin: "mt-2 p-3 text-[12px]",
      titleSize: "text-xl",
      sentenceSize: "text-[12px] mb-3",
      summaryMargin: "mb-4 p-4",
    };
  } else if (len > 700) {
    return {
      fontSize: "text-[13px] md:text-[14px]",
      lineHeight: "leading-[1.8]",
      paragraphMargin: "mb-4",
      containerPadding: "p-[20mm] border-[6px]",
      actionMargin: "mt-4 p-4 text-[13px]",
      titleSize: "text-2xl",
      sentenceSize: "text-[13px] mb-4",
      summaryMargin: "mb-5 p-5",
    };
  } else {
    return {
      fontSize: "text-[15px] md:text-[16px]",
      lineHeight: "leading-[2.0]",
      paragraphMargin: "mb-6",
      containerPadding: "p-[25mm] border-[8px]",
      actionMargin: "mt-6 p-5 text-[15px]",
      titleSize: "text-3xl",
      sentenceSize: "text-[15px] mb-6",
      summaryMargin: "mb-8 p-6",
    };
  }
};


export default function Home() {
  const [view, setView] = useState<ViewState>("tier");
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [userStory, setUserStory] = useState("");
  const [productType, setProductType] = useState<ProductType>("free");
  const [typedText, setTypedText] = useState("");
  const [fullLetterText, setFullLetterText] = useState("");
  const [actionStep, setActionStep] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showAction, setShowAction] = useState(false);
  const [letterData, setLetterData] = useState<LetterData | null>(null);
  const [drawCount, setDrawCount] = useState(0);
  const [bgUrl, setBgUrl] = useState("");
  const [mounted, setMounted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<typeof TIERS[0] | null>(null);
  const [giftRecipient, setGiftRecipient] = useState("");
  const [giftRecipientEmail, setGiftRecipientEmail] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isKorean, setIsKorean] = useState(true);
  const [sha256Hash, setSha256Hash] = useState("");
  const [sha256HashState, setSha256HashState] = useState(""); // RAG hashes

  // 📊 Option C: 웹 몬테카를로 및 1:1 상담 예약용 상태들
  const [piiRisk, setPiiRisk] = useState(5.0);
  const [auditRisk, setAuditRisk] = useState(6.0);
  const [consentRisk, setConsentRisk] = useState(4.0);
  const [sessionRisk, setSessionRisk] = useState(3.0);
  const [trafficRisk, setTrafficRisk] = useState(2.0);

  const [simLoss, setSimLoss] = useState(0);
  const [simCritical, setSimCritical] = useState(false);
  const [simChartData, setSimChartData] = useState<{ loss: number; density: number }[]>([]);
  const [simReport, setSimReport] = useState<{ stage: string; detail: string }[]>([]);

  // 1:1 상담 예약 CTA용 모달
  const [showCtaModal, setShowCtaModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payEmail, setPayEmail] = useState("");
  const [payPassword, setPayPassword] = useState("");
  const [payStep, setPayStep] = useState<"login" | "pay" | "processing">("login");
  const [reserveName, setReserveName] = useState("");
  const [reserveEmail, setReserveEmail] = useState("");
  const [reservePhone, setReservePhone] = useState("");
  const [reserveSuccess, setReserveSuccess] = useState(false);

  // 🛡️ 원격 보안 관제 및 세션 복구 콘솔 상태들
  const [showRemoteRecoveryModal, setShowRemoteRecoveryModal] = useState(false);
  const [recoveryIp, setRecoveryIp] = useState("192.168.1.50");
  const [recoveryPort, setRecoveryPort] = useState("22");
  const [recoveryRole, setRecoveryRole] = useState("admin"); // admin, standard, guest
  const [recoveryCommand, setRecoveryCommand] = useState("ls -l /var/log");
  const [customCommand, setCustomCommand] = useState("");
  const [isRecoveryRunning, setIsRecoveryRunning] = useState(false);
  const [recoveryLogs, setRecoveryLogs] = useState<string[]>([]);
  const [recoveryStatus, setRecoveryStatus] = useState<"idle" | "running" | "success" | "failed">("idle");
  const [stepStates, setStepStates] = useState<{
    credential: "idle" | "checking" | "success" | "failed";
    escalation: "idle" | "checking" | "success" | "failed";
    sync: "idle" | "checking" | "success" | "failed";
  }>({
    credential: "idle",
    escalation: "idle",
    sync: "idle",
  });

  const handleStartRecovery = async () => {
    if (isRecoveryRunning) return;
    setIsRecoveryRunning(true);
    setRecoveryStatus("running");
    setRecoveryLogs([]);
    setStepStates({
      credential: "checking",
      escalation: "idle",
      sync: "idle"
    });

    const finalCommand = recoveryCommand === "custom" ? customCommand : recoveryCommand;
    const addLog = (msg: string) => {
      setRecoveryLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    addLog("🔄 원격 세션 복구 시작 시퀀스 가동...");
    addLog(`🌐 대상 IP: ${recoveryIp}:${recoveryPort} | 권한: ${recoveryRole}`);
    addLog(`⚙️ 실행 명령어: "${finalCommand}"`);

    // 1단계 Credential Check 시뮬레이션 딜레이
    await new Promise((r) => setTimeout(r, 1200));

    if (recoveryRole === "guest") {
      setStepStates((prev) => ({ ...prev, credential: "failed" }));
      setRecoveryStatus("failed");
      addLog("❌ [인증 실패] Credential Integrity Check 실패.");
      addLog("❌ 상세 오류: Guest user는 원격 연결 시도가 불가능합니다. (AUTH_ERROR)");
      setIsRecoveryRunning(false);
      return;
    }

    try {
      const parsedPort = parseInt(recoveryPort);
      if (!recoveryIp.startsWith("192.") || !(parsedPort === 22 || (parsedPort >= 1024 && parsedPort <= 65535))) {
        setStepStates((prev) => ({ ...prev, credential: "failed" }));
        setRecoveryStatus("failed");
        addLog("❌ [네트워크 검증 실패] 유효하지 않거나 제한된 IP/Port 조합입니다. (VALIDATION_ERROR)");
        setIsRecoveryRunning(false);
        return;
      }
    } catch {
      setStepStates((prev) => ({ ...prev, credential: "failed" }));
      setRecoveryStatus("failed");
      addLog("❌ [검증 오류] 포트 형식이 올바르지 않습니다. (VALIDATION_ERROR)");
      setIsRecoveryRunning(false);
      return;
    }

    setStepStates((prev) => ({ ...prev, credential: "success", escalation: "checking" }));
    addLog("🟢 [인증 완료] Credential 무결성 검증 완료.");
    addLog("🔄 2단계: 권한 승격 및 정책 검사(Authority Escalation) 진행 중...");

    // 2단계 Authority Escalation 시뮬레이션 딜레이
    await new Promise((r) => setTimeout(r, 1200));

    if (finalCommand.includes("systemctl restart") && recoveryRole !== "admin") {
      setStepStates((prev) => ({ ...prev, escalation: "failed" }));
      setRecoveryStatus("failed");
      addLog("❌ [권한 거부] 관리자 권한이 필요합니다. (PERMISSION_DENIED)");
      addLog(`❌ 상세 오류: 이 명령어는 해당 접근 역할(${recoveryRole})에서 제한되었습니다.`);
      setIsRecoveryRunning(false);
      return;
    }

    setStepStates((prev) => ({ ...prev, escalation: "success", sync: "checking" }));
    addLog("🟢 [권한 승격 완료] Authority Escalation 정상 확인.");
    addLog("🔄 3단계: 접속 재동기화 및 실시간 데이터 스트리밍(Re-Synchronization) 가동...");

    // 3단계 Re-Synchronization 및 API 호출
    try {
      const response = await fetch("http://localhost:5000/api/remote/flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "ceo_recovery",
          role: recoveryRole,
          ip_address: recoveryIp,
          port: parseInt(recoveryPort),
          command: finalCommand
        })
      });

      const data = await response.json();

      await new Promise((r) => setTimeout(r, 1000));

      if (data.success) {
        setStepStates((prev) => ({ ...prev, sync: "success" }));
        setRecoveryStatus("success");
        addLog("🟢 [동기화 완료] 실시간 시스템 메트릭 스트리밍 수신 성공.");
        
        // 백엔드 스트리밍 데이터 로그 출력
        if (data.details && data.details.data_stream && data.details.data_stream.data) {
          const streamLines = data.details.data_stream.data.split("\n");
          streamLines.forEach((line: string) => {
            if (line.trim()) addLog(`📡 [STREAM] ${line}`);
          });
        }
        addLog("🎉 시스템 복구 시퀀스가 완벽하게 성공하였습니다.");
      } else {
        setStepStates((prev) => ({ ...prev, sync: "failed" }));
        setRecoveryStatus("failed");
        addLog("❌ [실행 실패] 백엔드 플로우 중 오류 발생.");
        addLog(`❌ 에러 정보: ${data.error_report || ""}`);
        addLog(`❌ 상세 내역: ${data.details || ""}`);
      }
    } catch (err: any) {
      setStepStates((prev) => ({ ...prev, sync: "failed" }));
      setRecoveryStatus("failed");
      addLog(`🚨 [네트워크 오류] API Gateway(http://localhost:5000) 연결 실패: ${err.message}`);
    } finally {
      setIsRecoveryRunning(false);
    }
  };

  const t = isKorean ? translations.ko : translations.en;

  // 슬라이더 값이 변경될 때마다 실시간 몬테카를로 API 호출
  useEffect(() => {
    if (view !== "full") return;

    const timer = setTimeout(async () => {
      try {
        const payload = {
          client_id: formData.name || "AnonymousClient",
          user_role: "Admin",
          risk_factors: [
            { activity_name: "PII Leakage Risk", potential_impact_score: piiRisk },
            { activity_name: "Lack of Immutable Audit Logs", potential_impact_score: auditRisk },
            { activity_name: "No User Consent Mechanism", potential_impact_score: consentRisk },
            { activity_name: "Session Security Hijacking", potential_impact_score: sessionRisk },
            { activity_name: "Traffic Surge Throttling", potential_impact_score: trafficRisk }
          ]
        };

        const res = await fetch("http://localhost:8000/api/v1/mini-roi/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          setSimLoss(data.total_estimated_loss_usd);
          setSimCritical(data.is_critical_risk);
          setSimChartData(data.chart_data);
          setSimReport(data.report);

          // 임계치 최초 초과 시 상담 예약 CTA 모달을 한 번 띄워줌
          if (data.is_critical_risk && !reserveSuccess) {
            setShowCtaModal(true);
          }
        }
      } catch (e) {
        console.error("Failed to fetch live Monte Carlo simulation:", e);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [piiRisk, auditRisk, consentRisk, sessionRisk, trafficRisk, view]);

  // 통계 및 리뷰용 상태 추가
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // 🔒 타이핑 락 및 클로저 상태 수호용 Ref 객체
  const fullLetterRef = useRef("");
  const actionStepRef = useRef("");
  const isTypingRef = useRef(false);

  const getPaginatedParagraphs = () => {
    if (!letterData) return [[]];
    const paras = letterData.page_letter_paragraphs?.length 
      ? letterData.page_letter_paragraphs 
      : [letterData.letter || ""];
    
    return paginateParagraphs(paras, 750);
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && navigator.language) {
      setIsKorean(navigator.language.toLowerCase().includes('ko'));
    }
    
    // 엽서 배경을 15종 엄선 리스트에서 임의 선택하여 초기화
    const randomBg = aestheticBackgrounds[Math.floor(Math.random() * aestheticBackgrounds.length)];
    setBgUrl(randomBg);

    const today = new Date().toDateString();
    try {
      const saved = localStorage.getItem("sentence_draw_data");
      if (saved) {
        const { date, count } = JSON.parse(saved);
        if (date === today) {
          setDrawCount(count);
        } else {
          localStorage.setItem("sentence_draw_data", JSON.stringify({ date: today, count: 0 }));
        }
      } else {
        localStorage.setItem("sentence_draw_data", JSON.stringify({ date: today, count: 0 }));
      }
    } catch (e) {
      localStorage.setItem("sentence_draw_data", JSON.stringify({ date: today, count: 0 }));
    }

    // [추가] 방문자 트래픽 추적 백엔드 전송 (Next.js serverless relative route)
    fetch("/api/track/visit", { method: "POST" })
      .catch((err) => console.log("Traffic tracking dev mode"));
  }, []);

  const typingRef = useRef<NodeJS.Timeout | null>(null);



  const makeLegacyLetter = (data: any) => {
    if (!data) return "";
    if (typeof data.letter === "string" && data.letter.trim() !== "") {
      return data.letter;
    }
    const paragraphs = Array.isArray(data.page_letter_paragraphs)
      ? data.page_letter_paragraphs
      : [];
    const sentences = Array.isArray(data.page_sentences)
      ? data.page_sentences.map((s: string) => `"${s}"`)
      : [];
    const questions = Array.isArray(data.page_questions)
      ? data.page_questions.map((q: string) => `Q. ${q}`)
      : [];

    return [...paragraphs, sentences.join("\n"), questions.join("\n")]
      .filter(Boolean)
      .join("\n\n");
  };

  const handleFormChange = (questionId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [questionId]: value }));
  };

  const buildStoryPayload = () => {
    const filledKeys = Object.keys(formData);
    let payload = userStory.trim() ? `사연: ${userStory.trim()}\n\n` : "";
    if (filledKeys.length > 0) {
      payload += filledKeys
        .map((key) => `${key}: ${formData[key].trim()}`)
        .filter(Boolean)
        .join("\n\n");
    }
    return payload || userStory.trim();
  };

  const handleFormSubmit = () => {
    if (!selectedProduct) {
      alert(t.alertSelectTier);
      setView("tier");
      return;
    }

    const filledCount = Object.values(formData).filter((value) => value.trim().length > 0).length;
    if (filledCount < 4) {
      alert(t.alertFillMore);
      return;
    }

    if (selectedProduct.priceVal > 0) {
      setView("payment");
      return;
    }

    generateLetter(selectedProduct.id as ProductType);
  };

  const handleSelectTier = (tier: typeof TIERS[0]) => {
    setSelectedProduct(tier);
    setProductType(tier.id as ProductType);
    setFormData({});

    if (tier.id === "random") {
      handleDrawGreeting();
      return;
    }

    setView("input");
  };

  const handleDrawGreeting = async () => {
    if (drawCount >= 3) {
      alert(t.alertDrawLimit);
      return;
    }
    const today = new Date().toDateString();
    const newCount = drawCount + 1;
    setDrawCount(newCount);
    localStorage.setItem("sentence_draw_data", JSON.stringify({ date: today, count: newCount }));
    await generateLetter("random");
  };

  const generateLetter = async (type: ProductType) => {
    setView("loading");
    try {
      // 황혼, 안개, 고요한 물가, 빈티지 창문 등 서정적 키워드 기반 Unsplash API featured 이미지와 15종 엄선 리스트 하이브리드 결합
      const healingKeywords = ["dusk", "fog", "calm-waterside", "vintage-window"];
      const randomKeyword = healingKeywords[Math.floor(Math.random() * healingKeywords.length)];
      const unsplashUrl = `https://images.unsplash.com/featured/1600x900/?${randomKeyword},tranquil,peaceful`;
      
      // 50% 확률로 Unsplash 동적 감성 이미지 또는 15종 고품격 백업 이미지 로드 (완벽한 안정성 확보)
      const randomBg = Math.random() > 0.5 
        ? unsplashUrl 
        : aestheticBackgrounds[Math.floor(Math.random() * aestheticBackgrounds.length)];
      setBgUrl(randomBg);

      const response = await fetch("/api/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: buildStoryPayload(), productType: type, giftRecipient, language: isKorean ? "ko" : "en" }),
      });
      if (response.status === 429) {
        setShowLimitModal(true);
        setView("tier");
        return;
      }
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        setView("tier");
        return;
      }
      setLetterData(data);
      
      const legacyText = makeLegacyLetter(data);
      let letterBody = data.letter || legacyText;
      
      // Random 모드일 경우 AI가 자체 생성한 따옴표 제거 (UI에 이미 고정 따옴표가 있으므로 중복 방지)
      if (type === "random") {
        letterBody = letterBody.trim().replace(/^["'“”指標‘’]+|["'“”指標‘’]+$/g, '').trim();
      }
      
      fullLetterRef.current = letterBody;
      actionStepRef.current = data.action || data.page_action || "";
      
      setFullLetterText(letterBody);
      setView("full");
      startTyping(letterBody, data.action || data.page_action || "");

      // SHA-256 디지털 서명 생성 및 상태값 업데이트 (글로벌 B2B 무결성 인증 규격)
      const hashInput = letterBody + (data.action || data.page_action || "") + (data.cover?.title || "") + type;
      generateSHA256(hashInput).then(hash => setSha256Hash(hash.substring(0, 32)));

      // 🎁 선물 패키지 요금제 결제 시 수신자에게 이메일 자동 발송 트리거 실행
      if (type === "gift" && giftRecipient && giftRecipientEmail) {
        fetch("/api/send-gift", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientName: giftRecipient,
            recipientEmail: giftRecipientEmail,
            senderName: formData.q1_name || (isKorean ? "소중한 사람" : "Someone special"),
            letterData: data
          })
        })
        .then(res => res.json())
        .then(emailRes => {
          if (emailRes.success) {
            console.log("💌 [선물 편지 발송] 이메일 발송 결과:", emailRes.mode);
          } else {
            console.error("❌ [선물 편지 발송] 발송 오류:", emailRes.error);
          }
        })
        .catch(err => {
          console.error("❌ [선물 편지 발송] API 연동 실패:", err);
        });
      }

    } catch (error) {
      alert(t.alertLetterError);
      setView("tier");
    }
  };

  const startTyping = (text: string, action: string) => {
    fullLetterRef.current = text;
    actionStepRef.current = action;
    isTypingRef.current = true;

    setActionStep(action);
    setTypedText("");
    setIsTyping(true);
    setShowAction(false);
    let i = 0;
    const typeNextChar = () => {
      // 🔒 skipTyping으로 취소 상태가 되었다면 타이머 루프 즉시 탈출
      if (!isTypingRef.current) return;
      
      if (i < text.length) {
        setTypedText(text.substring(0, i + 1));
        i++;
        typingRef.current = setTimeout(typeNextChar, 30);
      } else {
        finishTyping();
      }
    };
    typingRef.current = setTimeout(typeNextChar, 30);
  };

  const finishTyping = () => {
    isTypingRef.current = false;
    if (typingRef.current) clearTimeout(typingRef.current);
    setIsTyping(false);
    setTypedText(fullLetterRef.current);
    setShowAction(true);
  };

  const skipTyping = () => {
    if (isTypingRef.current) {
      finishTyping();
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      rating,
      content: reviewText,
      tier: productType
    };
    try {
      await fetch("/api/track/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setReviewSubmitted(true);
    } catch (err) {
      console.log("Review tracking dev mode error:", err);
      setReviewSubmitted(true); // 오프라인/개발 환경에서도 성공 메시지 노출
    }
  };

  const resetForm = () => {
    setUserStory("");
    setReviewText("");
    setRating(5);
    setReviewSubmitted(false);
    setView("tier");
    setSelectedProduct(null);
    setEnvelopeOpen(false);
    setGiftRecipient("");
    setGiftRecipientEmail("");
    setFormData({});
    
    // 🔒 상태값 및 Ref 초기화 추가
    setTypedText("");
    setFullLetterText("");
    setIsTyping(false);
    setShowAction(false);
    fullLetterRef.current = "";
    actionStepRef.current = "";
    isTypingRef.current = false;
    if (typingRef.current) clearTimeout(typingRef.current);
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownloadPDF = async () => {
    const hiddenPages = Array.from(document.querySelectorAll('.pdf-page')) as HTMLElement[];
    const pageElements = hiddenPages.length > 0
      ? hiddenPages
      : [document.getElementById("letter-container")].filter(Boolean) as HTMLElement[];
    if (pageElements.length === 0) return;

    const downloadBtn = document.querySelector("#download-pdf-btn");
    const originalText = downloadBtn?.innerHTML;

    if (downloadBtn) {
      downloadBtn.innerHTML = t.pdfLoadingText;
      (downloadBtn as any).disabled = true;
    }

    const forceLoadProEngine = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        if ((window as any).html2canvasProInstance) {
          resolve((window as any).html2canvasProInstance);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/html2canvas-pro@latest/dist/html2canvas-pro.min.js";
        script.crossOrigin = "anonymous";
        script.onload = () => {
          (window as any).html2canvasProInstance = (window as any).html2canvas;
          resolve((window as any).html2canvas);
        };
        script.onerror = (e) => reject(new Error(t.payPalError + e));
        document.head.appendChild(script); // Fix: Actually append the script to start loading
      });
    };

    try {
      const proEngine = await forceLoadProEngine();
      const jsPDF = (window as any).jsPDF || ((window as any).jspdf ? (window as any).jspdf.jsPDF : null);
      if (!jsPDF) {
        throw new Error(t.pdfLibError);
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let pageIndex = 0; pageIndex < pageElements.length; pageIndex += 1) {
        const pageElement = pageElements[pageIndex];
        const canvas = await proEngine(pageElement, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          allowTaint: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const imgWidth = pdfWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const yPos = (pdfHeight - imgHeight) / 2;

        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 10, yPos > 10 ? yPos : 10, imgWidth, imgHeight);
      }

      pdf.save('마음을_묻다_위로엽서.pdf');
    } catch (err: any) {
      console.error("PDF generation error:", err);
      alert(t.pdfErrorDetail + (err?.message || err));
    } finally {
      if (downloadBtn) {
        downloadBtn.innerHTML = originalText || t.pdfDownloadLabel;
        (downloadBtn as any).disabled = false;
      }
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center relative selection:bg-amber-100 overflow-x-hidden font-serif transition-all duration-1000 ${
      view === "full" ? "desk-bg text-slate-100" : "bg-[#fdfbf7] text-slate-800"
    }`}>
      {/* Floating Glassmorphic KO | EN Language Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setIsKorean(prev => !prev)}
          className="backdrop-blur-xl border border-slate-200/50 bg-white/40 text-slate-700 rounded-full py-1.5 px-4 text-xs font-sans font-medium hover:bg-white/60 active:scale-95 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.03)] cursor-pointer flex items-center gap-1.5 hover:border-slate-300/50"
        >
          <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5c-.347 2.117-1.127 4.195-2.28 6.095M6.412 9a9.616 9.616 0 013.28-3m-3.28 3h8.218" />
          </svg>
          {isKorean ? "KO | EN" : "EN | KO"}
        </button>
      </div>

        <div className="w-full max-w-4xl px-4 sm:px-6 py-12 md:py-16 flex flex-col items-center">
          
          {/* Header (Hidden on result view) */}
          {view !== "full" && (
            <header className="text-center mb-10 w-full max-w-3xl animate-fade-in transition-opacity duration-700">
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tight leading-tight">
                {t.appTitle}
              </h1>
              <p className="text-slate-500 text-lg font-serif">
                {t.appSubtitle}
              </p>
            </header>
          )}

          <main className="w-full max-w-4xl relative flex flex-col items-center">
            
            {/* 1. 사연 입력창 */}
            {view === "input" && (
              <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 md:p-12 w-full max-w-4xl border border-white shadow-layered transition-all duration-500 animate-fade-in">
                <div className="w-full mt-4 flex flex-col gap-6 animate-fade-in text-left">
                  {!selectedProduct ? (
                    <div className="rounded-3xl border border-amber-100 bg-amber-50/80 p-8 text-center text-slate-700 font-serif">
                      {t.alertSelectTier}
                      <button
                        type="button"
                        onClick={() => setView("tier")}
                        className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 transition"
                      >
                        {t.chooseTier}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-slate-50 rounded-3xl text-sm text-slate-500 font-serif">
                        {selectedProduct.id === "recovery" ? t.inputHelpRecovery : t.inputHelpRegular}
                      </div>

                      <div>
                        <label className="block text-slate-700 font-serif mb-2 font-bold">
                          {t.storyLabel}
                        </label>
                        <textarea
                          rows={4}
                          value={userStory}
                          onChange={(e) => setUserStory(e.target.value)}
                          placeholder={t.storyPlaceholder}
                          className="w-full rounded-xl border border-slate-200 bg-white p-4 font-serif outline-none focus:ring-2 focus:ring-amber-300"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-serif mb-2">{t.q1Name}</label>
                        <input
                          type="text"
                          value={formData.q1_name || ""}
                          onChange={(e) => handleFormChange("q1_name", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white p-4 font-serif outline-none focus:ring-2 focus:ring-amber-300"
                        />
                      </div>

                      {selectedProduct.id !== "recovery" ? (
                        <>
                          <div>
                            <label className="block text-slate-700 font-serif mb-2">{t.q2Category}</label>
                            <select
                              value={formData.q2_category || ""}
                              onChange={(e) => handleFormChange("q2_category", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white p-4 font-serif outline-none"
                            >
                              <option value="">{t.q2CategoryPlaceholder}</option>
                              {t.q2CategoryOptions.map((label) => (
                                <option key={label} value={label}>{label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-700 font-serif mb-2">{t.q3Swallowed}</label>
                            <textarea
                              rows={3}
                              value={formData.q3_swallowed || ""}
                              onChange={(e) => handleFormChange("q3_swallowed", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white p-4 font-serif outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-serif mb-2">{t.q4Wants}</label>
                            <textarea
                              rows={2}
                              value={formData.q4_wants || ""}
                              onChange={(e) => handleFormChange("q4_wants", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white p-4 font-serif outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-serif mb-2">{t.q5Avoid}</label>
                            <input
                              type="text"
                              value={formData.q5_avoid || ""}
                              onChange={(e) => handleFormChange("q5_avoid", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white p-4 font-serif outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-serif mb-2">{t.q6Comfort}</label>
                            <input
                              type="text"
                              value={formData.q6_comfort || ""}
                              onChange={(e) => handleFormChange("q6_comfort", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white p-4 font-serif outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-serif mb-2">{t.q7Wish}</label>
                            <textarea
                              rows={2}
                              value={formData.q7_wish || ""}
                              onChange={(e) => handleFormChange("q7_wish", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white p-4 font-serif outline-none"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-slate-700 font-serif mb-2">{t.recoveryQ2Core}</label>
                            <textarea
                              rows={3}
                              value={formData.q2_core || ""}
                              onChange={(e) => handleFormChange("q2_core", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white p-4 font-serif outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-serif mb-2">{t.recoveryQ3Breakdown}</label>
                            <textarea
                              rows={3}
                              value={formData.q3_breakdown || ""}
                              onChange={(e) => handleFormChange("q3_breakdown", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white p-4 font-serif outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-serif mb-2">{t.recoveryQ4Wish}</label>
                            <textarea
                              rows={2}
                              value={formData.q4_wish || ""}
                              onChange={(e) => handleFormChange("q4_wish", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white p-4 font-serif outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-serif mb-2">{t.recoveryQ5Time}</label>
                            <input
                              type="text"
                              value={formData.q5_time || ""}
                              onChange={(e) => handleFormChange("q5_time", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white p-4 font-serif outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-serif mb-2">{t.recoveryQ6Action}</label>
                            <input
                              type="text"
                              value={formData.q6_action || ""}
                              onChange={(e) => handleFormChange("q6_action", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white p-4 font-serif outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 font-serif mb-2">{t.recoveryQ7Support}</label>
                            <textarea
                              rows={2}
                              value={formData.q7_support || ""}
                              onChange={(e) => handleFormChange("q7_support", e.target.value)}
                              className="w-full rounded-xl border border-slate-200 bg-white p-4 font-serif outline-none"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-6">
                  <span className="text-xs text-slate-400 font-sans">
                    {Object.values(formData).filter((value) => value.trim().length > 0).length} / 7 {t.questionsCompleted}
                  </span>
                  
                  <button
                    onClick={handleFormSubmit}
                    className="px-8 py-3.5 bg-slate-800 text-white rounded-full font-serif text-lg hover:bg-slate-700 transition-all flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200 active:scale-95 cursor-pointer"
                  >
                    {t.nextStep}
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* 2. 처방 티어 선택 (5 Tiers Grid matching test.html) */}
            {view === "tier" && (
              <div className="flex flex-col items-center w-full mt-4 animate-fade-in">
                <h2 className="font-serif text-2xl text-slate-700 mb-8 text-center font-bold">{t.selectTier}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-3xl">
                  {TIERS.map((tier) => (
                    <div
                      key={tier.id}
                      onClick={() => handleSelectTier(tier)}
                      className={`relative bg-white/85 backdrop-blur-md rounded-2xl p-8 text-center border transition-all duration-300 cursor-pointer shadow-layered hover:shadow-layered-hover hover:-translate-y-1 ${
                        tier.popular ? "border-amber-300 bg-amber-50/20" : "border-white"
                      }`}
                    >
                      {tier.popular && (
                        <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-bl-lg rounded-tr-2xl font-bold font-sans">
                          {t.popular}
                        </div>
                      )}
                      <h3 className="font-serif text-xl font-bold text-slate-800 mb-2">{t.tierNames[tier.id as keyof typeof t.tierNames]}</h3>
                      <p className="text-slate-500 text-sm mb-6 leading-relaxed min-h-[40px] flex items-center justify-center font-serif">{t.tierDescriptions[tier.id as keyof typeof t.tierDescriptions]}</p>
                      
                      <span className={`text-sm px-4 py-2 rounded-full font-medium ${
                        tier.priceVal === 0 
                          ? "text-emerald-600 border border-emerald-200 bg-emerald-50" 
                          : "text-amber-700 border border-amber-200 bg-amber-50/50 font-bold"
                      }`}>
                        {t.tierPriceText[tier.id as keyof typeof t.tierPriceText]}
                      </span>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => setView("input")}
                  className="mt-10 text-sm text-slate-400 hover:text-slate-600 underline underline-offset-4 font-sans cursor-pointer"
                >
                  {t.goBack}
                </button>
              </div>
            )}

            {/* 3. 결제 모듈 */}
            {view === "payment" && selectedProduct && (
              <div className="flex flex-col items-center w-full max-w-md mt-6 animate-fade-in bg-white/80 backdrop-blur-md rounded-2xl p-8 text-center border border-amber-100 shadow-layered">
                <h3 className="font-serif text-2xl text-slate-800 mb-2 font-bold">
                  {t.tierNames[selectedProduct.id as keyof typeof t.tierNames]} {t.paymentSuffix}
                </h3>
                <p className="text-slate-500 text-sm mb-8 font-serif">
                  {t.paymentDesc}
                </p>
                
                {/* 🎁 선물 패키지 정보 입력 (결제창 상단 노출) */}
                {selectedProduct.id === "gift" && (
                  <div className="w-full text-left mb-6 space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-sans">
                        {t.giftRecipientLabel}
                      </label>
                      <input
                        type="text"
                        value={giftRecipient}
                        onChange={(e) => setGiftRecipient(e.target.value)}
                        placeholder={t.giftRecipientPlaceholder}
                        className="block w-full rounded-xl border border-slate-200 bg-white p-3.5 text-slate-800 text-sm placeholder:text-slate-400 font-serif outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-sans">
                        {t.giftRecipientEmailLabel}
                      </label>
                      <input
                        type="email"
                        value={giftRecipientEmail}
                        onChange={(e) => setGiftRecipientEmail(e.target.value)}
                        placeholder={t.giftRecipientEmailPlaceholder}
                        className="block w-full rounded-xl border border-slate-200 bg-white p-3.5 text-slate-800 text-sm placeholder:text-slate-400 font-serif outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="w-full relative z-10">
                  <PayPalButtons
                    style={{ layout: "vertical", height: 48, shape: "rect", color: "black", label: "pay" }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [{ amount: { currency_code: "USD", value: selectedProduct.usd } }]
                      });
                    }}
                    onApprove={async (data, actions) => {
                      if (actions.order) {
                        await actions.order.capture();
                        generateLetter(selectedProduct.id as ProductType);
                      }
                    }}
                  />
                </div>

                {/* 🛡️ 상용 운영 환경 보안: 일반 고객에게 결제 우회 버튼 노출 차단 (개발 모드 전용) */}
                {process.env.NODE_ENV === "development" && (
                  <button
                    onClick={() => generateLetter(selectedProduct.id as ProductType)}
                    className="mt-6 w-full py-3 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl text-xs font-sans hover:bg-slate-100 transition-colors active:scale-95 cursor-pointer font-medium"
                  >
                    {t.testPaymentBypass}
                  </button>
                )}
                
                <button
                  onClick={() => setView("tier")}
                  className="mt-6 text-sm text-slate-400 hover:text-slate-600 underline underline-offset-4 font-sans cursor-pointer"
                >
                  {t.goBack}
                </button>
              </div>
            )}

            {/* 4. 로딩 화면 */}
            {view === "loading" && (
              <div className="flex flex-col items-center justify-center py-20 w-full animate-fade-in text-center">
                <div className="animate-spin mb-8 text-slate-300">
                  <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <p className="text-slate-500 font-serif italic text-lg animate-pulse">
                  {productType === "random" ? t.randomLoadingText : t.loadingText}
                </p>
              </div>
            )}

            {/* 5. 결과 화면 (엽서 & 리뷰) */}
            {view === "full" && (
              <div className="animate-fade-in w-full max-w-2xl mt-4 flex flex-col items-center z-10">
                
                {/* 1. 3D Envelope Opening Scene (Shows if envelope is closed) */}
                {!envelopeOpen && (
                  <div className="w-full flex flex-col items-center justify-center py-12 md:py-20 animate-fade-in">
                    <p className="text-amber-400 font-serif text-lg mb-6 animate-pulse tracking-wide text-center">
                      {t.envelopeIncoming}
                    </p>
                    
                    <div className="envelope-container w-full max-w-[480px] px-4">
                      <div className="envelope-wrapper flex items-center justify-center relative">
                        {/* Top Flap */}
                        <div className="envelope-flap" />
                        
                        {/* Letter Card (Inside Envelope, slides up on open) */}
                        <div className="envelope-letter-card">
                          <div className="w-full h-full border border-[#f1e7d2]/60 rounded-md p-4 flex flex-col items-center justify-center text-center bg-[#fffdf9]/80">
                            <span className="text-[10px] font-sans font-bold text-amber-600/70 tracking-widest uppercase">Secret Letter</span>
                            <div className="w-8 h-[1px] bg-amber-400/40 my-2" />
                            <p className="text-[11px] font-serif text-slate-400 italic">For your healing journey</p>
                          </div>
                        </div>
                        
                        {/* Front pocket with card inside */}
                        <div className="envelope-front-pocket" />

                        {/* Recipient Text - Absolutely positioned at the bottom, above the pocket but below the seal (Zero Overlap!) */}
                        <div className="absolute bottom-6 left-0 right-0 text-center font-serif text-slate-700 select-none pointer-events-none z-20">
                          <p className="text-[10px] tracking-widest uppercase opacity-50 mb-1">Ask Your Heart</p>
                          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">
                            {formData.q1_name || t.dearRecipient}{t.dearRecipientSuffix}
                          </h3>
                          <p className="text-[9px] opacity-40 mt-3 tracking-wider">
                            {t.envelopeSender}
                          </p>
                        </div>

                        {/* Wax Seal Button at the Center (z-index 30 sits on top of everything) */}
                        <div className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] flex flex-col items-center gap-2 z-30">
                          {/* Ambient Aura Gold Glow Ring */}
                          <div className="seal-glow-ring" />

                          <button
                            type="button"
                            onClick={() => {
                              const wrapper = document.querySelector(".envelope-wrapper");
                              if (wrapper) {
                                wrapper.classList.add("open");
                                setTimeout(() => {
                                  setEnvelopeOpen(true);
                                }, 1400); // Transitions to letter sheet after slide up
                              }
                            }}
                            className="wax-seal"
                            aria-label="Open envelope"
                          >
                            <div className="wax-seal-inner">
                              心
                            </div>
                          </button>
                          
                          <span className="seal-help-text text-[10px] font-sans font-bold text-amber-500 tracking-wider animate-bounce select-none uppercase mt-1">
                            {t.sealHelp}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Letter Content & Action Step & Review UI (Shows after envelope is opened) */}
                {envelopeOpen && (
                  <div className="w-full flex flex-col items-center animate-fade-in">
                    
                    {/* 무료 및 유료 전체 엽서용 PDF 다운로드 버튼 */}
                    {letterData && (
                      <button
                        id="download-pdf-btn"
                        onClick={handleDownloadPDF}
                        className="mb-6 px-6 py-3 bg-slate-800 text-white rounded-full font-serif text-sm tracking-wide hover:bg-slate-700 transition shadow-lg flex items-center gap-2 animate-fade-in z-20 active:scale-95 duration-150 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {t.pdfDownloadLabel}
                      </button>
                    )}

                    {/* 다중 페이지 PDF 생성을 위한 숨겨진 페이지 렌더링 (ReportLab B2B 프리미엄 양식) */}
                    {letterData && (
                      <div id="multi-page-pdf-root" className="fixed top-[-9999px] left-[-9999px]" aria-hidden="true">
                        {/* 1페이지: 표지 (오너먼트 그리드 장식 테두리 및 미색 캔버스) */}
                        <div className="pdf-page w-[210mm] h-[297mm] flex flex-col items-center justify-between bg-[#FDFBF7] p-[25mm] border-[8px] border-double border-slate-200 relative">
                          <div className="w-full h-full border border-slate-200 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-12 h-0.5 bg-amber-300/60 mb-12" />
                            <h1 className="text-4xl md:text-5xl font-serif text-slate-800 tracking-tight leading-tight mb-8">
                              {letterData.cover?.title || t.freeCardLabel}
                            </h1>
                            <p className="text-xl text-slate-500 font-serif max-w-lg leading-relaxed mb-12">
                              {letterData.cover?.heart_name}
                            </p>
                            <div className="w-12 h-0.5 bg-amber-300/60 mt-12" />
                          </div>
                          
                          {/* 하단 브랜드 푸터 */}
                          <div className="w-full flex justify-between items-center text-[10px] text-slate-400 font-sans tracking-wider border-t border-slate-100 pt-6">
                            <span>{t.footerBrand} @young_beom_oh</span>
                            <span>PAGE 1 OF {(!letterData.recovery_days || letterData.recovery_days.length === 0) ? (getPaginatedParagraphs().length + (letterData.emotions ? 3 : 2)) : (letterData.recovery_days.length + 1)}</span>
                          </div>
                        </div>

                        {(!letterData.recovery_days || letterData.recovery_days.length === 0) && (
                          <>
                            {getPaginatedParagraphs().map((pageParas, pageIdx) => (
                              <div key={`pdf-body-page-${pageIdx}`} className="pdf-page w-[210mm] h-[297mm] bg-[#FDFBF7] p-[25mm] border-[8px] border-double border-slate-200 flex flex-col justify-between relative">
                                <div className="w-full h-full border border-slate-200 p-12 flex flex-col justify-center font-serif leading-[2.25] text-lg text-slate-700">
                                  {pageParas.map((para, idx) => (
                                    <p key={`body-${idx}`} className="mb-8 text-justify tracking-wide indent-4 last:mb-0">
                                      {para}
                                    </p>
                                  ))}
                                </div>

                                {/* 하단 브랜드 푸터 */}
                                <div className="w-full flex justify-between items-center text-[10px] text-slate-400 font-sans tracking-wider border-t border-slate-100 pt-6 mt-6">
                                  <div className="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                                    <span>{isKorean ? "당신의 마음을 듣습니다" : "Listening to your heart"} @young_beom_oh</span>
                                  </div>
                                  <span>PAGE {pageIdx + 2} OF {getPaginatedParagraphs().length + (letterData.emotions ? 3 : 2)}</span>
                                </div>
                              </div>
                            ))}

                            {/* 신규 3페이지: 심리 분석 프로파일 리포트 (마음의 무늬) */}
                            {letterData && letterData.emotions && (
                              <div className="pdf-page w-[210mm] h-[297mm] bg-[#FDFBF7] p-[25mm] border-[8px] border-double border-slate-200 flex flex-col justify-between relative">
                                <div className="w-full h-full border border-slate-200 p-12 flex flex-col justify-center space-y-8">
                                  <div className="text-center border-b border-slate-200 pb-4">
                                    <h3 className="text-2xl font-serif text-slate-800 font-bold mb-2">
                                      🧠 {isKorean ? "마음의 무늬 (심리 분석 리포트)" : "Inner Heart Profile Report"}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-sans tracking-wide">
                                      {isKorean 
                                        ? "오영범 마스터의 공감 프로파일러 에이전트가 진단한 감정 상태 리포트입니다." 
                                        : "Diagnostic emotional state report from Empathy Profiler Agent."}
                                    </p>
                                  </div>

                                  {/* 5대 감정 프로그레스바 게이지 (PDF용 컴팩트 레이아웃) */}
                                  <div className="space-y-4 my-6">
                                    {Object.entries(letterData.emotions).map(([key, val]) => {
                                      const labelMap: Record<string, string> = {
                                        anxiety: isKorean ? "불안 (Anxiety)" : "Anxiety",
                                        helplessness: isKorean ? "무기력 (Helplessness)" : "Helplessness",
                                        self_blame: isKorean ? "자책 (Self-Blame)" : "Self-Blame",
                                        sadness: isKorean ? "슬픔 (Sadness)" : "Sadness",
                                        loneliness: isKorean ? "고독 (Loneliness)" : "Loneliness"
                                      };
                                      const colorMap: Record<string, string> = {
                                        anxiety: "bg-indigo-500",
                                        helplessness: "bg-zinc-500",
                                        self_blame: "bg-red-500",
                                        sadness: "bg-blue-500",
                                        loneliness: "bg-orange-500"
                                      };
                                      const percent = Math.round(val * 100);
                                      return (
                                        <div key={key} className="space-y-1">
                                          <div className="flex justify-between text-xs font-sans text-slate-600">
                                            <span>{labelMap[key] || key}</span>
                                            <span className="font-bold text-slate-800">{percent}%</span>
                                          </div>
                                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full rounded-full ${colorMap[key] || "bg-amber-400"}`}
                                              style={{ width: `${percent}%` }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* 방어기제 및 핵심 아픔 진단서 */}
                                  <div className="space-y-4">
                                    {letterData.defense_mechanism && (
                                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                                        <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                                          🛡️ {isKorean ? "주요 심리적 방어기제 (Defense Mechanism)" : "Defense Mechanism"}
                                        </h4>
                                        <p className="text-[13px] font-serif text-slate-700 leading-relaxed">
                                          {letterData.defense_mechanism}
                                        </p>
                                      </div>
                                    )}
                                    {letterData.core_pain_point && (
                                      <div className="p-4 rounded-xl bg-amber-50/20 border border-amber-100/60">
                                        <h4 className="text-[10px] font-bold text-amber-600/70 tracking-wider uppercase mb-1">
                                          🎯 {isKorean ? "핵심 마음의 아픔 (Core Pain Point)" : "Core Pain Point"}
                                        </h4>
                                        <p className="text-[13px] font-serif text-slate-700 leading-relaxed">
                                          {letterData.core_pain_point}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* 하단 브랜드 푸터 */}
                                <div className="w-full flex justify-between items-center text-[10px] text-slate-400 font-sans tracking-wider border-t border-slate-100 pt-6 mt-6">
                                  <span>{t.footerBrand} @young_beom_oh</span>
                                  <span>PAGE {getPaginatedParagraphs().length + 2} OF {getPaginatedParagraphs().length + (letterData.emotions ? 3 : 2)}</span>
                                </div>
                              </div>
                            )}

                            {/* 부록 페이지: 문장, 질문, 작은 행동, SHA-256 서명 */}
                            <div className="pdf-page w-[210mm] h-[297mm] bg-[#FDFBF7] p-[25mm] border-[8px] border-double border-slate-200 flex flex-col justify-between relative">
                              <div className="w-full h-full border border-slate-200 p-12 flex flex-col justify-center space-y-10">
                                <div>
                                  <h3 className="text-xl mb-6 font-serif text-slate-900 font-bold border-b border-amber-200 pb-2">{t.premiumSentenceHeader}</h3>
                                  {letterData.page_sentences?.map((sentence, idx) => (
                                    <p key={`s-${idx}`} className="mb-3 text-[15px] font-serif text-slate-600 italic pl-4 border-l-2 border-amber-300">“ {sentence} ”</p>
                                  ))}
                                </div>

                                <div>
                                  <h3 className="text-xl mb-6 font-serif text-slate-900 font-bold border-b border-amber-200 pb-2">{t.premiumQuestionHeader}</h3>
                                  {letterData.page_questions?.map((q, idx) => (
                                    <p key={`q-${idx}`} className="mb-3 text-[15px] font-serif text-slate-600">Q. {q}</p>
                                  ))}
                                </div>

                                {letterData.page_action && (
                                  <div>
                                    <h3 className="text-xl mb-4 font-serif text-slate-900 font-bold border-b border-amber-200 pb-2">{t.premiumActionHeader}</h3>
                                    <p className="text-[14px] font-serif text-slate-600 bg-amber-50/50 p-4 rounded-xl border border-amber-100">{letterData.page_action}</p>
                                  </div>
                                )}

                                {/* 🧠 뇌과학적 등불 (Scientific Reference) - RAG 문헌 각인 */}
                                {letterData.scientific_reference && (
                                  <div className="mt-8 border border-amber-200/50 p-4 rounded-xl bg-amber-50/20 text-left font-serif max-w-[500px] self-end">
                                    <h4 className="font-bold text-[10px] text-amber-800 flex items-center gap-1.5 mb-1.5 font-sans tracking-wide">
                                      🧠 {isKorean ? "뇌과학적 등불 (Scientific Reference)" : "Scientific Reference"}
                                    </h4>
                                    <p className="text-[11px] font-medium text-slate-800 mb-0.5 leading-relaxed">
                                      {letterData.scientific_reference.title}
                                    </p>
                                    <p className="text-[9px] text-slate-500 mb-1.5 font-sans">
                                      By {letterData.scientific_reference.authors} | <a href={letterData.scientific_reference.source_url} target="_blank" rel="noopener noreferrer" className="underline text-amber-700 hover:text-amber-800 cursor-pointer">prescribed research</a>
                                    </p>
                                    <p className="text-[10px] text-slate-600 pl-2.5 border-l-2 border-amber-300 italic">
                                      "{letterData.scientific_reference.insight_ko}"
                                    </p>
                                  </div>
                                )}

                                {/* SHA-256 디지털 서명 블록 (위조 방지 증명) */}
                                {sha256Hash && (
                                  <div className="mt-8 border border-slate-200/60 p-4 rounded-xl bg-white/70 flex flex-col gap-1 text-[9px] font-mono text-slate-400 self-end w-fit">
                                    <span className="font-bold text-[10px] text-slate-500 font-sans tracking-wide">🛡️ B2B SECURE DIGITAL SIGNATURE</span>
                                    <span>HASH: {sha256Hash}</span>
                                    <span>VERIFIED BY MASTER O.Y.B INTEGRITY ENGINE</span>
                                  </div>
                                )}
                              </div>

                              {/* 하단 브랜드 푸터 */}
                              <div className="w-full flex justify-between items-center text-[10px] text-slate-400 font-sans tracking-wider border-t border-slate-100 pt-6 mt-6">
                                <span>{t.footerBrand} @young_beom_oh</span>
                                <span>PAGE {getPaginatedParagraphs().length + (letterData.emotions ? 3 : 2)} OF {getPaginatedParagraphs().length + (letterData.emotions ? 3 : 2)}</span>
                              </div>
                            </div>
                          </>
                        )}

                        {letterData.recovery_days && letterData.recovery_days.map((dayData, idx) => {
                          const scale = getRecoveryTextScale(dayData.letter);
                          const dayBgUrl = aestheticBackgrounds[(dayData.day - 1) % aestheticBackgrounds.length];
                          
                          return (
                            <div key={`recovery-${idx}`} className={`pdf-page w-[210mm] h-[297mm] flex flex-col justify-between relative ${scale.containerPadding} border-double border-[#e6dec9]/70 bg-gradient-to-b from-[#fdfbf7] via-[#faf6f0] to-[#f4eee3] overflow-hidden`}>
                              {/* 1. Static Unsplash Image Layer */}
                              <div
                                className="absolute inset-0 z-0 bg-cover bg-center"
                                style={{
                                  backgroundImage: `url('${dayBgUrl}')`,
                                }}
                              />
                              {/* 2. Glassmorphic Gradient Overlay Layer */}
                              <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#fdfbf7]/92 to-[#f4eee3]/97" />
                              {/* 3. Pure CSS 아날로그 red grid paper micro-texture Layer */}
                              <div 
                                className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply" 
                                style={{
                                  backgroundImage: `linear-gradient(90deg, rgba(220,50,50,0.03) 50%, transparent 50%), 
                                                    linear-gradient(rgba(220,50,50,0.03) 50%, transparent 50%)`,
                                  backgroundSize: '4px 4px'
                                }}
                              />
                              {/* 4. Vintage Postage Stamp (Top-Right Decor) */}
                              <div className="absolute top-4 right-4 z-20 pointer-events-none">
                                <div className="vintage-stamp shadow-sm border border-dashed border-[#e6dec9] bg-white/60 backdrop-blur-sm">
                                  <span className="text-[7px] font-sans font-bold text-[#b91c1c] tracking-widest uppercase">KOREA</span>
                                  <div className="text-sm my-1 text-slate-600 font-serif">心</div>
                                  <span className="text-[6px] font-sans text-slate-400">2026</span>
                                </div>
                              </div>

                              <div className="relative z-10 w-full h-full border border-[#e6dec9]/60 p-8 flex flex-col justify-between">
                                <div>
                                  <h2 className={`${scale.titleSize} font-serif text-slate-900 mb-4 border-b border-[#e6dec9]/60 pb-2 inline-block font-bold`}>
                                    {dayData.day}{t.recoveryDayHeader}
                                  </h2>
                                  <p className={`font-serif ${scale.lineHeight} ${scale.fontSize} text-slate-700 whitespace-pre-wrap ${scale.paragraphMargin} text-justify tracking-[0.01em] indent-4`}>
                                    {dayData.letter}
                                  </p>
                                </div>
                                
                                {/* 1개 문장 처방 */}
                                {dayData.sentence && (
                                  <div className={`border-l-4 border-amber-300 pl-4 italic ${scale.sentenceSize} text-slate-600 font-serif leading-relaxed`}>
                                    “ {dayData.sentence} ”
                                  </div>
                                )}
                                
                                {/* 7일차 정리 문장 3개 */}
                                {dayData.day === 7 && dayData.summary_sentences && (
                                  <div className={`${scale.summaryMargin} bg-amber-50/20 border border-amber-100 rounded-2xl`}>
                                    <h3 className="text-[13px] font-bold text-slate-700 mb-3 tracking-wide font-sans flex items-center gap-1.5 border-b border-amber-200/50 pb-2">
                                      📜 {isKorean ? "7일간의 여정을 마무리하는 정리 문장" : "Closing summary sentences of the 7-day journey"}
                                    </h3>
                                    <div className="space-y-2">
                                      {dayData.summary_sentences.map((s: string, sIdx: number) => (
                                        <p key={sIdx} className="text-[13px] font-serif text-slate-600 italic pl-3 border-l-2 border-amber-300">
                                          “ {s} ”
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className={`${scale.actionMargin} border border-amber-200/50 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm`}>
                                  <h3 className="text-sm font-serif text-slate-900 font-bold border-b border-amber-200/50 pb-1.5 mb-2 inline-block">{t.premiumActionHeader}</h3>
                                  <p className="text-[13px] font-serif text-slate-600 leading-relaxed">{dayData.action}</p>
                                </div>

                                {/* 🧠 뇌과학적 등불 (Scientific Reference) - RAG 문헌 각인 */}
                                {idx === letterData.recovery_days!.length - 1 && letterData.scientific_reference && (
                                  <div className="mt-4 border border-amber-200/50 p-4 rounded-xl bg-amber-50/20 text-left font-serif max-w-[500px] self-end shadow-sm">
                                    <h4 className="font-bold text-[10px] text-amber-800 flex items-center gap-1.5 mb-1.5 font-sans tracking-wide">
                                      🧠 {isKorean ? "뇌과학적 등불 (Scientific Reference)" : "Scientific Reference"}
                                    </h4>
                                    <p className="text-[11px] font-medium text-slate-800 mb-0.5 leading-relaxed">
                                      {letterData.scientific_reference.title}
                                    </p>
                                    <p className="text-[9px] text-slate-500 mb-1.5 font-sans">
                                      By {letterData.scientific_reference.authors} | <a href={letterData.scientific_reference.source_url} target="_blank" rel="noopener noreferrer" className="underline text-amber-700 hover:text-amber-800 cursor-pointer">prescribed research</a>
                                    </p>
                                    <p className="text-[10px] text-slate-600 pl-2.5 border-l-2 border-amber-300 italic">
                                      "{letterData.scientific_reference.insight_ko}"
                                    </p>
                                  </div>
                                )}

                                {/* 마지막 페이지(7일차)에 SHA-256 서명 각인 */}
                                {idx === letterData.recovery_days!.length - 1 && sha256Hash && (
                                  <div className="mt-4 border border-slate-200/60 p-4 rounded-xl bg-white/70 flex flex-col gap-1 text-[9px] font-mono text-slate-400 self-end w-fit shadow-inner">
                                    <span className="font-bold text-[10px] text-slate-500 font-sans tracking-wide">🛡️ B2B SECURE DIGITAL SIGNATURE</span>
                                    <span>HASH: {sha256Hash}</span>
                                    <span>VERIFIED BY MASTER O.Y.B INTEGRITY ENGINE</span>
                                  </div>
                                )}
                              </div>

                              {/* 하단 브랜드 푸터 */}
                              <div className="relative z-10 w-full flex justify-between items-center text-[10px] text-slate-400 font-sans tracking-wider border-t border-[#e6dec9]/60 pt-4 mt-4">
                                <div className="flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                                  <span>{isKorean ? "당신의 마음을 듣습니다" : "Listening to your heart"} @young_beom_oh</span>
                                </div>
                                <span>PAGE {idx + 2} OF {letterData.recovery_days!.length + 1}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {["free", "random"].includes(productType) ? (
                      <div
                        id="letter-container"
                        onClick={skipTyping}
                        className="deckled-letter-paper rounded-xl p-10 md:p-16 w-full mb-8 relative overflow-hidden cursor-pointer"
                      >
                        {/* 1. Static Unsplash Image Layer with GPU acceleration */}
                        <div
                          className="absolute inset-0 z-0 transition-all duration-1000 will-change-transform transform-gpu translate-z-0 bg-cover bg-center"
                          style={{
                            backgroundImage: `url('${bgUrl}')`,
                          }}
                        />
                        {/* 2. Glassmorphic Gradient Overlay Layer */}
                        <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/85 to-white/95" />
                        {/* 3. Pure CSS 아날로그 red grid paper micro-texture Layer */}
                        <div 
                          className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply" 
                          style={{
                            backgroundImage: `linear-gradient(90deg, rgba(220,50,50,0.03) 50%, transparent 50%), 
                                              linear-gradient(rgba(220,50,50,0.03) 50%, transparent 50%)`,
                            backgroundSize: '4px 4px'
                          }}
                        />
                        
                        {/* 4. Vintage Postage Stamp (Top-Right Decor) */}
                        <div className="absolute top-6 right-6 z-20 pointer-events-none no-print">
                          <div className="vintage-stamp">
                            <span className="text-[7px] font-sans font-bold text-[#b91c1c] tracking-widest uppercase">KOREA</span>
                            <div className="text-sm my-1 text-slate-600 font-serif">心</div>
                            <span className="text-[6px] font-sans text-slate-400">2026</span>
                          </div>
                        </div>

                        <div className="relative z-10">
                          <p className="text-xs font-bold tracking-widest text-slate-400 mb-10 border-b border-slate-200/50 pb-4 text-center uppercase font-sans">
                            {t.storyHeader}
                          </p>
                          
                          <div className={`font-serif min-h-[300px] whitespace-pre-wrap flex flex-col ${
                            productType === "random" 
                              ? "justify-center text-2xl md:text-[26px] text-center py-12 leading-relaxed break-keep font-semibold text-slate-800" 
                              : "text-lg md:text-xl leading-loose text-slate-700"
                          }`}>
                            {productType === "random" ? (
                              <div className="relative inline-block mx-auto max-w-2xl px-8 py-6">
                                <span className="absolute top-0 left-0 text-6xl text-slate-300/50 font-serif leading-none select-none pointer-events-none">“</span>
                                <span className="relative z-10">{typedText}</span>
                                {(!isTyping) && <span className="absolute -bottom-4 right-0 text-6xl text-slate-300/50 font-serif leading-none select-none pointer-events-none">”</span>}
                                {isTyping && <span className="inline-block w-1.5 h-6 md:h-8 bg-slate-400 ml-2 animate-pulse align-middle relative z-10" />}
                              </div>
                            ) : (
                              <div>
                                {typedText}
                                {isTyping && <span className="inline-block w-1.5 h-6 bg-slate-400 ml-2 animate-pulse align-middle" />}
                              </div>
                            )}
                          </div>

                          {/* Master's Vintage Signature Signoff */}
                          {(!isTyping || view === "full") && (
                            <div className="mt-12 border-t border-slate-200/50 pt-6 flex flex-col items-end gap-1 select-none">
                              <p className="text-[11px] text-slate-400 font-sans italic">Warm regards,</p>
                              <h4 className="text-xl md:text-2xl font-serif text-slate-800 font-bold" style={{ fontFamily: "var(--font-serif), serif" }}>
                                Master 오영범
                              </h4>
                              {/* Instagram UGC Logo & Global Text */}
                              <div className="mt-2 flex items-center gap-1.5 text-slate-400 hover:text-slate-500 transition-colors text-xs font-sans">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                                <span>@young_beom_oh</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : letterData ? (
                      <div className="w-full flex flex-col items-center animate-fade-in mb-8 px-4 sm:px-0">
                        {/* 프리미엄 웹 뷰어 컨테이너 (Premium Handcrafted Letter Sheet - HSL Tailored Hues) */}
                        <div className="w-full max-w-2xl deckled-letter-paper rounded-[32px] p-6 sm:p-12 md:p-16 mb-8 text-left overflow-hidden relative shadow-[0_30px_100px_rgba(27,24,17,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] border border-[#e6dec9]/70 bg-gradient-to-b from-[#fdfbf7] via-[#faf6f0] to-[#f4eee3]">
                          
                          {/* Vintage Postage Stamp (Top-Right Decor) */}
                          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 pointer-events-none no-print">
                            <div className="vintage-stamp shadow-sm border border-dashed border-[#e6dec9] bg-white/60 backdrop-blur-sm">
                              <span className="text-[7px] font-sans font-bold text-[#b91c1c] tracking-widest uppercase">KOREA</span>
                              <div className="text-sm my-1 text-slate-600 font-serif">心</div>
                              <span className="text-[6px] font-sans text-slate-400">2026</span>
                            </div>
                          </div>

                          <div className="text-center mb-8 md:mb-14 border-b border-[#e6dec9]/60 pb-6 md:pb-10">
                            <h1 className="text-2xl sm:text-3xl md:text-[42px] font-serif text-slate-900 mb-4 tracking-tight leading-tight font-bold">{letterData?.cover?.title || t.freeCardLabel}</h1>
                            <p className="mx-auto max-w-xl text-base md:text-lg text-slate-500 font-serif leading-relaxed italic">{letterData?.cover?.heart_name}</p>
                          </div>

                          {(!letterData?.recovery_days || letterData.recovery_days.length === 0) ? (
                            <div className="font-serif leading-[2.25] text-[1.02rem] md:text-lg text-slate-700 space-y-8">
                              {(letterData?.page_letter_paragraphs?.length ? letterData.page_letter_paragraphs : [letterData?.letter || ""]).map((para, idx) => (
                                <p key={`web-para-${idx}`} className="mb-8 first:mt-0 text-justify tracking-[0.01em] indent-4">{para}</p>
                              ))}
                              
                              {/* 🧠 오영범 마스터의 공감 심리 분석 프로파일 (Empathy Profiler Web UI) */}
                              {letterData && letterData.emotions && (
                                <div className="mt-12 bg-white/95 backdrop-blur-[1px] p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-slate-200/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_20px_50px_rgba(15,23,42,0.05)]">
                                  <h3 className="text-xl md:text-2xl font-serif text-slate-900 font-bold mb-2 flex items-center gap-2">
                                    🧠 {isKorean ? "마음의 무늬 (심리 프로파일)" : "Inner Heart Profile"}
                                  </h3>
                                  <p className="text-xs text-slate-400 font-sans tracking-wide mb-6">
                                    {isKorean 
                                      ? "사연에서 읽어낸 당신의 감정 지표와 심리적 메커니즘 분석서입니다." 
                                      : "An analysis of your emotional indices and psychological defense mechanisms."}
                                  </p>
                                  
                                  {/* 5대 감정 프로그레스바 게이지 */}
                                  <div className="space-y-4 mb-8">
                                    {Object.entries(letterData.emotions).map(([key, val]) => {
                                      const labelMap: Record<string, string> = {
                                        anxiety: isKorean ? "불안 (Anxiety)" : "Anxiety",
                                        helplessness: isKorean ? "무기력 (Helplessness)" : "Helplessness",
                                        self_blame: isKorean ? "자책 (Self-Blame)" : "Self-Blame",
                                        sadness: isKorean ? "슬픔 (Sadness)" : "Sadness",
                                        loneliness: isKorean ? "고독 (Loneliness)" : "Loneliness"
                                      };
                                      const colorMap: Record<string, string> = {
                                        anxiety: "from-indigo-400 to-indigo-600",
                                        helplessness: "from-zinc-400 to-zinc-600",
                                        self_blame: "from-rose-400 to-red-600",
                                        sadness: "from-sky-400 to-blue-600",
                                        loneliness: "from-amber-400 to-orange-600"
                                      };
                                      const percent = Math.round(val * 100);
                                      return (
                                        <div key={key} className="space-y-1.5">
                                          <div className="flex justify-between text-xs font-sans font-medium text-slate-600">
                                            <span>{labelMap[key] || key}</span>
                                            <span className="font-bold text-slate-800">{percent}%</span>
                                          </div>
                                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full rounded-full bg-gradient-to-r ${colorMap[key] || "from-amber-400 to-amber-500"} transition-all duration-1000 ease-out`}
                                              style={{ width: `${percent}%` }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* 방어기제 및 고민 포인트 카드 */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {letterData.defense_mechanism && (
                                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60">
                                        <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">
                                          🛡️ {isKorean ? "주요 방어기제" : "Defense Mechanism"}
                                        </h4>
                                        <p className="text-[14px] font-medium text-slate-800 font-serif leading-relaxed">
                                          {letterData.defense_mechanism}
                                        </p>
                                      </div>
                                    )}
                                    {letterData.core_pain_point && (
                                      <div className="p-5 rounded-2xl bg-amber-50/20 border border-amber-100/60">
                                        <h4 className="text-xs font-bold text-amber-600/70 tracking-wider uppercase mb-2">
                                          🎯 {isKorean ? "핵심 마음의 아픔" : "Core Pain Point"}
                                        </h4>
                                        <p className="text-[14px] font-medium text-slate-800 font-serif leading-relaxed">
                                          {letterData.core_pain_point}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="mt-16 bg-white/90 backdrop-blur-[1px] p-5 sm:p-8 rounded-2xl sm:rounded-[32px] border border-amber-100/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_25px_60px_rgba(15,23,42,0.08)]">
                                <h3 className="text-2xl mb-6 font-serif text-slate-900 font-semibold border-b border-amber-100 pb-3 inline-block">오래 간직할 문장</h3>
                                {letterData?.page_sentences?.map((sentence, idx) => (
                                  <p key={`web-s-${idx}`} className="mb-4 text-slate-600 text-[0.98rem] leading-8 italic pl-4 border-l-2 border-amber-300">“ {sentence} ”</p>
                                ))}
                                
                                <h3 className="text-2xl mt-12 mb-6 font-serif text-slate-900 font-semibold border-b border-amber-100 pb-3 inline-block">나에게 묻는 질문</h3>
                                {letterData?.page_questions?.map((q, idx) => (
                                  <p key={`web-q-${idx}`} className="mb-4 text-slate-600 text-[0.98rem] leading-8">Q. {q}</p>
                                ))}

                                {letterData?.page_action && (
                                  <>
                                    <h3 className="text-2xl mt-12 mb-6 font-serif text-slate-900 font-semibold border-b border-amber-100 pb-3 inline-block">{t.premiumActionHeader}</h3>
                                    <p className="text-slate-600 text-[0.99rem] leading-7 bg-amber-50/50 p-4 rounded-xl border border-amber-100">{letterData.page_action}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="font-serif text-slate-700 space-y-16">
                              {letterData.recovery_days.map((dayData, idx) => {
                                const scale = getRecoveryTextScale(dayData.letter);
                                const dayBgUrl = aestheticBackgrounds[(dayData.day - 1) % aestheticBackgrounds.length];
                                
                                return (
                                  <div key={`web-recovery-${idx}`} className="mb-16 last:mb-0 rounded-[32px] p-6 sm:p-12 md:p-16 border border-[#e6dec9]/70 bg-gradient-to-b from-[#fdfbf7] via-[#faf6f0] to-[#f4eee3] overflow-hidden relative shadow-[0_25px_70px_rgba(27,24,17,0.05)] text-left">
                                    {/* 1. Static Unsplash Image Layer */}
                                    <div
                                      className="absolute inset-0 z-0 bg-cover bg-center"
                                      style={{
                                        backgroundImage: `url('${dayBgUrl}')`,
                                      }}
                                    />
                                    {/* 2. Glassmorphic Gradient Overlay Layer */}
                                    <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#fdfbf7]/92 to-[#f4eee3]/97" />
                                    {/* 3. Pure CSS 아날로그 red grid paper micro-texture Layer */}
                                    <div 
                                      className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply" 
                                      style={{
                                        backgroundImage: `linear-gradient(90deg, rgba(220,50,50,0.03) 50%, transparent 50%), 
                                                          linear-gradient(rgba(220,50,50,0.03) 50%, transparent 50%)`,
                                        backgroundSize: '4px 4px'
                                      }}
                                    />
                                    {/* 4. Vintage Postage Stamp (Top-Right Decor) */}
                                    <div className="absolute top-4 right-4 z-20 pointer-events-none">
                                      <div className="vintage-stamp shadow-sm border border-dashed border-[#e6dec9] bg-white/60 backdrop-blur-sm">
                                        <span className="text-[7px] font-sans font-bold text-[#b91c1c] tracking-widest uppercase">KOREA</span>
                                        <div className="text-sm my-1 text-slate-600 font-serif">心</div>
                                        <span className="text-[6px] font-sans text-slate-400">2026</span>
                                      </div>
                                    </div>

                                    <div className="relative z-10">
                                      <h2 className={`${scale.titleSize} font-serif text-slate-900 mb-6 border-b border-[#e6dec9]/60 pb-3 inline-block font-bold`}>
                                        {dayData.day}일차 회복 편지
                                      </h2>
                                      <p className={`leading-relaxed text-[1.01rem] md:text-lg whitespace-pre-wrap ${scale.paragraphMargin} text-slate-700 text-justify tracking-[0.01em] indent-4`}>
                                        {dayData.letter}
                                      </p>
                                      
                                      {/* 1개 문장 처방 */}
                                      {dayData.sentence && (
                                        <div className="mb-8 border-l-4 border-amber-300 pl-4 italic text-[1.01rem] text-slate-600 font-serif leading-relaxed">
                                          “ {dayData.sentence} ”
                                        </div>
                                      )}
                                      
                                      {/* 7일차 정리 문장 3개 */}
                                      {dayData.day === 7 && dayData.summary_sentences && (
                                        <div className="mb-8 p-6 bg-amber-50/20 border border-amber-100 rounded-2xl">
                                          <h3 className="text-base font-bold text-slate-700 mb-4 tracking-wide font-sans flex items-center gap-1.5 border-b border-amber-200/50 pb-2">
                                            📜 {isKorean ? "7일간의 여정을 마무리하는 정리 문장" : "Closing summary sentences of the 7-day journey"}
                                          </h3>
                                          <div className="space-y-3">
                                            {dayData.summary_sentences.map((s: string, sIdx: number) => (
                                              <p key={sIdx} className="text-sm font-serif text-slate-600 italic pl-4 border-l-2 border-amber-300">
                                                “ {s} ”
                                              </p>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-6 rounded-2xl border border-amber-200/50 shadow-sm">
                                        <h3 className="text-lg md:text-xl font-serif text-slate-900 mb-3 font-semibold border-b border-amber-200/50 pb-2 inline-block">{t.premiumActionHeader}</h3>
                                        <p className="text-slate-600 text-[0.98rem] leading-7">{dayData.action}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* 🧠 뇌과학적 등불 (Scientific Reference) - RAG 문헌 각인 */}
                          {letterData.scientific_reference && (
                            <div className="mt-12 border border-amber-200/50 p-5 rounded-2xl bg-amber-50/20 text-left font-serif w-full sm:max-w-[550px] self-start shadow-sm">
                              <h4 className="font-bold text-xs text-amber-800 flex items-center gap-1.5 mb-2 font-sans tracking-wide">
                                🧠 {isKorean ? "뇌과학적 등불 (Scientific Reference)" : "Scientific Reference"}
                              </h4>
                              <p className="text-[12px] font-medium text-slate-800 mb-0.5 leading-relaxed">
                                {letterData.scientific_reference.title}
                              </p>
                              <p className="text-[10px] text-slate-500 mb-2 font-sans">
                                By {letterData.scientific_reference.authors} | <a href={letterData.scientific_reference.source_url} target="_blank" rel="noopener noreferrer" className="underline text-amber-700 hover:text-amber-800 cursor-pointer">prescribed research link</a>
                              </p>
                              <p className="text-[11px] text-slate-600 pl-3 border-l-2 border-amber-300 italic">
                                "{letterData.scientific_reference.insight_ko}"
                              </p>
                            </div>
                          )}

                          {/* 위조 방지 SHA-256 디지털 서명 블록 (유료 결제 유저만을 위한 보안 오너먼트) */}
                          {sha256Hash && (
                            <div className="mt-12 border border-slate-200/60 p-4 rounded-xl bg-white/70 flex flex-col gap-1 text-[9px] font-mono text-slate-400 self-start w-full sm:w-fit shadow-inner">
                              <span className="font-bold text-[10px] text-slate-500 font-sans tracking-wide">🛡️ B2B SECURE DIGITAL SIGNATURE</span>
                              <span className="break-all">HASH: {sha256Hash}</span>
                              <span>VERIFIED BY MASTER O.Y.B INTEGRITY ENGINE</span>
                            </div>
                          )}

                          {/* Master's Premium Vintage Signature Signoff */}
                          <div className="mt-16 border-t border-slate-200/60 pt-8 flex flex-col items-end gap-1 select-none">
                            <p className="text-sm text-slate-400 font-sans italic">Warm regards,</p>
                            <h4 className="text-2xl font-serif text-slate-800 font-bold" style={{ fontFamily: "var(--font-serif), serif" }}>
                              Master 오영범
                            </h4>
                            <div className="mt-2 flex items-center gap-1.5 text-slate-400 text-xs font-sans">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                              <span>{isKorean ? "당신의 마음을 듣습니다" : "Listening to your heart"} @young_beom_oh</span>
                            </div>
                          </div>

                        </div>
                        
                        {/* PDF 영구 소장 다운로드 버튼 */}
                        <button
                          id="download-pdf-btn"
                          onClick={handleDownloadPDF}
                          className="px-12 py-4 bg-slate-950 text-slate-200 rounded-full font-serif text-base md:text-lg tracking-[0.02em] hover:bg-slate-800 hover:text-white transition duration-200 shadow-2xl flex items-center gap-3 animate-fade-in z-20 active:scale-95 cursor-pointer border border-slate-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {t.pdfPermanentLabel}
                        </button>
                      </div>
                    ) : null}

                {/* [추가] 별점 및 리뷰 남기기 UI (하이엔드 미니멀리즘 디자인) */}
                <div className="w-full bg-white rounded-[32px] p-8 md:p-10 border border-slate-50 shadow-layered text-center animate-fade-in mb-8 no-print z-10">
                  <h4 className="font-serif text-xl md:text-2xl text-slate-800 mb-2 font-semibold">
                    {t.reviewTitle}
                  </h4>
                  <p className="text-slate-400 text-sm mb-6">
                    {t.reviewSubtitle}
                  </p>
                  
                  {!reviewSubmitted ? (
                    <form onSubmit={handleReviewSubmit} className="flex flex-col items-center">
                      <div className="flex gap-2 justify-center mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`text-3xl transition-colors cursor-pointer active:scale-90 duration-150 ${
                              star <= rating ? "text-amber-400" : "text-slate-200"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={5}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="w-full rounded-xl bg-slate-50 border border-slate-100 shadow-inner p-4 text-slate-700 text-sm md:text-base mb-6 focus:ring-2 focus:ring-amber-200 focus:bg-white outline-none placeholder:text-slate-300 resize-none font-serif leading-relaxed"
                        style={{ minHeight: "150px", height: "150px" }}
                        placeholder={t.reviewPlaceholder}
                      />
                      <button
                        type="submit"
                        className="px-8 py-3.5 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors shadow-md active:scale-95 duration-150 cursor-pointer"
                      >
                        {t.reviewSubmit}
                      </button>
                    </form>
                  ) : (
                    <div className="text-amber-600 text-sm font-medium bg-amber-50/50 border border-amber-100 px-6 py-4 rounded-2xl inline-block animate-fade-in">
                      {t.reviewSuccess}
                    </div>
                  )}
                </div>

                <footer className="mt-8 flex flex-col sm:flex-row gap-8 items-center justify-center no-print w-full">
                  <button
                    onClick={resetForm}
                    className="text-slate-400 hover:text-slate-600 flex items-center gap-2 text-sm transition-colors group font-serif cursor-pointer"
                  >
                    <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t.reset}
                  </button>
                </footer>

                {/* 📊 Option C: 실시간 몬테카를로 시뮬레이터 & CTA 대시보드 패널 */}
                <div className="no-print mt-16 w-full max-w-[800px] mx-auto bg-white border border-[#E5D9C9] rounded-3xl p-8 md:p-12 shadow-xl animate-fade-in text-left">
                  <div className="border-b border-[#E5D9C9] pb-6 mb-8 text-center">
                    <h3 className="font-serif text-2xl font-bold text-slate-800">
                      📊 {isKorean ? "실시간 대표님 비즈니스 리스크 모의실험" : "Real-time Business Risk Simulation"}
                    </h3>
                    <p className="font-serif text-xs text-slate-500 mt-2 leading-relaxed">
                      {isKorean 
                        ? "5대 보안/규제 위협 요소를 직접 튜닝하여, 1인 기업이 겪게 될 재무적 예상 손실과 파산 확률을 실시간으로 추적해 보세요." 
                        : "Tune the 5 major security threats to track estimated losses and risk exposure in real-time."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* 왼쪽: 5대 리스크 슬라이더 조작 */}
                    <div className="flex flex-col gap-6 bg-[#FAF6F0] p-6 rounded-3xl border border-[#E5D9C9]/50">
                      <h5 className="font-serif text-xs font-bold text-slate-800 border-b border-[#E5D9C9] pb-2 mb-2 flex items-center gap-1.5">
                        ⚙️ {isKorean ? "위협 요인 가중치 조절" : "Threat Tuning Panel"}
                      </h5>

                      {[
                        { label: isKorean ? "🛡️ PII 개인정보 유출 리스크" : "🛡️ PII Leakage Risk", val: piiRisk, set: setPiiRisk },
                        { label: isKorean ? "📝 불변 감사 로그 부재" : "📝 Lack of Audit Logs", val: auditRisk, set: setAuditRisk },
                        { label: isKorean ? "🔒 사용자 동의 메커니즘 공백" : "🔒 No Consent Mechanism", val: consentRisk, set: setConsentRisk },
                        { label: isKorean ? "🔑 세션 보안 취약성" : "🔑 Session Hijacking", val: sessionRisk, set: setSessionRisk },
                        { label: isKorean ? "🚦 트래픽 폭주 위험" : "🚦 Traffic Throttling", val: trafficRisk, set: setTrafficRisk }
                      ].map((slider, idx) => (
                        <div key={`slider-${idx}`} className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-xs font-serif text-slate-700">
                            <span>{slider.label}</span>
                            <span className="font-bold font-sans text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">{slider.val.toFixed(1)}</span>
                          </div>
                          <input
                            type="range"
                            min="1.0"
                            max="10.0"
                            step="0.5"
                            value={slider.val}
                            onChange={(e) => slider.set(parseFloat(e.target.value))}
                            className="w-full accent-amber-700 cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>

                    {/* 오른쪽: 실시간 몬테카를로 SVG 차트 */}
                    <div className="flex flex-col gap-6">
                      <MonteCarloChart data={simChartData} totalLoss={simLoss} isCritical={simCritical} />

                      {/* 예상 지출 분석 카드 */}
                      <div className="bg-[#FAF6F0] p-6 rounded-3xl border border-[#E5D9C9]/50 flex flex-col gap-2 text-left">
                        <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest">
                          {isKorean ? "예상 리스크 손실 기댓값" : "ESTIMATED TOTAL LOSS"}
                        </span>
                        <span className="font-serif text-3xl font-bold text-slate-800">
                          ${simLoss.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-500">USD</span>
                        </span>
                        <p className="text-[11px] font-serif text-slate-500 leading-relaxed mt-1">
                          {isKorean 
                            ? "• 2,000번의 난수 시뮬레이션을 실시간 수행하여 도출된 평균 손실액입니다." 
                            : "• Real-time average loss generated via 2,000 random simulations."}
                        </p>
                        
                        {simCritical && (
                          <button
                            onClick={() => setShowRemoteRecoveryModal(true)}
                            className="mt-4 px-6 py-3 bg-amber-600 text-white rounded-2xl font-serif text-xs font-bold tracking-wide hover:bg-amber-700 transition shadow-lg active:scale-95 duration-150 cursor-pointer animate-pulse text-center"
                          >
                            {isKorean ? "🚨 실시간 원격 보안 관제 및 세션 복구 가동" : "🚨 Execute Remote Security Session Recovery"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🔒 1:1 상담 예약 신청 모달 (CTA Overlay) */}
                {showCtaModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print animate-fade-in">
                    <div className="relative w-full max-w-md bg-[#FAF6F0] border border-[#E5D9C9] rounded-3xl p-8 shadow-2xl text-left">
                      <button
                        onClick={() => setShowCtaModal(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition text-lg"
                      >
                        &times;
                      </button>

                      {reserveSuccess ? (
                        <div className="text-center py-6 flex flex-col items-center gap-4">
                          <span className="text-4xl">✉️</span>
                          <h4 className="font-serif text-xl font-bold text-slate-800">
                            {isKorean ? "상담 예약이 신청되었습니다." : "Reservation Requested Successfully!"}
                          </h4>
                          <p className="font-serif text-xs text-slate-500 leading-relaxed px-4">
                            {isKorean 
                              ? "대표님, 애쓰고 계신 그 아픈 무게를 조금이라도 나누어 짊어질 수 있도록 오영범 작가(마스터)가 곧 기입해주신 연락처로 묵직한 안부를 전하겠습니다. 조심히 기다려 주십시오."
                              : "The Master will gently reach out to you soon via the contact details provided to share and support your business weights."}
                          </p>
                          <button
                            onClick={() => {
                              setShowCtaModal(false);
                              setReserveSuccess(false);
                            }}
                            className="mt-6 px-10 py-3 bg-slate-900 text-white rounded-2xl font-serif text-xs tracking-wide hover:bg-slate-800 transition shadow-md cursor-pointer active:scale-95"
                          >
                            {isKorean ? "닫기" : "Close"}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="border-b border-[#E5D9C9] pb-4">
                            <h4 className="font-serif text-lg font-bold text-slate-800 flex items-center gap-1.5">
                              <span>🚨</span> {isKorean ? "비즈니스 긴급 구제 안전 상담 신청" : "Emergency Safety Consultation"}
                            </h4>
                            <p className="font-serif text-[10px] text-slate-500 mt-1">
                              {isKorean 
                                ? "예상 리스크 손실액이 임계치를 초과하였습니다. 1인 비즈니스를 지탱하기 위한 마스터 멘토링 예약을 즉시 신청하십시오."
                                : "Your estimated business loss exceeds critical limits. Secure your mentoring session immediately."}
                            </p>
                          </div>

                          <div className="flex flex-col gap-3 font-serif text-xs text-slate-700">
                            <div className="flex flex-col gap-1.5">
                              <label>{isKorean ? "대표님 성함 / 애칭" : "Name"}</label>
                              <input
                                type="text"
                                value={reserveName}
                                onChange={(e) => setReserveName(e.target.value)}
                                placeholder={isKorean ? "오영범" : "John Doe"}
                                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 outline-none font-sans"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label>{isKorean ? "이메일 주소" : "Email"}</label>
                              <input
                                type="email"
                                value={reserveEmail}
                                onChange={(e) => setReserveEmail(e.target.value)}
                                placeholder="master@example.com"
                                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 outline-none font-sans"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label>{isKorean ? "연락처 (안부 수신용)" : "Phone"}</label>
                              <input
                                type="text"
                                value={reservePhone}
                                onChange={(e) => setReservePhone(e.target.value)}
                                placeholder="010-XXXX-XXXX"
                                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 outline-none font-sans"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => setReserveSuccess(true)}
                            disabled={!reserveName || !reserveEmail || !reservePhone}
                            className={`mt-4 px-6 py-4 rounded-2xl font-serif text-xs font-bold tracking-wide transition shadow-xl text-center cursor-pointer ${
                              reserveName && reserveEmail && reservePhone
                                ? "bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            {isKorean ? "🔒 마스터 비즈니스 구제 예약 완료" : "🔒 Complete Safety Mentoring Booking"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 🛡️ 원격 보안 관제 및 세션 복구 콘솔 모달 */}
                {showRemoteRecoveryModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 no-print animate-fade-in">
                    <div className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-left text-slate-100 flex flex-col max-h-[90vh]">
                      <button
                        onClick={() => {
                          if (isRecoveryRunning) {
                            if (!confirm(isKorean ? "현재 복구 세션이 가동 중입니다. 정말 닫으시겠습니까?" : "A recovery session is currently running. Do you really want to close?")) return;
                          }
                          setShowRemoteRecoveryModal(false);
                        }}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer transition text-2xl font-bold"
                      >
                        &times;
                      </button>

                      <div className="border-b border-slate-800 pb-4 mb-6">
                        <h4 className="font-serif text-xl font-bold text-amber-500 flex items-center gap-2">
                          <span>🛡️</span> {isKorean ? "실시간 원격 보안 관제 및 세션 복구 콘솔" : "Remote Security & Session Recovery Console"}
                        </h4>
                        <p className="font-sans text-[11px] text-slate-400 mt-1">
                          {isKorean 
                            ? "5대 보안 취약점에 대한 원격 연결 수립, 권한 승격, 데이터 스트리밍 복구를 E2E로 테스트합니다."
                            : "Establish connection, verify credentials, escalate authority, and stream recovery metrics."}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* 설정 패널 */}
                        <div className="flex flex-col gap-4 bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl text-xs">
                          <h5 className="font-bold text-amber-600 mb-2 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                            ⚙️ {isKorean ? "접속 정보 설정" : "Session Configuration"}
                          </h5>
                          
                          <div className="flex flex-col gap-1">
                            <label className="text-slate-400 font-semibold">{isKorean ? "원격 대상 IP 주소" : "Remote IP Address"}</label>
                            <input
                              type="text"
                              value={recoveryIp}
                              onChange={(e) => setRecoveryIp(e.target.value)}
                              disabled={isRecoveryRunning}
                              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 outline-none text-slate-200 font-mono"
                              placeholder="e.g. 192.168.1.50"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-slate-400 font-semibold">{isKorean ? "포트 번호 (SSH 등)" : "Port"}</label>
                            <input
                              type="text"
                              value={recoveryPort}
                              onChange={(e) => setRecoveryPort(e.target.value)}
                              disabled={isRecoveryRunning}
                              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 outline-none text-slate-200 font-mono"
                              placeholder="e.g. 22"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-slate-400 font-semibold">{isKorean ? "접근 권한 역할 (Token Role)" : "Role Level"}</label>
                            <select
                              value={recoveryRole}
                              onChange={(e) => setRecoveryRole(e.target.value)}
                              disabled={isRecoveryRunning}
                              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 outline-none text-slate-200 cursor-pointer"
                            >
                              <option value="admin">Admin (관리자)</option>
                              <option value="standard">Standard (일반 사용자)</option>
                              <option value="guest">Guest (비인증 게스트)</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-slate-400 font-semibold">{isKorean ? "수행할 복구 명령어" : "Recovery Command"}</label>
                            <select
                              value={recoveryCommand}
                              onChange={(e) => setRecoveryCommand(e.target.value)}
                              disabled={isRecoveryRunning}
                              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 outline-none text-slate-200 cursor-pointer"
                            >
                              <option value="ls -l /var/log">{isKorean ? "안전한 명령어 (ls -l /var/log)" : "Safe Command"}</option>
                              <option value="systemctl restart sshd">{isKorean ? "시스템 중요 명령어 (systemctl restart sshd)" : "Critical Command"}</option>
                              <option value="FAIL_CMD">{isKorean ? "실패 시뮬레이션 (FAIL_CMD)" : "Failure Simulation"}</option>
                              <option value="custom">{isKorean ? "직접 입력..." : "Custom..."}</option>
                            </select>
                          </div>

                          {recoveryCommand === "custom" && (
                            <div className="flex flex-col gap-1 animate-fade-in">
                              <label className="text-slate-400 font-semibold">{isKorean ? "커스텀 명령어 입력" : "Enter Custom Command"}</label>
                              <input
                                type="text"
                                value={customCommand}
                                onChange={(e) => setCustomCommand(e.target.value)}
                                disabled={isRecoveryRunning}
                                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 outline-none text-slate-200 font-mono"
                                placeholder="e.g. whoami"
                              />
                            </div>
                          )}
                        </div>

                        {/* 시각화 및 LED 램프 */}
                        <div className="flex flex-col gap-4 bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl text-xs">
                          <h5 className="font-bold text-amber-600 mb-2 border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                            📊 {isKorean ? "복구 진행 상태관제" : "Recovery Stage LEDs"}
                          </h5>

                          <div className="flex flex-col gap-3.5 mt-2">
                            {/* LED 1 */}
                            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-900">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-200">1. Credential Integrity Check</span>
                                <span className="text-[10px] text-slate-500">{isKorean ? "인증 토큰 무결성 및 IP 범위 검증" : "Token validation & IP check"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`h-3 w-3 rounded-full ${
                                  stepStates.credential === "idle" ? "bg-slate-700" :
                                  stepStates.credential === "checking" ? "bg-amber-500 animate-ping" :
                                  stepStates.credential === "success" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                                }`} />
                                <span className="text-[10px] text-slate-400 uppercase font-mono w-14 text-right">
                                  {stepStates.credential}
                                </span>
                              </div>
                            </div>

                            {/* LED 2 */}
                            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-900">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-200">2. Authority Escalation Check</span>
                                <span className="text-[10px] text-slate-500">{isKorean ? "수행 명령어 역할 기반 권한 제어" : "RBAC command check"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`h-3 w-3 rounded-full ${
                                  stepStates.escalation === "idle" ? "bg-slate-700" :
                                  stepStates.escalation === "checking" ? "bg-amber-500 animate-ping" :
                                  stepStates.escalation === "success" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                                }`} />
                                <span className="text-[10px] text-slate-400 uppercase font-mono w-14 text-right">
                                  {stepStates.escalation}
                                </span>
                              </div>
                            </div>

                            {/* LED 3 */}
                            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-900">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-200">3. Metrics Re-Synchronization</span>
                                <span className="text-[10px] text-slate-500">{isKorean ? "세션 연결 후 메트릭 로그 스트리밍 수신" : "Connect & stream logs"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`h-3 w-3 rounded-full ${
                                  stepStates.sync === "idle" ? "bg-slate-700" :
                                  stepStates.sync === "checking" ? "bg-amber-500 animate-ping" :
                                  stepStates.sync === "success" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                                }`} />
                                <span className="text-[10px] text-slate-400 uppercase font-mono w-14 text-right">
                                  {stepStates.sync}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 터미널 로그 창 */}
                      <div className="flex-grow flex flex-col min-h-[160px] bg-slate-950 border border-slate-900 rounded-2xl p-4 overflow-y-auto font-mono text-[11px] leading-relaxed text-emerald-400/90 shadow-inner">
                        <div className="text-slate-500 border-b border-slate-900 pb-1 mb-2 flex justify-between select-none">
                          <span>SYSTEM LOG CONSOLE V1.0.0</span>
                          <span className={isRecoveryRunning ? "animate-pulse text-amber-500" : "text-slate-600"}>
                            {isRecoveryRunning ? "● ACTIVE_SESSION" : "● DISCONNECTED"}
                          </span>
                        </div>
                        <div className="flex-grow overflow-y-auto max-h-[180px]">
                          {recoveryLogs.length === 0 ? (
                            <span className="text-slate-600">{isKorean ? "콘솔이 대기 중입니다. '복구 세션 가동'을 눌러 테스트를 수행하세요." : "Console is idle. Press Start Session to test."}</span>
                          ) : (
                            recoveryLogs.map((log, index) => (
                              <div key={index} className={log.includes("❌") || log.includes("🚨") ? "text-rose-400 animate-fade-in" : log.includes("🟢") || log.includes("🎉") ? "text-emerald-400 animate-fade-in" : "text-slate-300 animate-fade-in"}>
                                {log}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* 버튼 제어 */}
                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => {
                            setShowRemoteRecoveryModal(false);
                          }}
                          className="px-5 py-3.5 border border-slate-800 text-slate-400 rounded-xl text-xs font-semibold hover:text-slate-200 hover:bg-slate-900 cursor-pointer transition active:scale-95 duration-100"
                        >
                          {isKorean ? "닫기" : "Close"}
                        </button>
                        <button
                          onClick={handleStartRecovery}
                          disabled={isRecoveryRunning || (recoveryCommand === "custom" && !customCommand)}
                          className={`flex-grow px-6 py-3.5 rounded-xl text-xs font-bold tracking-wide shadow-lg text-center cursor-pointer transition active:scale-95 duration-150 ${
                            isRecoveryRunning || (recoveryCommand === "custom" && !customCommand)
                              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                              : "bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                          }`}
                        >
                          {isRecoveryRunning ? (isKorean ? "⚡ 실시간 원격 보안 관제 가동 중..." : "⚡ Session Recovery Active...") : (isKorean ? "🔒 원격 보안 세션 복구 가동" : "🔒 Start Remote Security Recovery")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                  </div>
                )}
              </div>
            )}

          </main>
        </div>

        {/* Footer (Only on Input Form page) */}
        {view === "input" && (
          <footer className="w-full border-t border-amber-50/50 py-12 px-6 mt-auto no-print text-center">
            <p className="font-serif font-bold text-slate-800 text-lg mb-2">{t.footerBrand}</p>
            <p className="text-[10px] text-slate-400 tracking-[0.5em] uppercase">
              &copy; 2026 Master O.Y.B ALL RIGHTS RESERVED.
            </p>
          </footer>
        )}

        {/* ☕ 일일 무료 편지 한도 초과 안내 모달 */}
        {showLimitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print animate-fade-in text-slate-800">
            <div className="relative w-full max-w-md bg-[#FAF6F0] border border-[#E5D9C9] rounded-3xl p-8 shadow-2xl text-left">
              <button
                onClick={() => setShowLimitModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition text-lg"
              >
                &times;
              </button>

              <div className="text-center py-4 flex flex-col items-center gap-4">
                <span className="text-4xl">☕</span>
                <h4 className="font-serif text-xl font-bold text-slate-800">
                  {isKorean ? "이미 오늘의 안부 편지를 받으셨어요" : "You've already received today's comforting letter"}
                </h4>
                <p className="font-serif text-xs text-slate-500 leading-relaxed px-4">
                  {isKorean 
                    ? "하루에 한 번만 안부를 무료로 여쭤볼 수 있습니다. 만약 지금 당장 마음을 조금 더 털어놓고 싶은가요? 커피 반 잔 값의 작은 온기를 나누고, 이야기를 한 번 더 나눠보세요."
                    : "You can receive one daily comforting letter for free. Do you want to share a small warmth of coffee price ($0.79 USD) and talk once more right now?"}
                </p>
                <div className="mt-6 flex flex-col w-full gap-3">
                  <button
                    onClick={() => {
                      setShowLimitModal(false);
                      setPayStep("login");
                      setShowPaymentModal(true);
                    }}
                    className="w-full px-6 py-3.5 bg-amber-500 text-slate-950 rounded-2xl font-serif text-xs font-bold tracking-wide hover:bg-amber-400 transition shadow-md cursor-pointer active:scale-95 text-center flex items-center justify-center gap-2"
                  >
                    <span>💛</span> {isKorean ? "PayPal로 온기 나누기 ($0.79)" : "Share Warmth via PayPal ($0.79)"}
                  </button>
                  <button
                    onClick={() => setShowLimitModal(false)}
                    className="w-full px-6 py-3.5 bg-slate-200 text-slate-700 rounded-2xl font-serif text-xs hover:bg-slate-300 transition cursor-pointer active:scale-95 text-center"
                  >
                    {isKorean ? "나중에 오기" : "Maybe Later"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 💛 PayPal 모의 결제 모달 (PayPal Simulator) */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 no-print animate-fade-in text-slate-800">
            <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl text-left flex flex-col">
              {/* PayPal Header */}
              <div className="bg-[#003087] p-5 flex items-center justify-between text-white select-none">
                <span className="font-serif italic font-extrabold text-xl tracking-tight text-amber-400">PayPal</span>
                <span className="text-xs text-slate-300">$0.79 USD</span>
              </div>

              <div className="p-8 flex flex-col gap-6">
                {payStep === "login" && (
                  <div className="flex flex-col gap-4 font-sans">
                    <div className="text-center mb-2">
                      <h4 className="text-lg font-bold text-slate-800">
                        {isKorean ? "PayPal로 결제하기" : "Pay with PayPal"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Asking the Heart - {isKorean ? "추가 안부 편지 대금" : "Additional Comfort Letter"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 text-xs text-slate-700">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-slate-600">{isKorean ? "이메일 주소" : "Email Address"}</label>
                        <input
                          type="email"
                          value={payEmail}
                          onChange={(e) => setPayEmail(e.target.value)}
                          placeholder="example@email.com"
                          className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-[#0070ba]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-semibold text-slate-600">{isKorean ? "비밀번호" : "Password"}</label>
                        <input
                          type="password"
                          value={payPassword}
                          onChange={(e) => setPayPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-[#0070ba]"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!payEmail.includes("@")) {
                          alert(isKorean ? "올바른 이메일 형식을 입력하세요." : "Please enter a valid email.");
                          return;
                        }
                        setPayStep("pay");
                      }}
                      className="mt-2 w-full py-3 bg-[#0070ba] hover:bg-[#005ea6] text-white rounded-2xl text-xs font-bold transition cursor-pointer active:scale-95 text-center"
                    >
                      {isKorean ? "로그인" : "Log In"}
                    </button>

                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="text-center text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                    >
                      {isKorean ? "결제 취소하고 돌아가기" : "Cancel and return to Asking the Heart"}
                    </button>
                  </div>
                )}

                {payStep === "pay" && (
                  <div className="flex flex-col gap-4 font-sans">
                    <div className="text-center mb-2">
                      <h4 className="text-lg font-bold text-slate-800">{isKorean ? "결제 정보 확인" : "Review Payment"}</h4>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>{isKorean ? "수신처" : "Merchant"}</span>
                        <span className="font-bold text-slate-800">Asking the Heart</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{isKorean ? "결제 수단" : "Payment Method"}</span>
                        <span className="font-bold text-slate-800">PayPal Balance (Visa •••• 9876)</span>
                      </div>
                      <div className="border-t border-slate-200 my-1"></div>
                      <div className="flex justify-between text-slate-800 font-bold">
                        <span>{isKorean ? "총 결제 금액" : "Total Amount"}</span>
                        <span className="text-[#0070ba]">$0.79 USD</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setPayStep("processing");
                        setTimeout(async () => {
                          setShowPaymentModal(false);
                          // generateLetter("extra") 실행
                          await generateLetter("extra");
                        }, 1500);
                      }}
                      className="mt-2 w-full py-3 bg-[#0070ba] hover:bg-[#005ea6] text-white rounded-2xl text-xs font-bold transition cursor-pointer active:scale-95 text-center"
                    >
                      {isKorean ? "지금 결제하기 ($0.79)" : "Pay Now ($0.79)"}
                    </button>

                    <button
                      onClick={() => setPayStep("login")}
                      className="text-center text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                    >
                      {isKorean ? "뒤로 가기" : "Go Back"}
                    </button>
                  </div>
                )}

                {payStep === "processing" && (
                  <div className="py-8 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="w-10 h-10 border-4 border-[#0070ba] border-t-transparent rounded-full animate-spin"></div>
                    <h4 className="text-sm font-bold text-slate-700">
                      {isKorean ? "PayPal 결제를 안전하게 처리하고 있습니다..." : "Processing your PayPal payment securely..."}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {isKorean ? "잠시만 기다려 주십시오. 창을 닫지 마세요." : "Please wait. Do not close this window."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
  );
}
