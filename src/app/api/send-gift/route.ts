import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

// Helper to get paths inside backend directory (or /tmp/backend on Vercel serverless)
const getQueuePaths = () => {
  const baseDir = process.env.VERCEL ? path.join('/tmp', 'backend') : path.join(process.cwd(), '..', 'backend');
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return {
    queuePath: path.join(baseDir, 'gift_queue.json'),
    historyPath: path.join(baseDir, 'gift_history.json')
  };
};

const getHTMLTemplate = (recipientName: string, senderName: string, letterData: any) => {
  const title = letterData?.cover?.title || "당신을 위한 문장 처방전";
  const heartName = letterData?.cover?.heart_name || "소중한 마음에게";
  const paragraphs = letterData?.page_letter_paragraphs || [letterData?.letter || ""];
  const sentences = letterData?.page_sentences || [];
  const questions = letterData?.page_questions || [];
  const action = letterData?.page_action || letterData?.action || "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          background-color: #f8fafc;
          font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
          color: #334155;
          margin: 0;
          padding: 40px 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #fdfbf7;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
          border: 1px solid #f1f5f9;
        }
        .header {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 40px 30px;
          text-align: center;
          color: #fdfbf7;
        }
        .header h1 {
          font-size: 24px;
          font-weight: 500;
          margin: 0 0 10px 0;
          letter-spacing: 2px;
          color: #fbbf24;
        }
        .header p {
          font-size: 14px;
          margin: 0;
          opacity: 0.8;
          line-height: 1.6;
        }
        .card {
          padding: 40px 30px;
          position: relative;
        }
        .letter-body {
          background-image: 
            linear-gradient(rgba(200, 0, 0, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200, 0, 0, 0.02) 1px, transparent 1px);
          background-size: 20px 20px;
          border: 1px solid rgba(220, 38, 38, 0.05);
          border-radius: 16px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: inset 0 0 20px rgba(253, 251, 247, 1);
        }
        .heart-title {
          text-align: center;
          font-size: 20px;
          color: #1e293b;
          margin-top: 0;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .heart-subtitle {
          text-align: center;
          font-size: 14px;
          color: #d97706;
          margin-bottom: 30px;
          font-style: italic;
        }
        .letter-text {
          font-size: 16px;
          line-height: 2.0;
          color: #334155;
          white-space: pre-wrap;
          margin-bottom: 20px;
        }
        .letter-text p {
          margin: 0 0 16px 0;
        }
        .section-title {
          font-size: 16px;
          color: #0f172a;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
          margin-top: 30px;
          margin-bottom: 15px;
          font-weight: 600;
        }
        .sentence-item {
          font-size: 15px;
          line-height: 1.8;
          color: #475569;
          margin-bottom: 12px;
          padding-left: 15px;
          border-left: 2px solid #fbbf24;
          font-style: italic;
        }
        .question-item {
          font-size: 15px;
          line-height: 1.8;
          color: #475569;
          margin-bottom: 12px;
        }
        .action-box {
          background-color: #fef3c7;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #fde68a;
          margin-top: 30px;
        }
        .action-title {
          font-size: 15px;
          font-weight: 600;
          color: #b45309;
          margin-top: 0;
          margin-bottom: 6px;
        }
        .action-desc {
          font-size: 14px;
          color: #78350f;
          margin: 0;
          line-height: 1.6;
        }
        .footer {
          text-align: center;
          padding: 30px;
          background-color: #f1f5f9;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
          color: #64748b;
        }
        .footer a {
          color: #475569;
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💌 마음을 묻다</h1>
          <p><strong>${senderName}</strong>님께서 <strong>${recipientName}</strong>님에게 보낸<br>마스터 오영범의 문장 처방전이 도착했습니다.</p>
        </div>
        <div class="card">
          <div class="letter-body">
            <h2 class="heart-title">${title}</h2>
            <p class="heart-subtitle">“ ${heartName} ”</p>
            
            <div class="letter-text">
              ${paragraphs.map((p: string) => `<p>${p}</p>`).join("")}
            </div>
            
            ${sentences.length > 0 ? `
              <div class="section-title">✨ 오래 간직할 문장</div>
              ${sentences.map((s: string) => `<div class="sentence-item">“ ${s} ”</div>`).join("")}
            ` : ""}
            
            ${questions.length > 0 ? `
              <div class="section-title">❓ 나에게 묻는 질문</div>
              ${questions.map((q: string) => `<div class="question-item"><strong>Q.</strong> ${q}</div>`).join("")}
            ` : ""}
            
            ${action ? `
              <div class="action-box">
                <div class="action-title">🌱 오늘의 작은 행동</div>
                <p class="action-desc">${action}</p>
              </div>
            ` : ""}
          </div>
        </div>
        <div class="footer">
          본 이메일은 '마음을 묻다' 선물 패키지를 통해 발송되었습니다.<br>
          당신의 마음을 다독이는 시간, <a href="https://askyourheart.co.kr">마음을 묻다</a>
        </div>
      </div>
    </body>
    </html>
  `;
};

// 📥 POST: 선물 엽서를 즉시 발송하지 않고, 일일 큐(Queue) 파일에 모아 적재 (한꺼번에 전송 준비)
export async function POST(req: Request) {
  try {
    const { recipientName, recipientEmail, senderName, letterData } = await req.json();

    if (!recipientEmail || !recipientName) {
      return NextResponse.json({ error: "Recipient name and email are required." }, { status: 400 });
    }

    const { queuePath } = getQueuePaths();
    
    // Read current queue
    let queue: any[] = [];
    if (fs.existsSync(queuePath)) {
      try {
        queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
      } catch {
        queue = [];
      }
    }

    // Add to queue
    const queueEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      recipientName,
      recipientEmail,
      senderName,
      letterData
    };
    queue.push(queueEntry);

    // Save back to queue
    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2), 'utf8');
    
    console.log(`[Gift Queue] Added new gift from ${senderName} to ${recipientName} (${recipientEmail}). Total in queue: ${queue.length}`);

    return NextResponse.json({ 
      success: true, 
      mode: "Queued", 
      message: "선물 엽서 예약이 성공적으로 완료되었습니다. 오늘 밤 한꺼번에 발송됩니다.",
      queuedCount: queue.length 
    });

  } catch (error: any) {
    console.error("Gifting queue error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 📤 GET: 그날 쌓인 모든 선물 예약 엽서들을 일괄 한꺼번에 전송 (Batch Sender Trigger)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const viewOnly = searchParams.get("view") === "true";
    
    // 🛡️ Security Check: Validate ADMIN_SECRET_KEY to prevent unauthorized triggers or queue purging
    const authHeader = req.headers.get("authorization");
    let clientKey = searchParams.get("secret");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      clientKey = authHeader.substring(7);
    }

    const adminSecretKey = process.env.ADMIN_SECRET_KEY || "dev-secret-key-1234";

    if (!clientKey || clientKey !== adminSecretKey) {
      console.warn(`[Security Warning] Unauthorized attempt to trigger send-gift batch dispatcher.`);
      return NextResponse.json(
        { error: "Unauthorized. Valid admin secret key is required." },
        { status: 401 }
      );
    }

    const { queuePath, historyPath } = getQueuePaths();

    // Read queue with fallback lock parsing
    let queue: any[] = [];
    if (fs.existsSync(queuePath)) {
      try {
        queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
      } catch (e) {
        console.error("Failed to parse queue file. Queue might be corrupted or locked:", e);
        queue = [];
      }
    }

    // Read history with fallback lock parsing
    let history: any[] = [];
    if (fs.existsSync(historyPath)) {
      try {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      } catch (e) {
        console.error("Failed to parse history file:", e);
        history = [];
      }
    }

    if (viewOnly) {
      return NextResponse.json({
        success: true,
        queue,
        history
      });
    }

    if (queue.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "보낼 선물 예약 내역이 없습니다." });
    }

    const smtpHost = process.env.SMTP_HOST || "";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtpUser = process.env.SMTP_USER || "";
    const smtpPass = process.env.SMTP_PASS || "";
    const hasSmtpConfig = smtpHost !== "" && smtpUser !== "" && smtpPass !== "";

    let successCount = 0;
    const historyEntries: any[] = [];

    console.log(`[Batch Gift Dispatch] Starting batch dispatch for ${queue.length} letters...`);

    // Setup transporter if credentials exist
    let transporter: any = null;
    if (hasSmtpConfig) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    for (const item of queue) {
      const { recipientName, recipientEmail, senderName, letterData, id, timestamp } = item;
      const htmlContent = getHTMLTemplate(recipientName, senderName, letterData);

      try {
        if (hasSmtpConfig && transporter) {
          await transporter.sendMail({
            from: `"마음을 묻다 (Ask Your Heart)" <${smtpUser}>`,
            to: recipientEmail,
            subject: `[마음을 묻다] ${senderName}님이 보내신 따뜻한 위로 편지 선물이 도착했습니다.`,
            html: htmlContent,
          });
          console.log(`[Batch Gift Dispatch] Sent email successfully to ${recipientEmail} via SMTP`);
        } else {
          // Mock Simulation Log
          console.log(`
============================================================
📬 [BATCH SANDBOX MOCK EMAIL DISPATCH] (Simulating...)
============================================================
• Gift ID: ${id}
• Sender: ${senderName}
• Recipient Name: ${recipientName}
• Recipient Email: ${recipientEmail}
• Subject: [마음을 묻다] ${senderName}님이 보내신 따뜻한 위로 편지 선물이 도착했습니다.
============================================================
          `);
        }

        successCount++;
        historyEntries.push({
          ...item,
          sentAt: new Date().toISOString(),
          status: "SUCCESS"
        });

      } catch (err: any) {
        console.error(`[Batch Gift Dispatch] Failed to send email to ${recipientEmail}:`, err);
        historyEntries.push({
          ...item,
          sentAt: new Date().toISOString(),
          status: "FAILED",
          error: err.message
        });
      }
    }

    // Safe Append to History (Write to temp file then atomic rename if possible, fallback to overwrite)
    try {
      if (fs.existsSync(historyPath)) {
        try {
          history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        } catch {
          history = [];
        }
      }
      history.push(...historyEntries);
      const tempHistoryPath = `${historyPath}.tmp`;
      fs.writeFileSync(tempHistoryPath, JSON.stringify(history, null, 2), 'utf8');
      fs.renameSync(tempHistoryPath, historyPath);
    } catch (writeErr) {
      console.error("Failed secure history logging, falling back to direct write:", writeErr);
      fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');
    }

    // Safe Clear Queue
    try {
      const tempQueuePath = `${queuePath}.tmp`;
      fs.writeFileSync(tempQueuePath, JSON.stringify([], null, 2), 'utf8');
      fs.renameSync(tempQueuePath, queuePath);
    } catch (writeErr) {
      console.error("Failed secure queue clearing, falling back to direct write:", writeErr);
      fs.writeFileSync(queuePath, JSON.stringify([], null, 2), 'utf8');
    }

    console.log(`[Batch Gift Dispatch] Completed batch run. Successfully sent: ${successCount}/${queue.length}`);

    return NextResponse.json({
      success: true,
      count: successCount,
      total: queue.length,
      mode: hasSmtpConfig ? "SMTP Batch" : "Sandbox Batch Simulation"
    });

  } catch (error: any) {
    console.error("Batch dispatch error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
