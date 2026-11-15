import json, re, os, hashlib, subprocess, sys, io
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
src = sys.argv[1]
code = json.load(open(src))[0]['text']
urls = sorted(set(re.findall(r'^const \w+ = "(https://www\.figma\.com/api/mcp/asset/[^"]+)";', code, re.M)))
amap = json.load(open('asset_map.json'))
todo = [u for u in urls if u not in amap]
os.makedirs('raw', exist_ok=True); os.makedirs('dist/assets/img', exist_ok=True)
def get(u):
    fn = 'raw/' + u.rsplit('/', 1)[1].split('.')[0]
    if not os.path.exists(fn):
        subprocess.run(['curl', '-sfL', '-o', fn, u], check=True)
    b = open(fn, 'rb').read()
    h = hashlib.sha1(b).hexdigest()[:14]
    if b.lstrip()[:5] in (b'<svg ', b'<?xml') or u.endswith('.svg'):
        out = f'/assets/img/{h}.svg'; open('dist' + out, 'wb').write(b)
    else:
        out = f'/assets/img/{h}.webp'
        if not os.path.exists('dist' + out):
            im = Image.open(io.BytesIO(b)); im.load()
            if max(im.size) > 2880: im.thumbnail((2880, 2880), Image.LANCZOS)
            if im.mode not in ('RGB', 'RGBA'): im = im.convert('RGBA')
            im.save('dist' + out, 'WEBP', quality=82, method=5)
    return u, out
with ThreadPoolExecutor(8) as ex:
    for u, out in ex.map(get, todo):
        amap[u] = out
json.dump(amap, open('asset_map.json', 'w'))
print(len(urls), 'urls,', len(todo), 'new')
