"""Reconcile every local code against current official DVCQG publications.
Read-only government API requests; resume from saved results after interruption.
"""
from __future__ import annotations
import csv, gzip, json, re, sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
from sync_official_procedure_forms import post_json, local_catalog, fetch_detail

def canonical(code):
    value=str(code or '').strip().replace(',','.').replace(' ','')
    if re.fullmatch(r'[0-9]\.[0-9]{3}\.[0-9]{3}',value): value=value[:5]+value[6:]
    return value

def main():
    now=datetime.now().astimezone().isoformat(timespec='seconds')
    data=ROOT/'data'; data.mkdir(exist_ok=True)
    index_path=data/'official_national_catalog.json'
    items=[]; cursor=''; total=0
    progress=data/'official_national_index_progress.json'
    if progress.exists():
        prior=json.loads(progress.read_text(encoding='utf-8')); items=prior.get('items',[]); cursor=prior.get('cursor') or ''; total=prior.get('total',0)
    for page_number in range(200):
        if total and len(items)>=total: break
        page=post_json('/submitting/formality/list-all-public-formality-by-citizen',{'limit':50,'lastId':cursor,'q':'','provinceCode':''})
        batch=page.get('items') or []; total=int(page.get('total') or total)
        if not batch: break
        items.extend(batch)
        (data/'official_national_index_progress.json').write_text(json.dumps({'checkedAt':now,'items':items,'cursor':page.get('lastId'),'total':total},ensure_ascii=False),encoding='utf-8')
        cursor_next=page.get('lastId')
        if (page_number+1)%5==0 or page_number==0: print(f'Official national index: {len(items)}/{total}',flush=True)
        if not cursor_next or cursor_next==cursor or len(items)>=total: break
        cursor=cursor_next
    if total!=len(items): raise RuntimeError(f'Incomplete official index: {len(items)}/{total}')
    index_path.write_text(json.dumps({'checkedAt':now,'sourceUrl':'https://dichvucong.gov.vn/thu-tuc-hanh-chinh','items':items},ensure_ascii=False),encoding='utf-8')
    index={canonical(item.get('code')):item for item in items}
    snapshot=json.loads((data/'official_procedure_forms_snapshot.json').read_text(encoding='utf-8'))
    details=dict(snapshot.get('details',{})); checked=dict(snapshot.get('detailCheckedAt',{}))
    resume=data/'official_reconciliation_details.json'
    if resume.exists():
        previous=json.loads(resume.read_text(encoding='utf-8')); details.update(previous.get('details',{})); checked.update(previous.get('checkedAt',{}))
    local=local_catalog(); entries={}; pending={}; errors={}
    for record in local:
        code=str(record.get('code') or ''); key=canonical(code)
        official=index.get(key)
        entries[code]={'localCode':code,'canonicalCode':key,'localName':record.get('name',''),'status':'not-found-in-current-national-catalog'}
        if not official: continue
        entries[code].update({'status':'matched','officialId':official['id'],'officialName':official.get('name'),'sourceUrl':'https://dichvucong.gov.vn/thu-tuc-hanh-chinh/'+official['id']})
        saved=details.get(key) or details.get(code)
        if not saved or saved.get('id')!=official['id'] or (official.get('updatedAt') and saved.get('updatedAt')!=official.get('updatedAt')):
            pending[key]=official
        elif code!=key:
            details[code]=saved
    print(f'Local codes: {len(entries)}; matched: {sum(e["status"]=="matched" for e in entries.values())}; detail refresh: {len(pending)}',flush=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures=[pool.submit(fetch_detail,item) for item in pending.values()]
        for i,future in enumerate(as_completed(futures),1):
            code,detail,error=future.result()
            if detail is not None: details[code]=detail; checked[code]=now
            else: errors[code]=error
            if i%20==0 or i==len(futures):
                resume.write_text(json.dumps({'details':details,'checkedAt':checked},ensure_ascii=False),encoding='utf-8')
                print(f'Official detail refresh: {i}/{len(futures)}; errors {len(errors)}',flush=True)
    selected={}
    for code,entry in entries.items():
        detail=details.get(entry['canonicalCode']) or details.get(code)
        if entry['status']=='matched' and detail and detail.get('id')==entry['officialId']:
            selected[code]=detail; entry['detailCheckedAt']=checked.get(entry['canonicalCode']) or checked.get(code) or snapshot.get('checkedAt')
        elif entry['status']=='matched': entry['status']='detail-unavailable'; entry['error']=errors.get(entry['canonicalCode'],'Official detail unavailable')
    result={'checkedAt':now,'sourceUrl':'https://dichvucong.gov.vn/thu-tuc-hanh-chinh','nationalCount':len(items),'localCount':len(local),'entries':entries,'details':selected,'detailErrors':errors}
    (data/'official_catalog_reconciliation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    (ROOT/'resources'/'official_catalog_reconciliation.json.gz').write_bytes(gzip.compress(json.dumps(result,ensure_ascii=False,separators=(',',':')).encode(),mtime=0))
    print(json.dumps({'total':len(entries),'matched':len(selected),'unresolved':[e for e in entries.values() if e['status']!='matched'],'errors':errors},ensure_ascii=False),flush=True)
if __name__=='__main__': main()
