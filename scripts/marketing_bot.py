import json
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

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", "YOUR_API_KEY_HERE"))

def generate_instagram_post():
    try:
        if not os.path.exists('reviews.json'):
            print("리뷰 파일이 아직 없습니다.")
            return

        with open('reviews.json', 'r', encoding='utf-8') as f:
            reviews = json.load(f)
        
        best_reviews = [r['content'] for r in reviews if r.get('rating') == 5]
        if not best_reviews:
            print("오늘의 5점 리뷰가 부족합니다.")
            return
        
        prompt = f"다음은 우리 위로 엽서 서비스의 5점 만점 고객 리뷰들입니다:\n{best_reviews[:3]}\n\n이 리뷰들의 감동적인 내용을 인용해서, 인스타그램 홍보 피드 글을 감성적인 문체로 1개 작성해주세요. 해시태그 #마음을묻다 #위로글귀 를 반드시 포함하세요."
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8
        )
        
        print("📸 [오늘의 인스타그램 자동 생성 피드]\n")
        print(response.choices[0].message.content)
        
    except Exception as e:
        print("마케팅 봇 실행 에러:", e)

if __name__ == "__main__":
    generate_instagram_post()
