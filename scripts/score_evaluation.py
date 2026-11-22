"""Integrity-first corpus scoring for TriLingua Stage 5."""
import argparse,csv,json,statistics,sys
from pathlib import Path
import sacrebleu
from sacrebleu.metrics import BLEU, CHRF
ROOT=Path(__file__).resolve().parents[1]/'evaluation'
PAIRS=[('eng_Latn','tam_Taml','english','tamil'),('eng_Latn','kan_Knda','english','kannada'),('tam_Taml','eng_Latn','tamil','english'),('kan_Knda','eng_Latn','kannada','english'),('tam_Taml','kan_Knda','tamil','kannada'),('kan_Knda','tam_Taml','kannada','tamil')]
def read_jsonl(path):
    rows=[]; errors=[]
    try:
        for n,line in enumerate(path.read_text(encoding='utf-8').splitlines(),1):
            if not line.strip(): errors.append(f'{path}:{n}: blank JSONL row');continue
            try: rows.append(json.loads(line))
            except Exception as e: errors.append(f'{path}:{n}: malformed JSON: {e}')
    except Exception as e: errors.append(f'{path}: UTF-8/read failure: {e}')
    return rows,errors
def validate(refs,preds,src,tgt,source_key,target_key,expected):
    errors=[]
    def dupes(rows):
        ids=[r.get('id') for r in rows];return {x for x in ids if ids.count(x)>1}
    rd,pd=dupes(refs),dupes(preds)
    if rd:errors.append(f'duplicate reference IDs: {sorted(map(str,rd))}')
    if pd:errors.append(f'duplicate prediction IDs: {sorted(map(str,pd))}')
    rm={r.get('id'):r for r in refs};pm={r.get('id'):r for r in preds}
    if len(refs)!=expected:errors.append(f'reference count {len(refs)} != expected {expected}')
    if len(preds)!=expected:errors.append(f'prediction count {len(preds)} != expected {expected}')
    if set(rm)-set(pm):errors.append(f'missing prediction IDs: {sorted(map(str,set(rm)-set(pm)))}')
    if set(pm)-set(rm):errors.append(f'extra prediction IDs: {sorted(map(str,set(pm)-set(rm)))}')
    for ident,p in pm.items():
        if ident not in rm:continue
        r=rm[ident]
        if not r.get('reference','').strip():errors.append(f'{ident}: empty reference')
        if not isinstance(p.get('prediction'),str) or not p['prediction'].strip():errors.append(f'{ident}: empty prediction')
        if p.get('status')!='success':errors.append(f'{ident}: status is not success')
        if p.get('source_language')!=src:errors.append(f'{ident}: wrong source language')
        if p.get('target_language')!=tgt:errors.append(f'{ident}: wrong target language')
        if p.get('source')!=r.get('source'):errors.append(f'{ident}: source text mismatch')
        if 'translation_time_ms' not in p:errors.append(f'{ident}: missing translation time')
        if p.get('reference')!=r.get('reference'):errors.append(f'{ident}: reference alignment mismatch')
    return errors
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--mode',choices=['pilot','full'],default='full');ap.add_argument('--expected-count',type=int);ap.add_argument('--validate-only',action='store_true');ap.add_argument('--predictions-dir',type=Path,default=ROOT/'predictions');ap.add_argument('--references-dir',type=Path,default=ROOT/'references');a=ap.parse_args();expected=a.expected_count or (25 if a.mode=='pilot' else 1012)
    failures=[];results=[]
    for src,tgt,_,_ in PAIRS:
        name=f'{src}-{tgt}';suffix='-pilot' if a.mode=='pilot' else '';rp=a.references_dir/f'{name}{suffix}.jsonl';pp=a.predictions_dir/f'{name}{suffix}.jsonl'
        if not rp.exists() or not pp.exists():failures.append({'direction':name,'errors':[f'missing file: {x}' for x in (rp,pp) if not x.exists()]});continue
        refs,re=read_jsonl(rp);preds,pe=read_jsonl(pp);src,tgt,sk,tk=next(x for x in PAIRS if f'{x[0]}-{x[1]}'==name)
        errs=re+pe+validate(refs,preds,src,tgt,sk,tk,expected)
        if errs:failures.append({'direction':name,'errors':errs});continue
        if a.validate_only:results.append({'direction':name,'status':'valid','count':expected});continue
        refs=sorted(refs,key=lambda x:x['id']);predmap={x['id']:x for x in preds};hyp=[predmap[x['id']]['prediction'] for x in refs];ref=[x['reference'] for x in refs]
        indic=tgt in ('tam_Taml','kan_Knda')
        if indic:
            from indic_evaluation_preprocessing import process
            hyp=[process(x,tgt) for x in hyp];ref=[process(x,tgt) for x in ref];tokenize='none'
        else:tokenize='13a'
        bleu_metric=BLEU(tokenize=tokenize,smooth_method='exp');bleu=bleu_metric.corpus_score(hyp,[ref]);chrf_metric=CHRF(word_order=2);chrf=chrf_metric.corpus_score(hyp,[ref])
        times=[float(predmap[x['id']]['translation_time_ms']) for x in refs]
        results.append({'direction':name,'status':'complete','sentences':expected,'successful':sum(p.get('status') == 'success' for p in preds),'failed':sum(p.get('status') != 'success' for p in preds),'bleu':bleu.score,'bleu_signature':str(bleu_metric.get_signature()),'precisions':bleu.precisions,'brevity_penalty':bleu.bp,'chrf++':chrf.score,'chrf_signature':str(chrf_metric.get_signature()),'time_mean_ms':statistics.mean(times),'time_median_ms':statistics.median(times),'sacrebleu':sacrebleu.__version__,'indicnlp':'0.92','preprocessing':'IndicNormalizerFactory + trivial_tokenize; English 13a','examples':[{'id':x['id'],'source':x['source'],'reference':x['reference'],'prediction':predmap[x['id']]['prediction']} for x in refs[:3]]})
    out=ROOT/'results';out.mkdir(exist_ok=True)
    failure_name='failed_predictions.json' if a.mode=='pilot' else 'failed_predictions.json'
    (out/failure_name).write_text(json.dumps(failures,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    if failures:print(json.dumps({'valid':False,'failed_directions':len(failures)}));sys.exit(2)
    if a.validate_only:print(json.dumps({'valid':True,'directions':len(results),'expected_each':expected}));return
    if a.mode == 'pilot':
        macro_bleu=statistics.mean(x['bleu'] for x in results)
        macro_chrf=statistics.mean(x['chrf++'] for x in results)
        payload={'mode':'pilot','sentences_per_direction':expected,'total_sentences':expected*len(results),'total_successful':sum(x['successful'] for x in results),'total_failed':sum(x['failed'] for x in results),'macro_bleu':macro_bleu,'macro_chrf++':macro_chrf,'sacrebleu':sacrebleu.__version__,'results':results}
        (out/'pilot_results.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        with (out/'direction_comparison.csv').open('w',newline='',encoding='utf-8') as f:
            writer=csv.writer(f);writer.writerow(['direction','sentences','successful','failed','bleu','chrf++'])
            writer.writerows([x['direction'],x['sentences'],x['successful'],x['failed'],x['bleu'],x['chrf++']] for x in results)
        labels={'eng_Latn-tam_Taml':'English → Tamil','eng_Latn-kan_Knda':'English → Kannada','tam_Taml-eng_Latn':'Tamil → English','kan_Knda-eng_Latn':'Kannada → English','tam_Taml-kan_Knda':'Tamil → Kannada','kan_Knda-tam_Taml':'Kannada → Tamil'}
        lines=['# TriLingua Stage 5.3 Pilot Evaluation','',f'Local ONNX pilot: {expected} sentences per direction, {expected * len(results)} total translation attempts.','', '| Translation direction | Sentences | Successful | Failed | BLEU | chrF++ |','|---|---:|---:|---:|---:|---:|']
        lines += [f"| {labels[x['direction']]} | {x['sentences']} | {x['successful']} | {x['failed']} | {x['bleu']:.4f} | {x['chrf++']:.4f} |" for x in results]
        lines += ['',f"**Macro-average BLEU:** {macro_bleu:.4f}",f"**Macro-average chrF++:** {macro_chrf:.4f}",'',f"SacreBLEU: {sacrebleu.__version__}. English uses `13a`; Tamil/Kannada use Indic NLP `IndicNormalizerFactory` plus `trivial_tokenize`, applied to candidates and references. This 25-sentence pilot checks pipeline integrity and is not sufficient to establish final model performance.",'']
        for x in results:
            lines += [f"## {labels[x['direction']]} examples",'']
            for i,e in enumerate(x['examples'],1): lines += [f"### Example {i} (ID {e['id']})",f"- Source: {e['source']}",f"- Reference: {e['reference']}",f"- Prediction: {e['prediction']}",'']
        (out/'evaluation_summary.md').write_text('\n'.join(lines),encoding='utf-8')
    else:
        (out/'final_results.json').write_text(json.dumps({'results':results},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__':main()
