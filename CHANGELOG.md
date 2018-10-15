# Percollate Changelog

### 0.2.10

-   Started separating the CLI from the Node library, working towards a programmatic API (Thank you, [@phenax](https://github.com/phenax)!)
-   Adds `--individual` flag to export many pages as individual PDFs (https://github.com/danburzo/percollate/issues/38)

### 0.2.9

-   Adds a default output file path when the `--output` option is omitted (https://github.com/danburzo/percollate/issues/37)

### 0.2.8

-   Added support for inline CSS styles via the `--css` option (https://github.com/danburzo/percollate/issues/27)

### 0.2.7

-   Added the ability to run `percollate` with the `--no-sandbox` Puppeteer flag

### 0.2.5

-   More print styles to handle blockquotes and `aria-hidden` elements (Re: https://github.com/danburzo/percollate/issues/19)

### 0.2.2

-   Adds article header, including byline, where it exists, and the source URL (https://github.com/danburzo/percollate/issues/18)

### 0.2.1

-   Some Wikipedia-specific enhancements: remove `edit` links next to headings.
-   Added more print styles to the default stylesheet.
-   Fixes relative links (https://github.com/danburzo/percollate/issues/12)

### 0.2.0

-   Deprecates short names for some options (#16)

### 0.1.9

-   Fixes template path resolution (#17) when percollate is installed globally

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
