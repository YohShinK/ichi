"""Extract Canvas outlines from official Oswald at wght=700 (SIL OFL).

Usage: python generate-marker-oswald.py /path/to/Oswald.ttf
Generated output goes to stdout; apply it as marker-oswald-glyphs.ts.
"""
import json
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.basePen import BasePen

font = instantiateVariableFont(TTFont(sys.argv[1]), {"wght": 700})
glyphs = font.getGlyphSet()

class CanvasPen(BasePen):
    def __init__(self):
        super().__init__(glyphs)
        self.commands = []
    def _moveTo(self, p): self.commands.append(["M", *p])
    def _lineTo(self, p): self.commands.append(["L", *p])
    def _qCurveToOne(self, p, end): self.commands.append(["Q", *p, *end])
    def _curveToOne(self, a, b, end): self.commands.append(["C", *a, *b, *end])
    def _closePath(self): self.commands.append(["Z"])

result = {}
for char in "0123456789+—…万千kK":
    name = font.getBestCmap().get(ord(char))
    if name is None: continue
    pen = CanvasPen()
    glyphs[name].draw(pen)
    result[char] = {"advance": glyphs[name].width, "commands": pen.commands}
print('// Generated from Google Fonts Oswald[wght].ttf, weight 700. SIL OFL 1.1.')
print('// See marker-oswald-OFL.txt. Do not substitute a system font for digits.')
print('export const OSWALD_UNITS_PER_EM = ' + str(font['head'].unitsPerEm) + ';')
print('export const OSWALD_GLYPHS: Readonly<Record<string, { advance: number; commands: readonly (readonly (string | number)[])[] }>> = ' + json.dumps(result, ensure_ascii=False) + ';')
