"""Collect source publications from the Ministry of Industry and Trade portal.
Requires BeautifulSoup in the optional research-deps directory. It is not an
application runtime dependency. ASP.NET pagination is followed normally.
"""
import sys,json,re,time,hashlib,gzip
from pathlib import Path
from datetime import datetime
from urllib.request import Request,build_opener,HTTPCookieProcessor
from urllib.parse import urljoin,urlencode,urlparse
from http.cookiejar import CookieJar
from concurrent.futures import ThreadPoolExecutor,as_completed
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tmp'/'research-deps'))
from bs4 import BeautifulSoup
BASE='https://dichvucong.moit.gov.vn/'
INDEX=BASE+'VdxpTTHCOnline.aspx?LevelType=-1&ServiceName=&ServiceType='
NOW=datetime.now().astimezone().isoformat(timespec='seconds')

def get(opener,url,payload=None):
    for attempt in range(3):
        try:
            request=Request(url,data=urlencode(payload).encode() if payload is not None else None,headers={'User-Agent':'Mozilla/5.0','Referer':BASE})
            with opener.open(request,timeout=30) as response: raw=response.read()
            return BeautifulSoup(raw,'html.parser'),raw
        except Exception:
            if attempt==2:raise
            time.sleep(attempt+1)

def fields(soup,target,argument=''):
    result={item['name']:item.get('value','') for item in soup.select('input[name]') if item.get('type','').lower() not in {'submit','button','image'}}
    for item in soup.select('select[name]'):
        selected=item.select_one('option[selected]') or item.select_one('option')
        if selected:result[item['name']]=selected.get('value',selected.get_text())
    result['__EVENTTARGET']=target;result['__EVENTARGUMENT']=argument
    return result

def text(node):return node.get_text(' ',strip=True) if node else ''
def table_rows(soup,suffix):
    table=soup.find('table',id=lambda value:value and value.endswith(suffix))
    return [row.find_all('td',recursive=False) for row in table.find_all('tr') if row.find_all('td',recursive=False)] if table else []

def catalog():
    opener=build_opener(HTTPCookieProcessor(CookieJar()))
    soup,raw=get(opener,INDEX);items={}
    for page in range(100):
        before=len(items)
        for cells in table_rows(soup,'grdViewDefault'):
            if len(cells)<6:continue
            link=cells[2].find('a',href=True)
            if not link:continue
            url=urljoin(BASE,link['href'])
            items[text(cells[1])]={'code':text(cells[1]),'name':text(cells[2]),'url':url,'agency':text(cells[4])}
        print(f'MOIT index: page {page+1}; records {len(items)}',flush=True)
        if len(items)==before:break
        next_link=soup.find('a',id=lambda value:value and value.endswith('lbtnNext'))
        if not next_link or not next_link.get('href') or 'aspNetDisabled' in next_link.get('class',[]):break
        soup,raw=get(opener,INDEX,fields(soup,'ctl00$cplhContainer$lbtnNext'))
    (ROOT/'data'/'moit-procedure-index.json').write_text(json.dumps({'checkedAt':NOW,'sourceUrl':INDEX,'items':items},ensure_ascii=False),encoding='utf-8')
    return items

def detail(item):
    opener=build_opener(HTTPCookieProcessor(CookieJar()))
    soup,raw=get(opener,item['url']);original=soup
    outer=soup.select_one('table.table-detail')
    info={}
    for row in outer.select(':scope > tbody > tr') if outer else []:
        header=row.find('th',recursive=False);value=row.find('td',recursive=False)
        if header and value:info[text(header)]=value
    if text(info.get('Mã thủ tục'))!=item['code']:raise ValueError('Published procedure code mismatch')
    components={}
    for page in range(30):
        before=len(components)
        for cells in table_rows(soup,'gridThanhphanHS'):
            if len(cells)!=4 or not text(cells[0]).isdigit():continue
            name=text(cells[1]);quantity=text(cells[3]);attachments=[]
            for link in cells[2].find_all('a',href=True):
                if not str(link.get('href') or '').strip() or not text(link):continue
                direct=urljoin(item['url'],link['href']);host=urlparse(direct).hostname or ''
                if urlparse(direct).scheme not in {'http','https'} or not (host.endswith('.gov.vn') or host.endswith('.chinhphu.vn')):continue
                attachments.append({'id':hashlib.sha256(direct.encode()).hexdigest()[:24],'fileName':text(link),'directUrl':direct})
            key=hashlib.sha256(name.encode()).hexdigest()[:24]
            match1=re.search(r'Bản chính:\s*(\d+)',quantity);match2=re.search(r'Bản sao:\s*(\d+)',quantity)
            components[key]={'profileComponentId':key,'name':name,'originalQty':int(match1[1]) if match1 else 0,'copyQty':int(match2[1]) if match2 else 0,'required':False,'attachments':attachments}
        if len(components)==before:break
        target_page=page+2
        link=soup.find('a',href=lambda value:value and f"gridThanhphanHS','Page${target_page}'" in value)
        if not link:break
        soup,raw=get(opener,item['url'],fields(soup,'ctl00$cplhContainer$gridThanhphanHS',f'Page${target_page}'))
    methods=[]
    for cells in table_rows(original,'grdCachThucTH'):
        if len(cells)!=5:continue
        kind={'Trực tiếp':'DIRECT','Nộp trực tuyến':'ONLINE','Nộp qua bưu chính công ích':'POSTAL'}.get(text(cells[1]))
        if not kind:continue
        duration=text(cells[2]);m=re.match(r'(\d+)\s*(.*)',duration)
        unit='WORKING_DAY' if 'làm việc' in duration else 'DAY' if 'Ngày' in duration else 'OTHER'
        methods.append({'submissionMethod':kind,'processingTime':int(m[1]) if m else 0,'processingTimeUnit':unit,'description':text(cells[4]),'fees':[{'description':text(cells[3]),'value':None}] if text(cells[3]) else []})
    legal=[]
    for cells in table_rows(original,'grdCanCu'):
        if len(cells)==3:legal.append({'code':text(cells[1]),'name':text(cells[2])})
    get_text=lambda key:text(info.get(key)) if text(info.get(key))!='Không có thông tin' else ''
    raw={'id':'moit-'+re.search(r'DocId=(\d+)',item['url'])[1],'code':item['code'],'name':item['name'],'state':'PUBLISHED','_sourceUrl':item['url'],'_sourceCheckedAt':NOW,'executionSteps':[{'name':'Trình tự thực hiện','description':get_text('Trình tự thực hiện')}],'executionMethods':methods,'executionCases':[{'name':'Hồ sơ theo công bố','profileComponents':list(components.values())}],'legalBasisesDetails':legal,'requirementsAndConditions':get_text('Yêu cầu hoặc điều kiện thực hiện'),'departmentsExecuting':[{'name':get_text('Cơ quan thực hiện')}],'departmentsAuthority':[{'name':get_text('Cơ quan có thẩm quyền')}],'resultsDetails':[{'name':get_text('Kết quả thực hiện')}],'returningMethods':[]}
    cache=ROOT/'data'/'moit-detail-cache';cache.mkdir(exist_ok=True)
    (cache/(item['code']+'.json')).write_text(json.dumps(raw,ensure_ascii=False),encoding='utf-8')
    return item['code'],raw

def main():
    cache=ROOT/'data'/'moit-procedure-index.json'
    items=json.loads(cache.read_text(encoding='utf-8'))['items'] if cache.exists() else catalog()
    path=ROOT/'data'/'official_catalog_reconciliation.json';result=json.loads(path.read_text(encoding='utf-8'))
    pending=[items[entry['canonicalCode']] for code,entry in result['entries'].items() if entry['status']!='matched' and entry['canonicalCode'] in items]
    print(f'MOIT source matches requiring details: {len(pending)}',flush=True)
    failures={};received={}
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures=[]
        for item in pending:
            cached=ROOT/'data'/'moit-detail-cache'/(item['code']+'.json')
            if cached.exists():received[item['code']]=json.loads(cached.read_text(encoding='utf-8'))
            else:futures.append(pool.submit(detail,item))
        for i,future in enumerate(as_completed(futures),1):
            try:code,raw=future.result();received[code]=raw
            except Exception as e: failures[str(i)]=str(e)
            if i%10==0 or i==len(futures):print(f'MOIT details: {i}/{len(futures)}, errors {len(failures)}',flush=True)
    for code,entry in result['entries'].items():
        raw=received.get(entry['canonicalCode'])
        if not raw:continue
        entry.update({'status':'matched','officialId':raw['id'],'officialName':raw['name'],'sourceUrl':raw['_sourceUrl'],'detailCheckedAt':NOW,'sourcePortal':'MOIT'})
        result['details'][code]=raw
    result['ministrySources']={'moit':{'checkedAt':NOW,'sourceUrl':INDEX,'indexCount':len(items),'detailCount':len(received),'errors':failures}}
    path.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    (ROOT/'resources'/'official_catalog_reconciliation.json.gz').write_bytes(gzip.compress(json.dumps(result,ensure_ascii=False,separators=(',',':')).encode(),mtime=0))
    print('Resolved official publications:',len(result['details']),'remaining',sum(e['status']!='matched' for e in result['entries'].values()),flush=True)
if __name__=='__main__':main()
