const {exec} = require('child_process');
const path = require('path');
const fs = require('fs');
const args = process.argv.slice(2);

// Take in filepath
if (!args || !args[0]) {
    console.error("Must include path argument");
    throw new Error("Must include path argument");
}

const EPISODE_PATH = args[0];

if (!fs.existsSync(EPISODE_PATH)) {
    console.error("no dir: "+EPISODE_PATH);
    throw new Error("no dir: "+EPISODE_PATH);
}

// Get all folders in filepath and filter (should include "Season xxx", exclude "Specials" since they are often missing episodes)
let folders = fs.readdirSync(EPISODE_PATH);
folders = folders.filter((folderName) => {
    let folderPath = path.join(EPISODE_PATH, folderName);
    let stat = fs.lstatSync(folderPath);
    if (stat.isDirectory() && (folderName.startsWith("Season ") || folderName === "Specials")) {
        return true;
    }
});

// Enter each season folder and get all files with mp4, mkv, etc. sort by name
folders.forEach((folderName) => {
    let seasonNum = folderName === "Specials" ? 0 : Number(folderName.substring("Season ".length));
    let folderPath = path.join(EPISODE_PATH, folderName);

    let files = fs.readdirSync(folderPath);
    files = files.sort();

    // Rename files to "SxxExx.ext"
    let eps_count = 0;
    files.forEach((fileName) => {
        // Check if file has media extension
        let ext = path.extname(fileName);
        if (ext !== ".mp4" && ext !== ".mkv") {
            return;
        }
        eps_count++;

        // Figure out if they already have an episode num (to account for missing episodes)
        let episodeNums = [];
        for (m of fileName.matchAll(/(?:[\s,\d,-](?:E|(?:(?:E|e)pisode\s*))(\d+))/g)) { // Matches some digit, whitespace, or '-' then Exx or Episode xx
            if (m?.[1]) {
                episodeNums.push(m[1]);
            }
        }
        
        // Calculate the episode num to use
        let episodeNum = "";
        if (episodeNums.length > 1) {
            // Check for compound episodes
            episodeNums.forEach((n, i) => {
                episodeNum += i > 0 ? "-E" : "E";
                episodeNum += String(n).padStart(3, "0");
            });
        } else if (episodeNums.length === 1) {
            episodeNum = "E" + String(episodeNums[0]).padStart(3, "0");
        } else {
            // If no episode num, give default by index
            episodeNum = "E" + (eps_count+1);
        }
        
        // Calculate the new filepath
        let filePath = path.join(folderPath, fileName);
        let newFileName = "S" + String(seasonNum).padStart(3, "0") + episodeNum;
        let newFilePath = path.join(folderPath, newFileName);

        // Check if there is a subs file next to video
        let subName = files.find((s) => {
            if (s.startsWith(fileName.slice(0, fileName.length-ext.length)) && s.endsWith(".srt")) {
                return true;
            }
        });

        if (subName) {
            // There is a subtitle file with this episode
            // Determine new sub name
            let newSubName = newFileName + subName.slice(fileName.length-ext.length, subName.length-".srt".length);

            // Determine if the sub file has a language ext
            subLangExt = path.extname(subName.slice(0, subName.length-'.srt'.length));
            if (!subLangExt) {
                // Sub file does not have lang ext
                // Add .en lang ext
                newSubName += ".en"
            } else if (subLangExt === "eng") {
                // Change eng to en for consistency
            }

            // Calculate old and new sub paths
            let subPath = path.join(folderPath, subName);
            let newSubPath = path.join(folderPath, newSubName);

            // Rename the sub file
            fs.renameSync(subPath, newSubPath+".srt");
            console.log(subPath+" => "+newSubPath+".srt");
        }

        // Rename the file
        fs.renameSync(filePath, newFilePath+ext);
        console.log(filePath+" => "+newFilePath+ext);
    });
});
