const { Storage } = require('@google-cloud/storage');
const csv = require('csv-parser');

const storage = new Storage();

exports.analyzeBookGenres = async (event, context) => {
  const bucketName = event.bucket;
  const fileName = event.name;

  console.log(`Hello from Cloud Function! Time: ${new Date()}`); //this was to make the commands run the updated code as it wouldn't work otherwise

  console.log(`Processing file: ${fileName} from bucket: ${bucketName}`);

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  const rows = [];
  const genreCounts = {};

  return new Promise((resolve, reject) => {
    file.createReadStream()
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);

        const genre = row.genre ? row.genre.trim() : "Unknown";
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      })
      .on('end', () => {
        console.log(`Number of books: ${rows.length}`);

        const distinctGenres = Object.keys(genreCounts);
        console.log(`Distinct genres: ${distinctGenres.join(', ')}`);

        console.log("Genre Histogram:");
        for (const [genre, count] of Object.entries(genreCounts)) {
          console.log(`${genre}: ${'*'.repeat(count)} (${count})`);
        }

        let mostFrequent = null;
        let maxCount = 0;
        for (const [genre, count] of Object.entries(genreCounts)) {
          if (count > maxCount) {
            mostFrequent = genre;
            maxCount = count;
          }
        }
        console.log(`Most frequent genre: ${mostFrequent} (${maxCount})`);

        resolve();
      })
      .on('error', (err) => {
        console.error('Error processing file', err);
        reject(err);
      });
  });
};
