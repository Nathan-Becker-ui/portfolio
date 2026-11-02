#!/usr/bin/env python3
"""Build the static portfolio site from Figma get_design_context bundles.

Each bundle is one Figma frame holding several page frames (desktop PT, desktop EN,
mobile PT, mobile EN). Every page is converted from JSX+Tailwind to HTML; desktop and
mobile trees of the same page are combined into one HTML file and switched by a media
query. Tailwind CSS is compiled afterwards with the tailwind CLI.
"""
import json, re, glob, os, html, hashlib, sys
from bs4 import BeautifulSoup, NavigableString

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
OUT = os.path.join(ROOT, 'dist')
ASSET_MAP = json.load(open(os.path.join(ROOT, 'asset_map.json'))) if os.path.exists(os.path.join(ROOT, 'asset_map.json')) else {}
EMAIL = 'mdt.nathan@gmail.com'
LINKEDIN = 'https://www.linkedin.com/in/nathan-gabriel-santos-7225582a6'
BEHANCE = 'https://www.behance.net/nathangabriel'

# ---------------------------------------------------------------- routes
CASES = [  # key, PT slug, EN slug, PT title, EN title
    ('01', 'b2f', 'b2f', 'B2F Agência de viagem', 'B2F Travel Agency'),
    ('02', 'car-house', 'car-house', 'Car House Powerchip', 'Car House Powerchip'),
    ('03', 'nova-era-do-audiovisual', 'new-era-of-audiovisual', 'A Nova Era do Audiovisual', 'The New Era of Audiovisual'),
    ('04', 'redes-sociais', 'social-media', 'Redes Sociais', 'Social Media'),
    ('05', 'identidades-visuais', 'visual-identities', 'Identidades Visuais', 'Visual Identities'),
]

def url(lang, page):
    """page: 'home' | 'cv' | case key '01'.."""
    pre = '/' if lang == 'pt' else '/en/'
    if page == 'home':
        return pre
    if page == 'cv':
        return pre + ('curriculo' if lang == 'pt' else 'resume')
    c = [c for c in CASES if c[0] == page][0]
    return pre + 'cases/' + (c[1] if lang == 'pt' else c[2])

def out_path(lang, page):
    u = url(lang, page)
    return os.path.join(OUT, u.strip('/'), 'index.html') if u != '/' else os.path.join(OUT, 'index.html')

def classify(name):
    """Map a Figma page name to (lang, page, view)."""
    n = name.replace('WEB · ', '')
    lang = 'en' if n.endswith('EN') else 'pt'
    view = 'm' if 'Mobile' in n else 'd'
    if n.startswith('Menu aberto'):
        return lang, 'menu', 'm'
    if n.startswith('Home'):
        return lang, 'home', view
    if n.startswith('Currículo'):
        return lang, 'cv', view
    m = re.match(r'Case (\d\d)', n)
    return lang, m.group(1), view

# ---------------------------------------------------------------- JSX -> HTML
def jsx_to_html(code):
    consts = dict(re.findall(r'^const (\w+) = "([^"]+)";', code, re.M))
    body = code[code.index('return (') + len('return ('):]
    body = body[:body.rindex(');')]

    def tmpl(m):
        return html.escape(m.group(1), quote=False)
    body = re.sub(r'\{`((?:[^`\\]|\\.)*)`\}', tmpl, body, flags=re.S)
    body = re.sub(r'\{"((?:[^"\\]|\\.)*)"\}', tmpl, body)

    def style(m):
        inner = m.group(1)
        props = re.findall(r'(\w+):\s*"([^"]*)"', inner)
        css = ';'.join(re.sub(r'([A-Z])', lambda x: '-' + x.group(1).lower(), k) + ':' + v for k, v in props)
        return 'style="' + html.escape(css) + '"'
    body = re.sub(r'style=\{\{(.*?)\}\}', style, body, flags=re.S)

    def src(m):
        var = m.group(1)
        u = consts.get(var, '')
        return 'src="' + ASSET_MAP.get(u, u) + '"'
    body = re.sub(r'src=\{(\w+)\}', src, body)
    body = body.replace('className=', 'class=')
    body = re.sub(r'<(div|p|span|a)([^<>]*?)\s*/>', r'<\1\2></\1>', body)
    body = re.sub(r'<img([^<>]*?)\s*/>', r'<img\1>', body)
    return body, consts

FONT_RE = re.compile(r"font-\['([^':\]]+):([^'\]]+)'\]")
def fix_classes(soup):
    for i, im in enumerate(soup.find_all('img')):
        im['decoding'] = 'async'
        if not im.find_parent(attrs={'data-name': 'Hero'}):
            im['loading'] = 'lazy'
    for el in soup.find_all(class_=True):
        cls = ' '.join(el['class']) if isinstance(el['class'], list) else el['class']
        cls = FONT_RE.sub(lambda m: "font-['" + m.group(1) + "']", cls)
        el['class'] = cls

# ---------------------------------------------------------------- page assembly
def load_pages():
    pages = {}
    for f in sorted(glob.glob(os.path.join(SRC, '*.txt'))):
        code = json.load(open(f))[0]['text']
        body, consts = jsx_to_html(code)
        soup = BeautifulSoup(body, 'html.parser')
        bundle = soup.find('div')
        for pg in bundle.find_all('div', recursive=False):
            name = pg.get('data-name', '')
            if not name.startswith('WEB · '):
                continue
            key = classify(name)
            # strip absolute placement inside the bundle
            cls = pg['class'] if isinstance(pg['class'], str) else ' '.join(pg['class'])
            cls = re.sub(r'(?<!\S)(absolute|left-\[[^\]]+\]|top-\[[^\]]+\]|left-0|top-0|size-full)(?!\S)', '', cls)
            pg['class'] = cls + ' relative'
            pages[key] = pg
    return pages

def a_wrap(el, href, soup, ext=False, data=None):
    a = soup.new_tag('a', href=href)
    a['class'] = 'lnk'
    if ext:
        a['target'] = '_blank'; a['rel'] = 'noopener'
    if data:
        for k, v in data.items():
            a[k] = v
    el.wrap(a)
    return a

def text_of(el):
    return ' '.join(el.get_text(' ', strip=True).split())

def link_up(tree, soup, lang, page, view):
    other = 'en' if lang == 'pt' else 'pt'
    home = url(lang, 'home')
    sec = {'Sobre': 'sobre', 'About': 'sobre', 'Cases': 'cases', 'Contato': 'contato', 'Contact': 'contato'}
    # section anchors on home
    for el in tree.find_all(attrs={'data-name': True}):
        dn = el['data-name']
        if page == 'home' and dn in ('Sobre', 'Cases', 'Contato') and el.parent is tree:
            el['data-sec'] = sec[dn]
    # e-mail links
    for a in tree.find_all('a', href=True):
        if a['href'].startswith('mailto:'):
            a['href'] = 'mailto:' + EMAIL
        a['target'] = '_blank' if a['href'].startswith('http') else a.get('target', '')
    # generic text links
    for p in list(tree.find_all(['p'])):
        t = text_of(p)
        parent_dn = p.parent.get('data-name', '') if p.parent else ''
        if p.find_parent('a'):
            continue
        if parent_dn == 'Item' or parent_dn in ('Links',) or p.find_parent(attrs={'data-name': re.compile('Coluna LINKS|Links|Nav')}):
            target = {'Cases': 'cases', 'Sobre': 'sobre', 'About': 'sobre', 'Contato': 'contato', 'Contact': 'contato'}.get(t)
            if target:
                a_wrap(p, home + '#' + target, soup, data={'data-go': target})
                continue
            if t in ('Currículo', 'Résumé'):
                a_wrap(p, url(lang, 'cv'), soup)
                continue
        if t == 'PT / EN':
            a_wrap(p.parent if p.parent.get('data-name') == 'Lang' else p, url(other, page if page != 'menu' else 'home'), soup)
        elif t in ('← Todos os cases', '← All cases'):
            a_wrap(p, home + '#cases', soup, data={'data-go': 'cases'})
        elif t in ('LinkedIn',):
            a_wrap(p, LINKEDIN, soup, ext=True)
        elif t in ('Behance',):
            a_wrap(p, BEHANCE, soup, ext=True)
        elif t == EMAIL or t.lower() == EMAIL:
            a_wrap(p, 'mailto:' + EMAIL, soup)
    # nav CV button
    for el in tree.find_all(attrs={'data-name': 'CV'}):
        a_wrap(el, url(lang, 'cv'), soup)
    # brand -> home
    for el in tree.find_all(attrs={'data-name': 'Brand'}):
        if not el.find_parent('a'):
            a_wrap(el, home, soup)
    # CTA buttons
    for el in tree.find_all(attrs={'data-name': 'CTA'}):
        t = text_of(el)
        if t in ('Ver cases', 'View cases'):
            a_wrap(el, home + '#cases', soup, data={'data-go': 'cases'})
        elif t:
            for a in el.find_all('a'):
                a.name = 'p'; a.attrs.pop('href', None); a.attrs.pop('target', None)
            a_wrap(el, 'mailto:' + EMAIL, soup)
    # case cards on home
    for el in tree.find_all(attrs={'data-name': re.compile(r'^Case 0\d$')}):
        k = el['data-name'][-2:]
        a_wrap(el, url(lang, k), soup)
    # next case
    for el in tree.find_all(attrs={'data-name': 'Próximo case'}):
        m = re.search(r'·\s*0?(\d)', text_of(el))
        if m:
            a_wrap(el, url(lang, '0' + m.group(1)), soup)
    # PDF buttons
    for el in tree.find_all(attrs={'data-name': 'Botão PDF'}):
        a_wrap(el, '/cv/Nathan-Gabriel-Santos-' + ('CV-PT' if lang == 'pt' else 'Resume-EN') + '.pdf', soup, data={'download': ''})
    # mobile menu button
    for el in tree.find_all(attrs={'data-name': re.compile(r'^(RASTER · )?Menu$')}):
        el['data-menu-open'] = ''
        el['role'] = 'button'; el['aria-label'] = 'Menu'; el['tabindex'] = '0'
        c = el.get('class') or ''; el['class'] = (' '.join(c) if isinstance(c, list) else c) + ' cursor-pointer z-10'

def link_menu(tree, soup, lang, page):
    home = url(lang, 'home')
    for el in tree.find_all(attrs={'data-name': re.compile(r'^(RASTER · )?Fechar$')}):
        el['data-menu-close'] = ''; el['role'] = 'button'; el['aria-label'] = 'Fechar' if lang == 'pt' else 'Close'
        c = el.get('class') or ''; el['class'] = (' '.join(c) if isinstance(c, list) else c) + ' cursor-pointer z-10'
    for el in tree.find_all(attrs={'data-name': re.compile(r'^Item · ')}):
        t = el['data-name'].split('· ')[1]
        tgt = {'Cases': 'cases', 'Sobre': 'sobre', 'About': 'sobre', 'Contato': 'contato', 'Contact': 'contato'}.get(t)
        if tgt:
            a_wrap(el, home + '#' + tgt, soup, data={'data-go': tgt})
        else:
            a_wrap(el, url(lang, 'cv'), soup)
    idi = tree.find(attrs={'data-name': 'Idioma'})
    if idi:
        for el in idi.find_all(attrs={'data-name': re.compile('^(PT|EN)$')}):
            a_wrap(el, url(el['data-name'].lower(), page if page != 'menu' else 'home'), soup)
    for el in tree.find_all(attrs={'data-name': 'Brand'}):
        a_wrap(el, home, soup)
    for el in tree.find_all(attrs={'data-name': 'CTA'}):
        for a in el.find_all('a'):
            a.name = 'p'; a.attrs.pop('href', None); a.attrs.pop('target', None)
        a_wrap(el, 'mailto:' + EMAIL, soup)

META = {
    'pt': {'home': ('Nathan Gabriel Santos — UX/UI & Product Designer', 'Portfólio de Nathan Gabriel Santos, UX/UI & Product Designer em Londrina, Brasil. Produtos digitais, sites, landing pages e marcas.'),
           'cv': ('Currículo — Nathan Gabriel Santos', 'Currículo de Nathan Gabriel Santos, UX/UI & Product Designer.')},
    'en': {'home': ('Nathan Gabriel Santos — UX/UI & Product Designer', 'Portfolio of Nathan Gabriel Santos, UX/UI & Product Designer based in Londrina, Brazil. Digital products, websites, landing pages and brands.'),
           'cv': ('Résumé — Nathan Gabriel Santos', 'Résumé of Nathan Gabriel Santos, UX/UI & Product Designer.')},
}

def page_meta(lang, page):
    if page in META[lang]:
        return META[lang][page]
    c = [c for c in CASES if c[0] == page][0]
    title = c[3] if lang == 'pt' else c[4]
    return (title + ' — Nathan Gabriel Santos', (('Case de ' if lang == 'pt' else 'Case study: ') + title + ' — Nathan Gabriel Santos, UX/UI & Product Designer.'))

TEMPLATE = '''<!doctype html>
<html lang="{htmllang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="/assets/og.jpg">
<link rel="alternate" hreflang="pt-BR" href="{alt_pt}">
<link rel="alternate" hreflang="en" href="{alt_en}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/Geist-Medium.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
</head>
<body class="{bodyclass}">
<script>(function(){{function z(){{var w=document.documentElement.clientWidth;var r=document.documentElement.style;r.setProperty("--zd",w/1440);r.setProperty("--zm",w/390);}}z();addEventListener("resize",z);}})();</script>
<div class="v-d">{desk}</div>
<div class="v-m">{mob}</div>
<div class="menu" aria-hidden="true">{menu}</div>
<script src="/assets/site.js" defer></script>
</body>
</html>
'''

def build():
    pages = load_pages()
    os.makedirs(OUT, exist_ok=True)
    built = []
    for lang in ('pt', 'en'):
        menu_tree = pages.get((lang, 'menu', 'm'))
        for page in ['home', 'cv'] + [c[0] for c in CASES]:
            d = pages.get((lang, page, 'd')); m = pages.get((lang, page, 'm'))
            if d is None or m is None:
                print('missing', lang, page, d is None, m is None); continue
            parts = []
            for tree, view in ((d, 'd'), (m, 'm')):
                src = str(tree)
                if page == 'cv' and view == 'd':
                    src = src.replace('tracking-[-4.8px] w-[760px]', 'tracking-[-4.8px] w-full')
                s = BeautifulSoup(src, 'html.parser'); t = s.find('div')
                link_up(t, s, lang, page, view); fix_classes(s); parts.append(str(s))
            ms = BeautifulSoup(str(menu_tree), 'html.parser'); link_menu(ms.find('div'), ms, lang, page); fix_classes(ms)
            title, desc = page_meta(lang, page)
            other = 'en' if lang == 'pt' else 'pt'
            bg = 'bg-dark' if page != 'cv' else 'bg-light'
            doc = TEMPLATE.format(htmllang='pt-BR' if lang == 'pt' else 'en', title=html.escape(title), desc=html.escape(desc),
                                  alt_pt=url('pt', page), alt_en=url('en', page), desk=parts[0], mob=parts[1], menu=str(ms), bodyclass=bg)
            p = out_path(lang, page); os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, 'w').write(doc); built.append(p)
    print('built', len(built))

if __name__ == '__main__':
    build()
