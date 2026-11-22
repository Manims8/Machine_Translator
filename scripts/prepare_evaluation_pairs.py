import json
from pathlib import Path
root=Path('evaluation'); data=root/'dataset/flores200_devtest_parallel.jsonl'
if not data.exists(): raise SystemExit('Run scripts/download_evaluation_dataset.py after accepting FLORES conditions.')
rows=[json.loads(x) for x in data.read_text(encoding='utf-8').splitlines() if x.strip()]
if len(rows)!=1012 or len({r['id'] for r in rows})!=1012: raise SystemExit('Expected 1,012 unique aligned rows.')
pairs=[('eng_Latn','tam_Taml','english','tamil'),('eng_Latn','kan_Knda','english','kannada'),('tam_Taml','eng_Latn','tamil','english'),('kan_Knda','eng_Latn','kannada','english'),('tam_Taml','kan_Knda','tamil','kannada'),('kan_Knda','tam_Taml','kannada','tamil')]
for s,t,sk,tk in pairs:
    name=f'{s}-{t}'; (root/'references').mkdir(exist_ok=True);(root/'predictions').mkdir(exist_ok=True);(root/'results').mkdir(exist_ok=True)
    (root/'references'/f'{name}.txt').write_text(''.join(r[tk]+'\n' for r in rows),encoding='utf-8')
    with (root/'references'/f'{name}.jsonl').open('w',encoding='utf-8') as f:
        for r in rows:f.write(json.dumps({'id':r['id'],'source':r[sk],'reference':r[tk],'source_language':s,'target_language':t},ensure_ascii=False)+'\n')
    pilot=rows[:25]
    (root/'references'/f'{name}-pilot.txt').write_text(''.join(r[tk]+'\n' for r in pilot),encoding='utf-8')
    with (root/'references'/f'{name}-pilot.jsonl').open('w',encoding='utf-8') as f:
        for r in pilot:f.write(json.dumps({'id':r['id'],'source':r[sk],'reference':r[tk],'source_language':s,'target_language':t},ensure_ascii=False)+'\n')
Path('evaluation/dataset/native_custom_eval_template.csv').write_text('id,english,tamil,kannada,reviewer,verified,notes\n',encoding='utf-8')
