const fs = require("fs");
const chalk = require("chalk");
const request = require("sync-request");
const cheerio = require("cheerio");
const exec = require("child_process").execFileSync;
const readlineSync = require("readline-sync");
const { CookieMap } = require("cookiefile");
var session;
console.log(chalk.blue("HicceArs Downloader v1.1"));
if (fs.existsSync("HicceArs Downloader")) {
	console.log("HicceArs directory already exists! Aborting...");
	return;
} else {
	fs.mkdirSync("HicceArs Downloader");
	process.chdir("HicceArs Downloader");
};
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
if (session.match(/[0-9a-z]{64}/) == null) {
	console.log("Warning: Session cookie seems to be invalid and does not match the expected value.");
	console.log("If you are having issues downloading, please make sure you entered it correctly.");
};
download();
function download() {
	console.log("Please enter the " + chalk.blue("APID") + " of an artist to download.");
	console.log("You can find it by looking at the URL of their profile page.");
	console.log("To exit, press Ctrl+C or just close this window.");
	apid = readlineSync.question("https://hiccears.com/artist-profile.php?apid=");
	console.log("Getting details and pages...");
	var res = request("GET", "https://hiccears.com/artist-content.php?aid=" + apid, {
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
		var res = request("GET", "https://hiccears.com/artist-content.php?page=" + (j + 1) + "&aid=" + apid, {
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
	fs.mkdirSync(artist + " (" + apid + ")");
	process.chdir(artist + " (" + apid + ")");
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
		try {
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
		} catch(e) {
			console.log("\nError downloading file! This usually happens when the filename is too long.");
			console.log("Try going up a few directories, e.g. running it from the root of an external drive.");
			console.log(e.toString());
		};
		process.chdir("..");
	};
	process.stdout.write("\n");
	console.log("Finished downloading " + chalk.blue(artist) + " (ID: " + chalk.blue(apid) + ").");
	download();
};
