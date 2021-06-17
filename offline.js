#!/usr/bin/env node
/**
 * User: wuliang142857 (wuliang142857@gmail.com)
 * Date: 2021/05/19
 * Time: 10:49
 *
 */

const path = require("path");
const fs = require("fs");
const cheerio = require("cheerio");
const walk = require("walk");
const isAbsoluteUrl = require("is-absolute-url");
const isUrl = require("is-url");
const css = require('css');
const { ArgumentParser } = require('argparse');

const parser = new ArgumentParser({
    description: 'Offline Vuepress output'
});
parser.add_argument("-d", "--dist", {help: "vuepress output", required: true, dest: "distPath"})
const arguments = parser.parse_args()

const distPath = fs.realpathSync(arguments.distPath);

const walker = walk.walk(distPath, {
    followLinks: false
});

walker.on("file", (root, fileStats, next) => {
    const extName = path.extname(fileStats.name);
    const file = path.join(root, fileStats.name);
    if (extName === ".html") {
        console.log(`Offline ${file}`);
        offlineHtmlFile(file);
    } else if (extName === ".css") {
        console.log(`Offline ${file}`);
        offlineCssFile(file);
    }
    next();
});

walker.on("errors", (root, nodeStatsArray, next) => {
    next();
});

walker.on("end", () => {
    console.log("All Completed");
});

function offlineCssFile(fileName) {
    const content = fs.readFileSync(fileName, "utf-8");
    const cssAst = css.parse(content);
    cssAst.stylesheet.rules.forEach((rule, index) => {
        if (rule.type !== "import") {
            return;
        }
        if (isBlank(rule.import)) {
            return;
        }
        const importParsed = /url\((.*?)\)/.exec(rule.import);
        if (importParsed === null) {
            return;
        }
        const urlContent = importParsed[1].replace(/["'()]/g, '');
        if (isUrl(urlContent)) {
            return;
        }
        if (!path.isAbsolute(urlContent)) {
            return;
        }
        const realAttributeValue = path.join(distPath, urlContent);
        const relativeValue = path.relative(path.dirname(fileName), realAttributeValue);
        rule.import = `url(${relativeValue})`;
        fs.writeFileSync(fileName, css.stringify(cssAst), "utf-8");
    });

}

function offlineHtmlFile(fileName) {
    const htmlContent = fs.readFileSync(fileName, "utf-8");
    const $ = cheerio.load(htmlContent);
    // CSS
    $("link").each((index, element) => {
        const relAttributeValue = $(element).attr("rel");
        if (relAttributeValue === "preload" || relAttributeValue === "prefetch") {
            // remove preload and prefetch
            $(element).remove();
        }

        const attributeValue = $(element).attr("href");
        if (isBlank(attributeValue)) {
            return;
        }
        if (!path.isAbsolute(attributeValue)) {
            return;
        }
        const realAttributeValue = path.join(distPath, attributeValue);
        const relativeValue = path.relative(path.dirname(fileName), realAttributeValue);
        $(element).attr("href", relativeValue);
    });
    // JS
    $("script").each((index, element) => {
        const attributeValue = $(element).attr("src");
        if (isBlank(attributeValue)) {
            return;
        }
        if (!path.isAbsolute(attributeValue)) {
            return;
        }
        const realAttributeValue = path.join(distPath, attributeValue);
        const relativeValue = path.relative(path.dirname(fileName), realAttributeValue);
        $(element).attr("src", relativeValue);
    });
    // a.href
    $("a").each((index, element) => {
        const attributeValue = $(element).attr("href");
        if (isBlank(attributeValue)) {
            return;
        }
        if (isUrl(attributeValue)) {
            return;
        }
        if (!path.isAbsolute(attributeValue)) {
            return;
        }
        let realAttributeValue = path.join(distPath, attributeValue);
        if (fs.existsSync(path.join(realAttributeValue, "index.html"))) {
            realAttributeValue = path.join(realAttributeValue, "index.html");
        }
        const relativeValue = path.relative(path.dirname(fileName), realAttributeValue);
        $(element).attr("href", relativeValue);
    });
    // img
    $("img").each((index, element) => {
        const attributeValue = $(element).attr("src");
        if (isBlank(attributeValue)) {
            return;
        }
        if (isAbsoluteUrl(attributeValue)) {
            return;
        }
        if (!path.isAbsolute(attributeValue)) {
            return;
        }
        if (isUrl(attributeValue)) {
            // replace like //example.com/1.png
            $(element).attr("src", `https:${attributeValue}`);
        } else {
            const realAttributeValue = path.join(distPath, attributeValue);
            const relativeValue = path.relative(path.dirname(fileName), realAttributeValue);
            $(element).attr("src", relativeValue);
        }
    });

    const transformedHtml = $.html();
    fs.writeFileSync(fileName, transformedHtml, "utf-8");
}

function isBlank(s) {
    return (typeof(s) !== "string") || (s.length === 0);
}