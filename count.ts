import { divisions } from './src/lib/ivory-coast-divisions';

let totalSP = 0;
let populatedSP = 0;
let totalVillages = 0;

for (const region in divisions) {
  for (const department in divisions[region]) {
    for (const sp in divisions[region][department]) {
      totalSP++;
      const v = divisions[region][department][sp];
      if (Array.isArray(v) && v.length > 0) {
        populatedSP++;
        totalVillages += v.length;
      }
    }
  }
}

console.log(JSON.stringify({
  totalSP,
  populatedSP,
  totalVillages,
  percentage: ((populatedSP / totalSP) * 100).toFixed(2) + '%'
}));
