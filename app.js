const express = require("express");
const cheerio = require("cheerio");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
dotenv.config();
app.use(
    bodyParser.urlencoded({
        limit: "50mb",
        extended: true,
        parameterLimit: 50000,
    })
);

const url = "https://kimetsu-no-yaiba.fandom.com/wiki/Kimetsu_no_Yaiba_Wiki";
const characterUrl = "https://kimetsu-no-yaiba.fandom.com/wiki/";

// GET ALL CHARACTER
app.get("/", (req, resp) => {
    const thumbnails = [];
    const limit = Number(req.query.limit);

    try {
        axios(url).then((res) => {
            const html = res.data;
            const $ = cheerio.load(html);

            $(".portal", html).each(function () {
                const name = $(this).find("a").attr("title");
                const url = $(this).find("a").attr("href");
                const img = $(this).find("a > img").attr("data-src");

                thumbnails.push({
                    name: name,
                    url: "http://localhost:3000" + url.split("/wiki")[1],
                    img: img,
                });
            });

            if (limit && limit > 0) {
                resp.status(200).json(thumbnails.slice(0, limit));
            } else {
                resp.status(200).json(thumbnails);
            }
        });
    } catch (err) {
        resp.status(500).json(err);
    }
});

// GET A CHARACTER
app.get("/:character", (req, resp) => {
    let url = characterUrl + req.params.character;
    const titles = [];
    const details = [];
    const galleries = [];
    const characters = [];
    const characterObj = {};

    try {
        axios(url).then((res) => {
            const html = res.data;
            const $ = cheerio.load(html);

            $(".wikia-gallery-item", html).each(function () {
                const gallery = $(this).find("a > img").attr("data-src");

                galleries.push(gallery);
            });

            $("aside", html).each(function () {
                // Get banner image
                const img = $(this).find("img").attr("src");

                // Get the title of character title
                $(this)
                    .find("section > div > h3")
                    .each(function () {
                        titles.push($(this).text());
                    });
                // Get the details of character details
                $(this)
                    .find("section > div > div")
                    .each(function () {
                        details.push($(this).text());
                    });

                if (!!img) {
                    for (let i = 0; i < titles.length; i++) {
                        characterObj[titles[i].toLowerCase()] = details[i];
                    }
                    characters.push({
                        name: req.params.character.replace("_", " "),
                        gallery: galleries,
                        image: img,
                        ...characterObj,
                    });
                }
            });
            resp.status(200).json(characters);
        });
    } catch (err) {
        resp.status(500).json(err);
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log("server is running");
});
