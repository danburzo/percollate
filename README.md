<img src='./.github/percollate.svg' alt='percollate' width='200'/>

<a href="https://www.npmjs.org/package/percollate"><img src="https://img.shields.io/npm/v/percollate.svg?style=flat-square&labelColor=324A97&color=black" alt="npm version"></a>

Percollate is a command-line tool that turns web pages into beautifully formatted PDF, EPUB, or HTML files.

<img alt="Example Output" src="https://raw.githubusercontent.com/danburzo/percollate/master/.github/dimensions-of-colour.png">

<!--Example spread from the generated PDF of [a chapter in Dimensions of Colour](http://www.huevaluechroma.com/072.php); rendered here in black & white for a smaller image file size._-->

-   [Installation](#installation)
-   [Usage](#usage)
    -   [Available commands](#available-commands)
    -   [Available options](#available-options)
-   [Recipes](#recipes)
    -   [Basic bundling](#basic-bundling)
    -   [The `--css` option](#the---css-option)
    -   [The `--style` option](#the---style-option)
    -   [The `--template` option](#the---template-option)
-   [How it works](#how-it-works)
-   [Updating](#updating)
-   [Limitations](#limitations)
-   [Troubleshooting](#troubleshooting)
-   [Contributing](#contributing)
-   [See also](#see-also)

## Installation

`percollate` is a Node.js command-line tool which you can install globally from npm:

```bash
npm install -g percollate
```

Percollate and its dependencies require Node.js version 10.22.0 or later.

#### Community-maintained packages

There's [a packaged version](https://aur.archlinux.org/packages/nodejs-percollate/) available on [Arch User Repository](https://wiki.archlinux.org/index.php/Arch_User_Repository), which you can install using your local [AUR helper](https://wiki.archlinux.org/index.php/AUR_helpers) (`yay`, `pacaur`, or similar):

```
yay -S nodejs-percollate
```

## Usage

> Run `percollate --help` for a list of available commands and options.

Percollate is invoked on one or more operands (usually URLs):

```bash
percollate <command> [options] url [url]...
```

The following commands are available:

-   `percollate pdf` produces a PDF file;
-   `percollate epub` produces an EPUB file;
-   `percollate html` produces a HTML file.

The operands can be URLs, paths to local files, or the `-` character which stands for `stdin` (the standard inputs).

### Available options

Unless otherwise stated, these options apply to all three commands.

#### `-o, --output`

Specify the path of the resulting bundle relative to the current folder.

```bash
percollate pdf https://example.com -o my-example.pdf
```

#### `-u, --url`

Using the `-` operand you can read the HTML content from `stdin`, as fetched by a separate command, such as `curl`. In this sort of setup, `percollate` does not know the URL from which the content has been fetched, and relative paths on images, anchors, et cetera won't resolve correctly.

Use the `--url` option to supply the source's original URL.

```bash
curl https://example.com | percollate pdf - --url=https://example.com
```

#### `--individual`

By default, percollate bundles all web pages in a single file. Use the `--individual` flag to export each source to a separate file.

```bash
percollate pdf --individual http://example.com/page1 http://example.com/page2
```

#### `--template`

Path to a custom HTML template. Applies to `pdf` and `html`.

#### `--style`

Path to a custom CSS stylesheet, relative to the current folder.

#### `--css`

Additional CSS styles you can pass from the command-line to override styles specified by the default/custom stylesheet.

#### `--no-amp`

Don't prefer the AMP version of the web page.

#### `--debug`

Print more detailed information.

#### `-t, --title`

Provide a title for the bundle.

```bash
percollate epub http://example.com/page-1 http://example.com/page-2 --title="Best Of Example"
```

#### `-a, --author`

Provide an author for the bundle.

```bash
percollate pdf --author="Ella Example" http://example.com
```

#### `--cover`

Generate a cover. The option is implicitly enabled when the `--title` option is provided, or when bundling more than one web page to a single file. Disable this implicit behavior by passing the `--no-cover` flag.

#### `--toc`

Generate a hyperlinked table of contents. The option is implicitly enabled when bundling more than one web page to a single file. Disable this implicit behavior by passing the `--no-toc` flag.

Applies to `pdf` and `html`.

#### `--hyphenate`

Hyphenation is enabled by default for `pdf`, and disabled for `epub` and `html`. You can opt into hyphenation with the `--hyphenate` flag, or disable it with the `--no-hyphenate` flag.

See also the [Hyphenation and justification](#hyphenation-and-justification) recipe.

## Recipes

### Basic bundling

To turn a single web page into a PDF:

```bash
percollate pdf --output=some.pdf https://example.com
```

To bundle _several_ web pages into a single PDF, specify them as separate arguments to the command:

```bash
percollate pdf --output=some.pdf https://example.com/page1 https://example.com/page2
```

You can use common Unix commands and keep the list of URLs in a newline-delimited text file:

```bash
cat urls.txt | xargs percollate pdf --output=some.pdf
```

To transform several web pages into individual PDF files at once, use the `--individual` flag:

```bash
percollate pdf --individual https://example.com/page1 https://example.com/page2
```

If you'd like to fetch the HTML with an external command, you can use `-` as an operand, which stands for `stdin` (the standard input):

```bash
curl https://example.com/page1 | percollate pdf --url=https://example.com/page1 -
```

Notice we're using the `url` option to tell percollate the source of our (now-anonymous) HTML it gets on stdin, so that relative URLs on links and images resolve correctly.

### The `--css` option

The `--css` option lets you pass a small snippet of CSS to percollate. Here are some common use-cases:

#### Custom page size / margins

The default page size is A5 (portrait). You can use the `--css` option to override it using [any supported CSS `size`](https://www.w3.org/TR/css3-page/#page-size):

```bash
percollate pdf --css "@page { size: A3 landscape }" http://example.com
```

Similarly, you can define:

-   custom margins, e.g. `@page { margin: 0 }`
-   the base font size: `html { font-size: 10pt }`

#### Changing the font stacks

The default stylesheet includes CSS variables for the fonts used in the PDF:

```css
:root {
	--main-font: Palatino, 'Palatino Linotype', 'Times New Roman',
		'Droid Serif', Times, 'Source Serif Pro', serif, 'Apple Color Emoji',
		'Segoe UI Emoji', 'Segoe UI Symbol';
	--alt-font: 'helvetica neue', ubuntu, roboto, noto, 'segoe ui', arial,
		sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
	--code-font: Menlo, Consolas, monospace;
}
```

| CSS variable  | What it does                          |
| ------------- | ------------------------------------- |
| `--main-font` | The font stack used for body text     |
| `--alt-font`  | Used in headings, captions, et cetera |
| `--code-font` | Used for code snippets                |

To override them, use the `--css` option:

```bash
percollate pdf --css ":root { --main-font: 'PT Serif';  --alt-font: Roboto; }" http://example.com
```

> 💡 To work correctly, you must have the fonts installed on your machine. Custom web fonts currently require you to use a custom CSS stylesheet / HTML template.

#### Remove the appended `href`s from hyperlinks

The idea with percollate is to make PDFs that can be printed without losing where the hyperlinks point to. However, for some link-heavy pages, the appended `href`s can become bothersome. You can remove them using:

```bash
percollate pdf --css "a:after { display: none }" http://example.com
```

#### Hyphenation and justification

Hyphenation is only enabled by default for PDFs, but you can opt in or out of it for any output format with [a flag](#--hyphenate).

When hyphenation is enabled, paragraphs will be justified:

```css
.article__content p {
	text-align: justify;
}
```

If you prefer left-aligned text:

```bash
percollate pdf --css ".article__content p { text-align: left }" http://example.com
```

### The `--style` option

The `--style` option lets you use your own CSS stylesheet instead of the default one. Here are some common use-cases for this option:

> ⚠️ TODO add examples here

### The `--template` option

The `--template` option lets you use a custom HTML template for the PDF.

> 💡 The HTML template is parsed with [nunjucks](https://mozilla.github.io/nunjucks/), which is a close JavaScript relative of Twig for PHP, Jinja2 for Python and L for Ruby.

Here are some common use-cases:

#### Customizing the page header / footer

Puppeteer can print some basic information about the page in the PDF. The following CSS class names are available for the header / footer, into which the appropriate content will be injected:

-   `date` — The formatted print date
-   `title` — The document title
-   `url` — document location (**Note:** this will print the path of the _temporary html_, not the original web page URL)
-   `pageNumber` — the current page number
-   `totalPages` — total pages in the document

> 👉 See the [Chromium source code](https://cs.chromium.org/chromium/src/components/printing/resources/print_header_footer_template_page.html) for details.

You place your header / footer template in a `template` element in your HTML:

```html
<template class="header-template"> My header </template>

<template class="footer-template">
	<div class="text center">
		<span class="pageNumber"></span>
	</div>
</template>
```

See the [default HTML](./templates/default.html) for example usage.

You can add CSS styles to the header / footer with either the `--css` option or a separate CSS stylesheet (the `--style` option).

> 💡 The header / footer template [do not inherit their styles](https://github.com/GoogleChrome/puppeteer/issues/1853) from the rest of the page (i.e. they are not part of the cascade), so you'll have to write the full CSS you want to apply to them.

An example from the [default stylesheet](./templates/default.css):

```css
.footer-template {
	font-size: 10pt;
	font-weight: bold;
}
```

## Updating

To keep the tool up-to-date, you can run:

```bash
npm install -g percollate
```

Occasionally, an ugrade might not go according to plan; in this case, you can uninstall and re-install `percollate`:

```bash
npm uninstall -g percollate && npm install -g percollate
```

## How it works

All export formats follow a common pipeline:

1. Fetch the page(s) using [`node-fetch`](https://github.com/node-fetch/node-fetch)
2. If an AMP version of the page exists, use that instead (disable with `--no-amp` flag)
3. [Enhance](./src/enhancements.js) the DOM using [`jsdom`](https://github.com/jsdom/jsdom)
4. Pass the DOM through [`mozilla/readability`](https://github.com/mozilla/readability) to strip unnecessary elements
5. Apply the [HTML template](./templates/default.html) and the [stylesheet](./templates/default.css) to the resulting HTML

Different formats then use different tools:

-   PDFs are generated with [`puppeteer`](https://github.com/GoogleChrome/puppeteer);
-   EPUBs have external images fetched and bundled together with the HTML of each article;
-   HTMLs are saved without any further changes (images are not saved to the disk).

## Limitations

Percollate inherits the limitations of two of its main components, Readability and Puppeteer (headless Chrome).

The imperative approach Readability takes will not be perfect in each case, especially on HTML pages with atypical markup; you may occasionally notice that it either leaves in superfluous content, or that it strips out parts of the content. You can confirm the problem against [Firefox's Reader View](https://blog.mozilla.org/firefox/reader-view/). In this case, consider [filing an issue on `mozilla/readability`](https://github.com/mozilla/readability/issues).

Using a browser to generate the PDF is a double-edged sword. On the one hand, you get excellent support for web platform features. On the other hand, [print CSS](https://www.smashingmagazine.com/2018/05/print-stylesheets-in-2018/) as defined by W3C specifications is only partially implemented, and it seems unlikely that support will be improved any time soon. However, even with modest print support, I think Chrome is the best (free) tool for the job.

## Troubleshooting

On some Linux machines you'll need to [install a few more Chrome dependencies](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#chrome-headless-doesnt-launch) before `percollate` works correctly. (_Thanks to @ptica for [sorting it out](https://github.com/danburzo/percollate/issues/19#issuecomment-428496041)_)

The `percollate pdf` command supports the `--no-sandbox` Puppeteer flag, but make sure you're [aware of the implications](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#chrome-headless-fails-due-to-sandbox-issues) before disabling the sandbox.

## Contributing

Contributions of all kinds are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## See also

Here are some other projects to check out if you're interested in building books using the browser:

-   [weasyprint](https://github.com/Kozea/WeasyPrint) ([website](https://weasyprint.org/))
-   [bindery.js](https://github.com/evnbr/bindery) ([website](https://evanbrooks.info/bindery/))
-   [HummusJS](https://github.com/galkahana/HummusJS)
-   [Editoria](https://gitlab.coko.foundation/editoria/editoria) ([website](https://editoria.pub/))
-   [pagedjs](https://gitlab.pagedmedia.org/tools/pagedjs) ([article](https://www.pagedmedia.org/pagedjs-sneak-peeks/))
-   [Mercury](https://mercury.postlight.com/)
-   [Foliojs](https://github.com/foliojs)
-   [Magicbook](https://github.com/magicbookproject/magicbook)
-   [monolith](https://github.com/Y2Z/monolith)
-   [SaraVieira/starter-book](https://github.com/SaraVieira/starter-book)
