"""Insère dev/s9-modules.css et dev/s9-modules.js (et les exemples de l'aperçu, dev/s9-demo.js) dans dev/apercu.html.
À relancer après chaque modification de ces fichiers : python3 dev/s9-insert.py"""
import pathlib, re
D = pathlib.Path(__file__).parent
P = D / 'apercu.html'; s = P.read_text()
css = (D / 's9-modules.css').read_text(); js = (D / 's9-modules.js').read_text(); demo = (D / 's9-demo.js').read_text()
A1, B1 = '/* S9-MODULES-CSS (début) */', '/* S9-MODULES-CSS (fin) */'
A2, B2 = '// S9-MODULES-JS (début)', '// S9-MODULES-JS (fin)'
def put(s, a, b, body, anchor):
    block = a + '\n' + body.strip() + '\n' + b + '\n'
    if a in s: return re.sub(re.escape(a) + '.*?' + re.escape(b) + '\n', lambda m: block, s, count=1, flags=re.S)
    assert s.count(anchor) == 1, anchor
    return s.replace(anchor, block + anchor, 1)
s = put(s, A1, B1, css, '</style>')
s = put(s, A2, B2, js + '\n' + demo, 'function go(id) {')
P.write_text(s); print('ok')
