# Contributing

All contributions to this repository are welcome!

I appreciate feedback of any kind via [GitHub issues](https://github.com/danburzo/percollate/issues):

-   bug reports
-   feature suggestions
-   examples of web pages where `percollate` could do a better job

You can contribute to the code base via [Pull Requests](https://github.com/danburzo/percollate/pulls). For small, straightforward fixes, you can create a PR directly. For more sophisticated changes, let's discuss it first in an issue to make sure we're on the same page.

## Setting up the project locally

Clone the repository to your local computer:

```bash
git clone git@github.com:danburzo/percollate.git
cd percollate
```

Then install the necessary dependencies

```bash
# using npm
npm install

# using yarn
yarn
```

You can then run the CLI by using `./index.js` instead of `percollate`:

```bash
./index.js pdf --output some.pdf http://example.com
```

> 💡 You may need to add _execution permissions_ to the file using `chmod +x ./index.js`

### Debugging the temporary HTML

If the generated PDF doesn't look like you'd expect, you can open the temporary HTML file that `percollate` generates in your browser to inspect the markup and styles.

> ./index.js pdf http://www.huevaluechroma.com/072.php <br>
> Fetching: http://www.huevaluechroma.com/072.php <br>
> Enhancing web page <br>
> Generating temporary HTML file at: <br> > **file:///var/folders/yy/h2wycn3j23n6lpf60qf3xmj40000gn/T/tmp-4720cQkEtujUSi0V.html** <br>
> Saving PDF: The-Dimensions-of-Colour-traditional-colour-wheel.pdf
