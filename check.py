from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse,unquote
import json
root=Path(__file__).parent/'dist';errors=[];count=0;links=0
class Page(HTMLParser):
    def __init__(self):super().__init__();self.attrs=[];self.ids=set();self.h1=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs);self.attrs.append((tag,a))
        if a.get('id'):self.ids.add(a['id'])
        if tag=='h1':self.h1+=1
for file in root.rglob('index.html'):
    p=Page();p.feed(file.read_text(encoding='utf-8'));count+=1
    if file.parent!=root and p.h1!=1:errors.append(f'{file}: expected one H1, got {p.h1}')
    for tag,a in p.attrs:
        if tag=='img' and not a.get('alt'):errors.append(f'{file}: missing image alt')
        ref=a.get('href') if tag=='a' else a.get('src') if tag in ('img','script') else None
        if ref is None:continue
        u=urlparse(ref)
        if u.scheme or u.netloc:continue
        links+=1
        if ref=='#':errors.append(f'{file}: placeholder link')
        target=root/unquote(u.path).lstrip('/') if u.path.startswith('/') else file.parent/u.path
        if not u.path:target=file
        if target.is_dir():target=target/'index.html'
        if not target.exists():errors.append(f'{file}: missing {ref}')
        elif u.fragment:
            other=Page();other.feed(target.read_text(encoding='utf-8'))
            if u.fragment not in other.ids:errors.append(f'{file}: missing anchor {ref}')
    lang='fa-AF' if 'fa-AF' in file.parts else 'en'
    if file.parent!=root:
        htmlattrs=next(a for t,a in p.attrs if t=='html')
        if htmlattrs.get('lang')!=lang:errors.append(f'{file}: wrong locale')
        if htmlattrs.get('dir')!=('rtl' if lang=='fa-AF' else 'ltr'):errors.append(f'{file}: wrong direction')
print(json.dumps({'pages':count,'internal_links_and_assets':links,'errors':errors},ensure_ascii=False,indent=2))
if errors:raise SystemExit(1)
