import json

# 模拟后端处理的 API 响应
response_text = '{"component_type":"anniversary","mode":"countup","theme":"love","template_id":"anniversary_love","style_preset":"soft-purple","params":{"title":"每一天都算数","start_date":"2024-06-01","subtitle":"每一刻都甜蜜"}}'

# 解析
text = response_text.strip()
print("Text:", text[:100])

try:
    result = json.loads(text)
    print("Parsed:", json.dumps(result, indent=2, ensure_ascii=False))
except Exception as e:
    print("Error:", e)
