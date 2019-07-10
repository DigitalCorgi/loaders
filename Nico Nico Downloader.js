console.log("Nico Nico Downloader v1.0");
console.log("");

console.log("Importing dependencies...");
const fs = require("fs");
const request = require("request");
const cheerio = require("cheerio");
const path = require("path");
const reqsync = require("sync-request");
const exec = require("child_process").execFileSync;

if (fs.existsSync("Nico Nico Douga Medley Database")) {
	console.log("Directory already exists! Aborting...");
	return;
} else {
	console.log("Creating download directory...");
	fs.mkdirSync("Nico Nico Douga Medley Database");
	process.chdir("Nico Nico Douga Medley Database");
};

console.log("Retrieving version list...");
request("http://kumikyoku.rintaun.net/?group=on", function (error, response, body) {

	console.log("Parsing version list...");
	console.log("");
	const $ = cheerio.load(body);

	$("table[style='background-color: #000000'] tr").slice(1).each(function () {

		if ($(this).css("background-color") == "#7fb5c0") {
			if (path.basename(process.cwd()) != "Nico Nico Douga Medley Database") {
				process.chdir("..");
				console.log("");
			};
			console.log("Creating category: " + $(this).text().trim().slice(0, -1) + "...");
			fs.mkdirSync($(this).text().trim().slice(0, -1));
			process.chdir($(this).text().trim().slice(0, -1));

		} else if (($(this).css("background-color") == "#ccecff" || $(this).css("background-color") == "#eef9ff") && $(this).find("a")) {
			console.log("Downloading file: " + $(this).find("a:nth-child(2)").text() + "...");
			var temp = reqsync("GET", "http://kumikyoku.rintaun.net" + $(this).find("a:nth-child(2)").attr("href")).getBody("utf8").match(/document\.location='.+';/).toString().slice(19, -2);
			exec("wget", ["-q", "-k", temp.replace(/%20$/, "")]);
		};
	});

	console.log("Finished downloading!");
});