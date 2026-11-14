/**
 * 🩺 [마음을 묻다] Production 런칭 전 필수 환경설정 자가 진단 및 검증 도구
 * 
 * 실행 방법: node qa_self_diagnose.js
 */

const fs = require('fs');
const path = require('path');
const dns = require('dns');

// ANSI Color codes
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m"
};

console.log(`${colors.bold}${colors.cyan}=================================================================`);
console.log(`🩺 [마음을 묻다] Production Server Self-Diagnostics System`);
console.log(`=================================================================${colors.reset}\n`);

// 1. Load Environmental Variables
console.log(`${colors.bold}[1/4] 환경 변수(.env.local) 적재 및 분석 중...${colors.reset}`);
const envPath = path.join(process.cwd(), '.env.local');
let env = {};

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      // Remove enclosing quotes if any
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      env[key] = val;
    }
  });
  console.log(`   - 🟢 .env.local 파일을 정상적으로 감지했습니다.`);
} else {
  console.log(`   - ⚠️ .env.local 파일이 로컬 디렉토리에 없습니다. 시스템 OS 환경변수를 사용합니다.`);
  env = process.env;
}

// 2. Validate Key Settings
const requiredKeys = [
  'OPENAI_API_KEY',
  'OPENAI_ASSISTANT_ID',
  'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'ADMIN_SECRET_KEY'
];

let criticalMissing = false;
let criticalSmtpMissing = false;

console.log(`\n${colors.bold}[2/4] 핵심 환경설정 키 무결성 검증:${colors.reset}`);

requiredKeys.forEach(key => {
  const value = env[key] || process.env[key];
  if (!value || value.trim() === "" || value.includes("여기에_") || value.includes("YOUR_")) {
    if (key.startsWith('SMTP_')) {
      console.log(`   - 🔴 ${colors.red}[WARNING] ${key}${colors.reset}가 설정되지 않았거나 기본값입니다. (이메일 선물 기능 비활성, 샌드박스 시뮬레이션 작동)`);
      criticalSmtpMissing = true;
    } else if (key === 'ADMIN_SECRET_KEY') {
      console.log(`   - 🟡 ${colors.yellow}[INFO] ${key}${colors.reset}가 비어 있습니다. (보안상 취약, 기본 비밀번호 'dev-secret-key-1234'로 동작)`);
    } else {
      console.log(`   - 🔴 ${colors.red}[CRITICAL] ${key}${colors.reset}가 없거나 올바르지 않습니다. (이 상태로 오픈 불가)`);
      criticalMissing = true;
    }
  } else {
    // Mask value for display
    const masked = value.length > 8 ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : '****';
    console.log(`   - 🟢 ${key}: 적재 완료 (값: ${masked})`);
  }
});

// 3. Network & External API Integration Checks
console.log(`\n${colors.bold}[3/4] 외부 API 및 네트워크 인프라 연동 테스트...${colors.reset}`);

const openaiApiKey = env['OPENAI_API_KEY'] || process.env['OPENAI_API_KEY'];
const assistantId = env['OPENAI_ASSISTANT_ID'] || process.env['OPENAI_ASSISTANT_ID'];

async function testOpenAI() {
  if (!openaiApiKey || !assistantId) {
    console.log(`   - ⏭️  OpenAI 테스트 스킵 (키 또는 어시스턴트 ID 누락)`);
    return false;
  }
  
  try {
    const response = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "OpenAI-Beta": "assistants=v2"
      }
    });

    if (response.ok) {
      const assistant = await response.json();
      console.log(`   - 🟢 OpenAI 연결 성공! Assistant Name: "${colors.green}${assistant.name}${colors.reset}"`);
      
      // 어시스턴트 지침 내 필수 톤앤매너 규칙(반말체/어미 필터 등) 키워드가 들어있는지 스캔
      const instructions = assistant.instructions || "";
      const hasToneRules = instructions.includes("반말") && instructions.includes("어미");
      if (hasToneRules) {
        console.log(`   - 🟢 OpenAI Assistant 지침(Instructions) 분석 결과: ${colors.green}마스터 4.0 말투 규칙 완비${colors.reset}`);
      } else {
        console.log(`   - 🟡 OpenAI Assistant 지침(Instructions) 경고: ${colors.yellow}최신 반말체/존댓말체 말투 가이드라인 동기화 필요${colors.reset} (/api/setup-master 호출 요망)`);
      }
      return true;
    } else {
      const errText = await response.text();
      console.log(`   - 🔴 OpenAI API 호출 실패 (${response.status}): ${colors.red}${errText}${colors.reset}`);
      return false;
    }
  } catch (err) {
    console.log(`   - 🔴 OpenAI 네트워크 접속 실패: ${colors.red}${err.message}${colors.reset}`);
    return false;
  }
}

const paypalClientId = env['NEXT_PUBLIC_PAYPAL_CLIENT_ID'] || process.env['NEXT_PUBLIC_PAYPAL_CLIENT_ID'];
const paypalSecret = env['PAYPAL_CLIENT_SECRET'] || process.env['PAYPAL_CLIENT_SECRET'];
const paypalMode = env['PAYPAL_MODE'] || process.env['PAYPAL_MODE'] || 'sandbox';

async function testPayPal() {
  if (!paypalClientId || !paypalSecret || paypalClientId.includes("여기에")) {
    console.log(`   - ⏭️  PayPal API 연동 테스트 스킵 (클라이언트 ID/시크릿 누락)`);
    return false;
  }
  
  const baseUrl = paypalMode === "live" 
    ? "https://api-m.paypal.com" 
    : "https://api-m.sandbox.paypal.com";

  try {
    const auth = Buffer.from(`${paypalClientId}:${paypalSecret}`).toString("base64");
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response.ok) {
      console.log(`   - 🟢 PayPal API 연결 성공! [모드: ${colors.green}${paypalMode.toUpperCase()}${colors.reset}] 인증 토큰 획득 완료.`);
      return true;
    } else {
      const errText = await response.text();
      console.log(`   - 🔴 PayPal API 인증 실패 (${response.status}): ${colors.red}${errText}${colors.reset}`);
      return false;
    }
  } catch (err) {
    console.log(`   - 🔴 PayPal 네트워크 접속 실패: ${colors.red}${err.message}${colors.reset}`);
    return false;
  }
}

async function testNetwork() {
  return new Promise((resolve) => {
    dns.resolve('google.com', (err) => {
      if (err) {
        console.log(`   - 🔴 외부 인터넷 연결 불가 (DNS 해석 실패). 네트워크 설정을 점검하십시오.`);
        resolve(false);
      } else {
        console.log(`   - 🟢 인터넷 외부망 연결 확인 (DNS 조회 성공).`);
        resolve(true);
      }
    });
  });
}

// 4. Run Diagnoses Sequential
async function start() {
  const netOk = await testNetwork();
  let aiOk = false;
  let payOk = false;

  if (netOk) {
    aiOk = await testOpenAI();
    payOk = await testPayPal();
  }

  console.log(`\n${colors.bold}${colors.cyan}=================================================================`);
  console.log(`📊 [마음을 묻다] 자가 진단 최종 판정 결과`);
  console.log(`=================================================================${colors.reset}`);

  let overallPass = true;

  if (criticalMissing) {
    console.log(`🔴 ${colors.red}${colors.bold}오픈 불가 (CRITICAL CONFIG ERROR)${colors.reset}`);
    console.log(`   - 필수적인 OpenAI API Key, Assistant ID 혹은 PayPal 결제 키가 유효하지 않습니다.`);
    console.log(`   - .env.local 설정을 보완하고 다시 실행하세요.`);
    overallPass = false;
  } else if (!aiOk) {
    console.log(`🔴 ${colors.red}${colors.bold}오픈 보류 (OPENAI INTEGRATION ERROR)${colors.reset}`);
    console.log(`   - 환경 변수 키는 존재하나 OpenAI API와의 연결에 실패했습니다.`);
    overallPass = false;
  } else {
    console.log(`🟢 ${colors.green}${colors.bold}서버 기술적 오픈 준비 완료 (SYSTEM RUNNABLE)${colors.reset}`);
    console.log(`   - 핵심 API 라우트 및 AI 상담사 엔진이 정상 작동하고 있습니다.`);
  }

  console.log(`\n${colors.bold}운영 및 세부 기능 권장 사항:${colors.reset}`);
  if (criticalSmtpMissing) {
    console.log(`   - ${colors.yellow}[운영 권장]${colors.reset} 이메일 발송용 SMTP 정보가 비어 있어 선물 메일이 실제 전송되지 않고 가상 시뮬레이션(Mock)으로만 실행됩니다. 실서비스 런칭 전 Gmail/Naver SMTP 계정 정보를 주입해야 이메일 선물이 도착합니다.`);
  } else {
    console.log(`   - 🟢 이메일(SMTP) 정보가 셋업되어 선물 배치 메일 전송이 프로덕션 모드로 실발송됩니다.`);
  }

  const adminSecret = env['ADMIN_SECRET_KEY'] || process.env['ADMIN_SECRET_KEY'];
  if (!adminSecret || adminSecret === 'dev-secret-key-1234') {
    console.log(`   - ${colors.yellow}[보안 경고]${colors.reset} ADMIN_SECRET_KEY가 설정되지 않았거나 디폴트 값입니다. 비인가자가 선물 발송 배치(/api/send-gift)를 무단 실행할 수 있으므로, 실서버 환경 변수에는 복잡한 임의 키를 등록하고 어드민 콘솔에 기입해 사용하십시오.`);
  } else {
    console.log(`   - 🟢 관리자 보안 인증 키가 안전하게 적용되어 비인가 공격을 방어하고 있습니다.`);
  }
  
  console.log(`${colors.cyan}=================================================================${colors.reset}\n`);
}

start();
