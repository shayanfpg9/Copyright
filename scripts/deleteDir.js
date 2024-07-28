/* eslint-disable */
const fs = require("fs");
const path = require("path");

/**
 * Function to delete all image files in the specified directory
 * @param {string} dirPath - The path to the directory where image files need to be deleted
 */
function deleteDir(dirPath) {
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${dirPath}: ${err.message}`);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error checking file ${filePath}: ${err.message}`);
          return;
        }

        if (stats.isFile()) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file ${filePath}: ${err.message}`);
            } else {
              console.log(`Deleted image file: ${filePath}`);
            }
          });
        }
      });
    });
  });
}

module.exports = deleteDir;
