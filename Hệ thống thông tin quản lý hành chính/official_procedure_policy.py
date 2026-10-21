"""Compile versioned dossier policies from official DVCQG publications.
The official Word/PDF declaration remains the submitted legal form. We preserve
published cases, document components, steps and conditions without fabricating
an electronic declaration schema or undocumented business rules.
"""
from __future__ import annotations
from functools import lru_cache
import gzip
import hashlib
import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parent

def clean(value):
    return re.sub(r'\s+',' ',str(value or '')).strip()

@lru_cache(maxsize=1)
def publication_bundle():
    path=ROOT/'resources'/'official_catalog_reconciliation.json.gz'
    if not path.exists(): return {'entries':{},'details':{}}
    with gzip.open(path,'rt',encoding='utf-8') as stream: return json.load(stream)

def official_record(code):
    bundle=publication_bundle()
    entry=bundle.get('entries',{}).get(code) or {}
    if entry.get('status')!='matched': return None
    raw=bundle.get('details',{}).get(code)
    if not raw or raw.get('id')!=entry.get('officialId'): return None
    return raw

def channels(raw):
    result=[]
    for method in raw.get('executionMethods') or []:
        kind=method.get('submissionMethod')
        description=clean(method.get('description')).casefold()
        if kind=='ONLINE' and (raw.get('isOfflineOnly') or re.search(r'không (?:thực hiện|tiếp nhận|gửi|nộp).*(?:trực tuyến|qua mạng|trên mạng)',description)): continue
        if kind in {'ONLINE','DIRECT','POSTAL'} and kind not in result: result.append(kind)
    return result

def case_labels(raw):
    cases=[c for c in (raw.get('executionCases') or []) if isinstance(c,dict)]
    if not cases and raw.get('profileComponents'): cases=[{'name':'','profileComponents':raw['profileComponents']}]
    labels=[]
    for i,case in enumerate(cases):
        label=clean(case.get('name')) or ('Hồ sơ theo công bố' if len(cases)==1 else f'Trường hợp {i+1}')
        if label in labels: label+=f' ({i+1})'
        labels.append(label)
    return cases,labels

def deadline_rule(raw):
    available=[m for m in raw.get('executionMethods',[]) if m.get('submissionMethod')=='ONLINE'] or raw.get('executionMethods',[])
    values={(m.get('processingTime'),m.get('processingTimeUnit')) for m in available}
    descriptions=[clean(m.get('description')) for m in available if clean(m.get('description'))]
    note='\n'.join(dict.fromkeys(descriptions))
    conditional=any(re.search(r'trường hợp|đối với|hoặc|kéo dài|gia hạn|tùy|tuỳ',d,re.I) for d in descriptions)
    if len(values)==1 and not conditional:
        qty,unit=next(iter(values))
        if isinstance(qty,(int,float)) and qty>0 and qty==int(qty) and unit in {'WORKING_DAY','DAY','HOUR'}:
            return {'kind':unit,'quantity':int(qty),'note':note or f'{int(qty)} '+{'WORKING_DAY':'ngày làm việc','DAY':'ngày','HOUR':'giờ'}[unit]}
    return {'kind':'SOURCE_CONDITIONAL','note':note or 'Thời hạn áp dụng theo trường hợp và phương thức trong công bố.','methods':available}

def fee_policy(raw):
    methods=[m for m in raw.get('executionMethods',[]) if m.get('submissionMethod')=='ONLINE'] or raw.get('executionMethods',[])
    fees=[f for m in methods for f in m.get('fees',[]) if isinstance(f,dict)]
    values={f.get('value') for f in fees if isinstance(f.get('value'),(int,float))}
    descriptions=[clean(f.get('description')) for f in fees if clean(f.get('description'))]
    if fees and len(values)==1 and len(values)==len({f.get('value') for f in fees}) and not descriptions:
        value=next(iter(values))
        if value>=0: return {'kind':'NO_FEE' if value==0 else 'FIXED','amount':value,'sourceFees':fees}
    return {'kind':'VARIABLE' if fees else 'UNSPECIFIED','sourceFees':fees,'note':'\n'.join(dict.fromkeys(descriptions))}

def is_commune_hint(value):
    folded=clean(value).casefold().replace('ủy ban nhân dân','ubnd').replace('uỷ ban nhân dân','ubnd')
    return bool(re.search(r'\bubnd\s+(?:cấp\s+)?xã\b|\bubnd\s+xã,\s*phường|\bcấp\s+xã\b',folded)) and 'cấp tỉnh' not in folded

@lru_cache(maxsize=4096)
def compiled_policy(code):
    raw=official_record(code)
    if not raw: return None
    cases,labels=case_labels(raw)
    steps=[{'id':f'published-step-{i+1}','name':clean(x.get('name')) or f'Bước {i+1}','description':str(x.get('description') or '').strip()} for i,x in enumerate(raw.get('executionSteps') or []) if clean(x.get('name')) or clean(x.get('description'))]
    legal=raw.get('legalBasisesDetails') or []
    methods=channels(raw)
    # Incomplete publications are retained for research, never silently enabled.
    if not cases or not steps or not legal or not methods: return None
    documents=[]
    for i,case in enumerate(cases):
        for j,component in enumerate(case.get('profileComponents') or []):
            if component.get('isProcessingResult') or not clean(component.get('name')): continue
            identity=component.get('profileComponentId') or component.get('id') or str(j+1)
            attachments=[a for a in component.get('attachments') or [] if isinstance(a,dict) and a.get('id') and clean(a.get('fileName') or a.get('name'))]
            item={'id':f'official-{i+1}-{identity}','label':clean(component['name']),'required':bool(component.get('required')),'originalQty':component.get('originalQty',0),'copyQty':component.get('copyQty',0),'help':f"Bản chính: {component.get('originalQty',0)} · Bản sao: {component.get('copyQty',0)}",'officialAttachmentNames':[a.get('fileName') or a.get('name') or 'Biểu mẫu' for a in attachments],'officialAttachments':[{'id':a['id'],'name':a.get('fileName') or a.get('name') or 'Biểu mẫu','url':f"/api/procedures/{code}/templates/{a['id']}"} for a in attachments]}
            if len(cases)>1: item['when']={'field':'officialCase','equals':labels[i]}
            documents.append(item)
    if not documents: return None
    digest=hashlib.sha256(json.dumps(raw,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
    version='official-dossier-'+digest[:20]
    fields=[]
    if len(cases)>1: fields.append({'id':'officialCase','label':'Trường hợp thực hiện','type':'select','required':True,'options':labels})
    fields.append({'id':'requestContent','label':'Nội dung đề nghị','type':'textarea','required':True,'maxLength':3000,'help':'Ghi nội dung đề nghị; tờ khai chính thức đã điền được đính kèm ở bước Thành phần hồ sơ.'})
    source=raw.get('_sourceUrl') or 'https://dichvucong.gov.vn/thu-tuc-hanh-chinh/'+raw['id']
    checked=publication_bundle()['entries'][code].get('detailCheckedAt','')
    deadline=deadline_rule(raw); fees=fee_policy(raw)
    legal_text='; '.join((clean(l.get('code'))+' · '+clean(l.get('name'))).strip(' ·') for l in legal)
    schema={'version':version,'title':clean(raw.get('name')),'sourceUrl':source,'formSourceUrl':source,'formSourceLabel':'Biểu mẫu và hướng dẫn chính thức','sourceStatus':'official-attached-declaration','declarationMode':'OFFICIAL_ATTACHMENTS','sourceCheckedAt':checked,'legalBasis':legal_text,'deadlineText':deadline['note'],'feeText':fees.get('note') or ('Không phát sinh phí theo công bố' if fees['kind']=='NO_FEE' else f"{fees['amount']:,.0f} đồng theo công bố" if fees['kind']=='FIXED' else 'Mức thu áp dụng theo công bố và trường hợp hồ sơ.'),'fields':fields,'documents':documents,'deliveryMethods':[],'deliveryNote':'Cán bộ ghi nhận phương thức trả kết quả trong giấy tiếp nhận.','officialSteps':steps,'conditions':raw.get('requirementsAndConditions') or ''}
    # An online submission channel does not establish electronic result delivery.
    for method in raw.get('returningMethods') or []:
        for value in method.get('value') or []:
            label='Điện tử' if value in {'ONLINE','ONLINE_AT_HOME'} else 'Bưu chính' if value in {'POSTAL','POSTAL_SERVICE','AT_HOME'} else 'Trực tiếp' if value in {'DIRECT','AT_SUBMISSION_PLACE'} else None
            if label and label not in schema['deliveryMethods']: schema['deliveryMethods'].append(label)
    if not schema['deliveryMethods']: schema['deliveryMethods']=['Theo giấy tiếp nhận']
    agency_hints=[]
    for key in ('departmentsExecuting','unitGroupsExecuting','departmentsAuthorized','unitGroupsAuthorized','departmentsAuthority','unitGroupsAuthority'):
        for agency in raw.get(key) or []:
            if not isinstance(agency,dict): continue
            if clean(agency.get('name')) and clean(agency.get('name')) not in agency_hints: agency_hints.append(clean(agency.get('name')))
    executing_only=[clean(a.get('name')) for k in ('departmentsExecuting','unitGroupsExecuting') for a in (raw.get(k) or []) if isinstance(a,dict) and clean(a.get('name'))]
    if any(is_commune_hint(h) for h in agency_hints) or raw.get('isWard'):
        if 'UBND cấp xã' not in agency_hints and 'Ủy ban nhân dân cấp xã' not in agency_hints:
            agency_hints.append('UBND cấp xã')
    ward_only=bool((executing_only and all(is_commune_hint(h) for h in executing_only) and not raw.get('isProvince')) or (raw.get('isWard') and not raw.get('isProvince') and not raw.get('isMinistry')))
    if not ward_only:
        local_agency=clean((publication_bundle().get('entries',{}).get(code) or {}).get('localAgency'))
        if local_agency and local_agency not in agency_hints and 'cấp xã' not in local_agency.casefold() and 'cần xác nhận' not in local_agency.casefold():
            agency_hints.append(local_agency)
    if not agency_hints: return None
    profile={'procedureCode':code,'version':version,'title':schema['title'],'kind':'PUBLISHED_DOSSIER','sourceUrl':source,'checkedAt':checked,'sourceHash':digest,'officialRecordId':raw['id'],'officialCode':raw.get('code'),'channels':methods,'authority':'; '.join(agency_hints),'agencyHints':agency_hints,'officialSteps':steps,'conditions':schema['conditions'],'results':raw.get('resultsDetails') or [],'legalBases':legal,'feePolicy':fees,'deadline':deadline,'stages':{'submitted':'Gửi hồ sơ','intake':'Kiểm tra, tiếp nhận','handling':'Thụ lý theo trình tự công bố','review':'Xem xét kết quả','issue':'Phát hành kết quả','delivery':'Trả kết quả'},'verificationAction':'verify_published_procedure','verificationLabel':'Ghi kết quả thẩm tra hồ sơ','evidenceFields':[{'id':'outcome','label':'Kết luận thẩm tra','options':['Đủ điều kiện trình xem xét','Cần bổ sung, làm rõ hồ sơ','Không đủ điều kiện giải quyết']},{'id':'documentAssessment','label':'Kết quả kiểm tra thành phần hồ sơ và tờ khai','minLength':20},{'id':'conditionsAssessment','label':'Kết quả đối chiếu yêu cầu, điều kiện của thủ tục','minLength':20},{'id':'executionAssessment','label':'Nội dung đã thực hiện theo trình tự công bố','minLength':20},{'id':'verificationBasis','label':'Căn cứ và tài liệu thẩm tra','minLength':20}]}
    return {'schema':schema,'profile':profile}

def agency_matches(profile,agency):
    def normalized(value):
        value=clean(value).casefold().replace('ủy ban nhân dân','ubnd').replace('uỷ ban nhân dân','ubnd')
        value=re.sub(r'\s+(?:thành phố\s+)?hà nội$','',value)
        value=re.sub(r'\s+(?:các\s+)?tỉnh,?\s*thành phố(?:\s+trực thuộc trung ương)?\.?$','',value)
        return value
    actual=normalized(agency)
    for hint in profile.get('agencyHints',[]):
        hint=normalized(hint)
        if actual==hint: return True
        if re.fullmatch(r'(?:chủ tịch )?ubnd (?:cấp )?xã',hint) and re.match(r'^ubnd (phường|xã|đặc khu)\s+\S',actual): return True
    return False
