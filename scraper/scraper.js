import fs from "fs";
import { csfd } from "node-csfd-api";
import { exit } from "process";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function append_to_json(movie) {
    const movieData = {
        id: movie.id,
        title: movie.title,
        year: movie.year || null,
        rating: movie.rating || null,
        ratingCount: movie.ratingCount || null,
        genres: movie.genres || [],
        directors: movie.creators?.directors?.map(d => d.name) || [],
        writers: movie.creators?.writers?.map(w => w.name) || [],
        actors: movie.creators?.actors?.map(a => a.name) || []
    };

    const line = JSON.stringify(movieData) + "\n";
    fs.appendFileSync("movies.jsonl", line, "utf8");
}

function init_json() {
    fs.writeFileSync("movies.jsonl", "", "utf8");
}

function help() {
    console.log("node scraper.js -e [number]");
    console.log("-h            show help");
    console.log("-s [number]   (default is 1) id of the first movie to get");
    console.log("-e [number]   (required) id of the last movie to get");
    console.log("-d [number]   (default is 500) delay in ms between each request");
    exit(0);
}

async function start_scraping({ start_id, end_id, delay }) {
    init_json();
    
    let collected = 0;

    for (let id = start_id; id <= end_id; id++) {
        try {
            console.log(`trying id: ${id}`);

            const detail = await csfd.movie(id);

            // if (!detail || detail.type !== "film") {
            //   continue;
            // }

            // if (!detail.ratingCount || detail.ratingCount < 100) {
            //   continue;
            // }

            append_to_json(detail);
            collected++;

            console.log(`saved ${collected} (${id}/${end_id}): ${detail.title}`);

            await sleep(delay);
        } catch (error) {
            continue;
        }
    }
}

function parse_args() {
    const args = process.argv.slice(2);
    
    let start_id = 1;
    let end_id = undefined;
    let delay = 500;

    args.forEach((arg, index) => {
        switch(arg) {
            case "-h":
                help()
            case "-s":
                if(index + 1 >= args.length) {
                    console.log("missing value")
                }
                start_id = parseInt(args[index + 1]);
                if (isNaN(start_id)) {
                    console.log("invalid start id");
                    help();
                }
                break;
            case "-e":
                if(index + 1 >= args.length) {
                    console.log("missing value")
                }
                end_id = parseInt(args[index + 1]);
                if (isNaN(end_id)) {
                    console.log("invalid end id");
                    help();
                }
                break;
            case "-d":
                if(index + 1 >= args.length) {
                    console.log("missing value")
                }
                delay = parseInt(args[index + 1]);
                break;
        }
    });

    if(end_id == undefined) {
        console.log("missing arguments");
        help();
    }

    return {start_id, end_id, delay};
}

async function main() {
    const settings = parse_args(); 
    console.log("scraper settings: " + JSON.stringify(settings));

    console.log("scraper started");

    await start_scraping(settings);

    console.log("scraping finished");
}

main();
