# percollate

⚠️ _under-construction.gif_

Percollate is a command-line tool to turn web pages as beautifully formatted PDFs.

## What the plan is

1. We fetch the page and pass it through a Reader View (e.g. the one implemented in Firefox) to strip unnecessary elements.
2. We enhance some things using `jsdom` for DOM manipulation.
3. We attach a nice print stylesheet to it.
4. We use `puppeteer` to generate a PDF from the resulting page.

It will be able to collate a set of web pages into a single PDF.

## Installation

You can install `percollate` globally:

```bash
# using npm
npm install -g percollate

# using yarn
yarn global add percollate
```

## Usage

To transform a single web page to a PDF:

```bash
percollate pdf -o some.pdf https://example.com
```

To bundle several web pages into a single PDF:

```bash
percollate pdf -o some.pdf https://example.com/page1 https://example.com/page2
```

Or you can keep them in a newline-separated text file and use common Unix commands:

```bash
cat urls.txt | xargs percollate pdf -o some.pdf
```

### Available options

Run `percolate --help` to see a list of available options.

-   `-o, --output` — the path to the PDF
-   `-t, --template` — the path to the custom HTML template
-   `-s, --style` — the path to the custom CSS stylesheet
