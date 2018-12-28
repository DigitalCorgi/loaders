console.log("HicceArs Downloader v1.0");
const fs = require("fs");
const chalk = require("chalk");
const request = require("sync-request");
const cheerio = require("cheerio");
const exec = require("child_process").execFileSync;
const readlineSync = require("readline-sync");
const { CookieMap } = require("cookiefile");
var session;
if (fs.existsSync("cookies.txt")) {
	if (new CookieMap("cookies.txt").get("hicceArs_session")) {
		console.log("Reading session cookie from found " + chalk.blue("cookies.txt") + ".");
		session = new CookieMap("cookies.txt").get("hicceArs_session").value;
	} else {
		console.log("Please enter your session cookie to download restricted content.");
		console.log("A " + chalk.blue("cookies.txt") + " file was found but it didn't contain the session cookie.");
		session = readlineSync.question("hicceArs_session: ");
	};
} else {
	console.log("Please enter your session cookie to download restricted content.");
	console.log("You can also put a " + chalk.blue("cookies.txt") + " in the same directory as this script.");
	session = readlineSync.question("hicceArs_session: ");
};
if (process.argv.length < 3) {
	console.log("No ID found! Please specify at least one artist.");
	return;
};
if (fs.existsSync("HicceArs Downloader")) {
	console.log("HicceArs directory already exists! Aborting...");
	return;
} else {
	fs.mkdirSync("HicceArs Downloader");
	process.chdir("HicceArs Downloader");
};
for (i = 0; i < process.argv.length - 2; i++) {
	console.log("Processing profile " + chalk.blue(i + 1) + " of " + chalk.blue(process.argv.length - 2) + " (ID: " + chalk.blue(process.argv.slice(2)[i]) + ")...");
	console.log("Getting details and pages...");
	var res = request("GET", "https://hiccears.com/artist-content.php?aid=" + process.argv.slice(2)[i], {
		headers: {
			"Cookie": "hicceArs_session=" + session + ";"
		}
	});
	var $ = cheerio.load(res.getBody());
	if (!$("h4").text()) {
		console.log("Could not find a profile with this ID!");
		return;
	};
	var artist = $("h4").text().substr(21);
	var pages = Number($(".pagination").children().last().text() || 1);
	var galleries = [];
	var typestatsg = 0;
	var typestatsp = 0;
	var typestatsn = 0;
	var typestatsu = 0;
	console.log("Artist name: " + chalk.blue(artist) + ", pages: " + chalk.blue(pages) + ".");
	for (j = 0; j < pages; j++) {
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write("Processing page " + chalk.blue(j + 1) + " of " + chalk.blue(pages) + "...");
		var res = request("GET", "https://hiccears.com/artist-content.php?page=" + (j + 1) + "&aid=" + process.argv.slice(2)[i], {
			headers: {
				"Cookie": "hicceArs_session=" + session + ";"
			}
		});
		var $ = cheerio.load(res.getBody());
		$(".title a").each(function (i, elem) {
			galleries.push($(this).attr("href"));
		});
	};
	process.stdout.write("\n");
	for (j = 0; j < galleries.length; j++) {
		switch (galleries[j].substr(2, galleries[j].substr(2).indexOf("."))) {
			case "gallery":
				typestatsg++;
				break;
			case "picture":
				typestatsp++;
				break;
			case "novel":
				typestatsn++;
				break;
			default:
				typestatsu++;
		};
	};
	console.log("Found " + chalk.blue(galleries.length + " objects") + " (" + chalk.green(typestatsg + " galleries") + ", " + chalk.green(typestatsp + " pictures") + ", " + chalk.red(typestatsn + " novels") + ", " + chalk.red(typestatsu + " unknown") + ").");
	console.log("Note: Novels aren't supported yet and unknown pages won't work either.");
	fs.mkdirSync(artist + " (" + process.argv.slice(2)[i] + ")");
	process.chdir(artist + " (" + process.argv.slice(2)[i] + ")");
	for (j = 0; j < galleries.length; j++) {
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write("Downloading object " + chalk.blue(j + 1) + " of " + chalk.blue(galleries.length) + "...");
		var res = request("GET", "https://hiccears.com/" + galleries[j].substr(1), {
			headers: {
				"Cookie": "hicceArs_session=" + session + ";"
			}
		});
		var $ = cheerio.load(res.getBody());
		fs.mkdirSync($(".panel-heading div:first-of-type a").text() + " (" + galleries[j].match(/\d+/) + ")");
		process.chdir($(".panel-heading div:first-of-type a").text() + " (" + galleries[j].match(/\d+/) + ")");
		switch (galleries[j].substr(2, galleries[j].substr(2).indexOf("."))) {
			case "gallery":
				$(".panel-body .row a").each(function (index) {
					if ($(this).attr("href") == "#") {
						return;
					};
					var res = request("GET", "https://hiccears.com" + $(this).attr("href").substr(1), {
						headers: {
							"Cookie": "hicceArs_session=" + session + ";"
						}
					});
					var $2 = cheerio.load(res.getBody());
					exec("wget", ["-q", "https://hiccears.com" + $2(".panel-body .row:nth-child(2) a").attr("href").substr(1)]);
				});
				break;
			case "picture":
				exec("wget", ["-q", "https://hiccears.com" + $(".panel-body .row a").attr("href").substr(1)]);
				break;
		};
		process.chdir("..");
	};
	process.stdout.write("\n");
	console.log("Finished downloading " + chalk.blue(artist) + " (ID: " + chalk.blue(process.argv.slice(2)[i]) + ").");
};