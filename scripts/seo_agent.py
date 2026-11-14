import json
import re
import os

def load_env_local():
    for path in ['.env.local', '../.env.local', '../../.env.local', os.path.join(os.path.dirname(__file__), '../.env.local')]:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, val = line.split('=', 1)
                        key = key.strip()
                        val = val.strip().strip('"').strip("'")
                        os.environ[key] = val
            break

load_env_local()

from openai import OpenAI

# 백엔드 스케줄러(Cron) 환경에서 주기적으로 실행될 SEO 에이전트 봇
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", "YOUR_API_KEY_HERE"))

def auto_update_seo():
    print("🔍 [SEO Agent] 리뷰 데이터 분석을 시작합니다...")
    
    try:
        # 실제 서버에서는 DB나 reviews.json 경로를 동적으로 읽어옵니다.
        with open('reviews.json', 'r', encoding='utf-8') as f:
            reviews = json.load(f)
        review_texts = "\n".join([r['text'] for r in reviews[-50:]])
    except Exception as e:
        print("리뷰 데이터 로드 실패 (초기화 상태):", e)
        return

    prompt = f"다음은 심리 처방 서비스 유저들의 리뷰입니다. 이들이 가장 많이 겪는 고통 키워드 3가지를 쉼표로 구분해 콤마로만 대답해줘.\n\n{review_texts}"
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )
    keywords = response.choices[0].message.content.strip()
    print(f"🎯 [SEO Agent] 이번 주 핵심 키워드 발견: {keywords}")

    # Next.js 프론트엔드 layout.tsx 자동 업데이트
    possible_paths = [
        "src/app/layout.tsx",
        "../src/app/layout.tsx",
        os.path.join(os.path.dirname(__file__), "../src/app/layout.tsx")
    ]
    layout_path = None
    for p in possible_paths:
        if os.path.exists(p):
            layout_path = p
            break

    if layout_path:
        with open(layout_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        new_description = f"현대인을 위한 AI 심리 처방전. {keywords} 등 당신의 아픈 마음을 위로하는 아날로그 편지."
        updated_content = re.sub(
            r'description:\s*".*?"',
            f'description: "{new_description}"',
            content
        )
        
        with open(layout_path, 'w', encoding='utf-8') as file:
            file.write(updated_content)
        print("✅ [SEO Agent] Next.js SEO 태그 업데이트 및 최적화 완료!")
    else:
        print("경로에 layout.tsx가 없어 업데이트를 스킵합니다.")

if __name__ == "__main__":
    auto_update_seo()
