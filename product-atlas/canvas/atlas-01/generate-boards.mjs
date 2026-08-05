import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(directory, 'index.html');
const outputDirectory = resolve(directory, 'boards');
const source = await readFile(sourcePath, 'utf8');

const deckOpen = '<div id="deck">';
const deckStart = source.indexOf(deckOpen);
const deckEndMarker = '\n</div>\n\n<div id="nav">';
const deckEnd = source.indexOf(deckEndMarker, deckStart);

if (deckStart < 0 || deckEnd < 0) {
  throw new Error('Unable to locate the deck region in index.html.');
}

const contentStart = deckStart + deckOpen.length;
const deckContent = source.slice(contentStart, deckEnd);
const slides = [...deckContent.matchAll(/^<section class="slide[^>]*data-layout="[^"]+"[\s\S]*?^<\/section>/gm)].map((match) => match[0]);

if (slides.length !== 8) {
  throw new Error(`Expected 8 Atlas slides, found ${slides.length}.`);
}

const boards = [
  ['overview', 'ICHI Product Atlas · Overview', 0],
  ['N1-situation', 'N1 · Situation', 1],
  ['N2-problem', 'N2 · Problem', 2],
  ['E1-scope', 'E1 · Direction & Scope', 3],
  ['E2-experience', 'E2 · Experience', 4],
  ['O1-system', 'O1 · System', 5],
  ['O2-validation', 'O2 · Outcome & Validation', 6]
];

await mkdir(outputDirectory, { recursive: true });

for (const [fileName, title, slideIndex] of boards) {
  let html = source.slice(0, contentStart) + `\n${slides[slideIndex]}\n` + source.slice(deckEnd);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = html.replace('</style>', '#hint,#nav{display:none!important}\n</style>');
  await writeFile(resolve(outputDirectory, `${fileName}.html`), html);
}

console.log(`Generated ${boards.length} Cowart boards in ${outputDirectory}.`);
