// This script is disabled because the application is now using local mock data.
// No migration is necessary.

function main() {
    console.log("Data migration is disabled. The app uses local mock data from /src/lib/data.ts.");
    console.log("To re-enable Firestore, update the service files in /src/services to fetch data from Firestore instead of local arrays.");
}

main();
