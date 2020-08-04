const express = require("express");
const path = require("path");
const fs = require('fs');
const os = require('os');
const docable = require('docable');
const { v4: uuidv4 } = require('uuid');
const cheerio = require('cheerio');
const notebookRender = require('./lib/notebookRender');

const {htmlUnescape} = require('escape-goat');
const app = express();
const port = process.env.PORT || "3000";
var bodyParser = require("body-parser");
app.use(bodyParser.text({ type: 'text/plain' }))

// edit view:
// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "pug");

app.use(express.static(__dirname + '/public'));
app.use(express.json());

app.get("/", (req, res) => {
    // res.status(200).send("Notebooks For DevOps");
    res.render("index", { title: "Notebook" });
});

app.post('/run', async function (req, res) {
    // res.send('Got a POST request')

    const notebookMdPath = path.join(os.tmpdir(), uuidv4());
    await fs.promises.writeFile(notebookMdPath, req.body.markdownContent, { encoding: 'utf-8' });

    let results;
    try{
        results = await docable.docable({ doc: notebookMdPath, stepIndex: req.body.stepIndex });
    }
    catch (err) {
        console.error('err: ', err);
    }

    fs.unlinkSync(notebookMdPath);

    res.setHeader('Content-Type', 'text/plain');

    // can't send cheerio selector in response
    results = results.map(res => {
        return { result: res.result, cell: { ...res.cell, elem: undefined } }
    });
    
    res.send(results);
})

app.post('/markdown', async function (req, res) {
    const { html, IR, md } = await notebookRender(req.body);

    res.setHeader('Content-Type', 'text/plain');
    res.send({ html, IR, md });
});

app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});
