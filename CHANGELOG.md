# Percollate Changelog

### Unreleased

Adds `percollate/${version}` user-agent to prevent some HTTP 405 errors ([#59](https://github.com/danburzo/percollate/issues/59)).

We now perform relative to absolute URI conversion inside Percollate itself rather than rely on Readability ([#33](https://github.com/danburzo/percollate/issues/33), thank you [@ramadis](https://github.com/ramadis), [@tanmayrajani](https://github.com/tanmayrajani) for the help!). This includes the `srcset` attribute, which caused images to be broken on some sites ([#58](https://github.com/danburzo/percollate/issues/58)).

Made `imagesAtFullSize` ignore Wikipedia image file links ([#42](https://github.com/danburzo/percollate/issues/42)).

Percollate now emulates a high-resolution display, which in some cases helps get the best quality image available.

Adds new enhancement, `singleImgToFigure`, that transforms single images into `<figure>` elements, using the image's `alt` attribute as `<figcaption>`.

Preserve `anchor` class on hyperlinks, hide them when they're part of a heading. (A common pattern for Markdown to HTML tools).

### 0.2.12

-   Fixes indentation of images wrapped in `<p>` tags ([#48](https://github.com/danburzo/percollate/issues/48))
-   Adds basic styles for tables ([#50](https://github.com/danburzo/percollate/issues/50)), figures, defition terms, et cetera.
-   Adds a better font stack, using CSS variables
-   Better CLI feedback with [ora](https://github.com/sindresorhus/ora) (thanks [@emersonlaurentino](https://github.com/emersonlaurentino)!)

### 0.2.11

-   Bump required Node version to 8.6.0 ([#45](https://github.com/danburzo/percollate/issues/45))
-   Show help when no arguments provided or command chosen ([#36](https://github.com/danburzo/percollate/issues/36), thanks [@tanmayrajani](https://github.com/tanmayrajani)!)
-   Don't append the HREF for in-page anchors or anchors which have the full URL as their text content ([#31](https://github.com/danburzo/percollate/issues/31))

### 0.2.10

-   Started separating the CLI from the Node library, working towards a programmatic API (Thank you, [@phenax](https://github.com/phenax)!)
-   Adds `--individual` flag to export many pages as individual PDFs ([#38](https://github.com/danburzo/percollate/issues/38))

### 0.2.9

-   Adds a default output file path when the `--output` option is omitted ([#37](https://github.com/danburzo/percollate/issues/37))

### 0.2.8

-   Added support for inline CSS styles via the `--css` option ([#27](https://github.com/danburzo/percollate/issues/27))

### 0.2.7

-   Added the ability to run `percollate` with the `--no-sandbox` Puppeteer flag

### 0.2.5

-   More print styles to handle blockquotes and `aria-hidden` elements; re: [#19](https://github.com/danburzo/percollate/issues/19)

### 0.2.2

-   Adds article header, including byline, where it exists, and the source URL ([#18](https://github.com/danburzo/percollate/issues/18))

### 0.2.1

-   Some Wikipedia-specific enhancements: remove `edit` links next to headings.
-   Added more print styles to the default stylesheet.
-   Fixes relative links ([#12](https://github.com/danburzo/percollate/issues/12))

### 0.2.0

-   Deprecates short names for some options ([#16](https://github.com/danburzo/percollate/issues/16))

### 0.1.9

-   Fixes template path resolution ([#17](https://github.com/danburzo/percollate/issues/17)) when percollate is installed globally

### 0.1.8

-   Adds support for a custom page header/footer via the HTML template and CSS stylesheet

### 0.1.6

-   Uses Puppeteer's `preferCSSPageSize` to make the page size and margins configurable from the CSS

### 0.1.5

-   Only replace single image SRCs with their parent's HREF if the latter matches an image file

### 0.1.3

-   Introduces separate commands. For now, the `pdf` command is implemented.
-   Adds the ability to specify a custom HTML template / custom stylesheet.

### 0.1.2

-   Run `percollate` as a CLI tool that takes one or more URLs and bundles them into a single PDF file.
