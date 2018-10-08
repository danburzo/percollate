# Percollate Changelog

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
