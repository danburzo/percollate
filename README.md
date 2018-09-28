# percollate

⚠️ _under-construction.gif_

Percollate will be a command-line tool to turn web pages as beautifully formatted PDFs.

## What the plan is

1. We fetch the page and pass it through a Reader View (e.g. the one implemented in Firefox) to strip unnecessary elements.
2. We enhance some things using `jsdom` for DOM manipulation.
3. We attach a nice print stylesheet to it.
4. We use `puppeteer` to generate a PDF from the resulting page.

It will be able to collate a set of web pages into a single PDF.

## Installation

_Note: the package does nothing for now._

```bash
# using npm
npm install -g percollate

# using yarn
yarn global add percollate
```

## Usage

_Note: hypothetical usage._

```bash
percollate -i https://some-url -o some.pdf
```

```bash
cat urls.txt > percollate -o some.pdf
```