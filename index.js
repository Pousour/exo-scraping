const puppeteer = require('puppeteer');
const Datastore = require("nedb");
const express = require('express');

//On créé le serveur
let app = express();
app.listen(3000, () => console.log("listening at 3000"));
app.use(express.static('public'));
app.use(express.json({}))

// On charge la base de données
const database = new Datastore("database.db");
database.loadDatabase();

// On scrap le site qu'on veut stock les données dans la DB
function scrap(mois, annee) {
    (async () => {
        database.remove({}, {multi: true});
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        var url = "https://www.imdb.com/movies-coming-soon/" + annee + "-" + mois;
        console.log(url)
        await page.goto(url);
        const movies = await page.evaluate(() => {
            let movies = []
            let elements = document.querySelectorAll("div.list_item")
            for (element of elements) {
                movies.push({
                img: element.querySelector("img.poster")?.src,
                title: element.querySelector("td.overview-top a")?.text.trim(),
                description: element.querySelector("div.outline")?.textContent.trim(),
                time: element.querySelector("p.cert-runtime-genre time")?.textContent,
                genre: element.querySelector("p.cert-runtime-genre span")?.textContent,
                })
            }

            return movies;
        });
        dataRecup = movies;
        database.insert(dataRecup);
        await browser.close();
        return dataRecup
    })();
}

scrap("04", "2021")

app.get('/api', (request, response) => {
    database.find({}, (err, data) => {
        if (err) {
            response.end;
            return
        }
        response.json(data)
    })
})

var mois = "";
var annee = "";

app.post('/api', (request, response) => {
    console.log('I got a request !')
    console.log(request.body);
    const data = request.body;
    response.json({
        status: "success",
        mois: data.mois,
        annee: data.annee,
    });
    mois = data.mois;
    annee = data.annee;
    scrap(mois, annee) 
})







