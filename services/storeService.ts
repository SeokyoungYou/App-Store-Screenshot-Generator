/**
 * NOTE: This is a MOCK service for demonstration purposes.
 * 
 * Why is this a mock?
 * Real-world web scraping of sites like the Apple App Store or Google Play
 * cannot be done directly from a web browser (client-side). This is because
 * of a security feature called CORS (Cross-Origin Resource Sharing) policy,
 * which prevents a script on one domain from making requests to another.
 * 
 * How would this work in a real application?
 * A production application would have its own server (a backend). The frontend
 * would send the store URL to this backend server. The server, which is not
 * bound by browser CORS policies, would then fetch the store page HTML, parse it
 * (scrape it) to extract the app name, description, and screenshot URLs, and
 * then send that structured data back to the frontend.
 * 
 * What does this mock do?
 * This service simulates that backend process. It checks for a specific, known
 * URL and returns the data that a real scraper would have extracted. For any
 * other URL, it will return an error explaining the limitation of this demo.
 */

export interface AppInfo {
    name: string;
    description: string;
    screenshots: string[];
}

// This is the data that a real scraper would extract for the specified URL.
// We are hardcoding it here to simulate a successful scrape.
const SCRAPED_BJJ_APP_INFO: AppInfo = {
    name: "Post - Black Belt BJJ Journal",
    description: "Post is the ultimate BJJ journal, designed by black belts for practitioners of all levels. Track your training sessions, monitor your progress, and gain valuable insights into your Jiu-Jitsu journey. Log sparring rounds, techniques, submissions, and notes with an intuitive interface. Whether you're a white belt starting out or a seasoned black belt, Post helps you stay consistent and focused on your goals.",
    // These are the actual, high-resolution source URLs from the App Store page.
    screenshots: [
        'https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/30/8a/85/308a8553-61b6-2a62-79f6-318e8b0a373d/App-iPhone-1-6.9-inch-2x.png/643x0w.png',
        'https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/4c/76/97/4c7697c1-a20c-43f9-7170-c75c87158756/App-iPhone-2-6.9-inch-2x.png/643x0w.png',
        'https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/e5/23/bd/e523bd11-8c01-78da-a3b0-965313a52f36/App-iPhone-3-6.9-inch-2x.png/643x0w.png',
        'https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/e3/3c/02/e33c02cb-84e1-2092-d352-7e04b4c7be5a/App-iPhone-4-6.9-inch-2x.png/643x0w.png',
        'https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/b4/46/7c/b4467c9c-0975-4d2b-f1de-8e4ab612e4f0/App-iPhone-5-6.9-inch-2x.png/643x0w.png',
        'https://is1-ssl.mzstatic.com/image/thumb/Purple116/v4/71/34/83/7134832a-7140-5a39-44be-62325bf15340/App-iPhone-6-6.9-inch-2x.png/643x0w.png',
    ]
};

/**
 * Simulates fetching and scraping app information from a given App Store URL.
 * @param url The URL of the app store page.
 * @returns A Promise that resolves with the scraped AppInfo.
 */
export const fetchAppInfoFromUrl = (url: string): Promise<AppInfo> => {
    console.log(`Simulating scraping app info for: ${url}`);
    
    return new Promise((resolve, reject) => {
        // Simulate a network delay for the backend call
        setTimeout(() => {
            if (!url || !url.startsWith('https://apps.apple.com')) {
                return reject(new Error('Please enter a valid Apple App Store URL.'));
            }

            // For this demo, we only "know" how to scrape one specific URL.
            if (url.includes('id1673061463')) {
                // If it matches, return the pre-scraped data.
                resolve(SCRAPED_BJJ_APP_INFO);
            } else {
                // If it's a different URL, explain the limitation.
                reject(new Error("This demo can only fetch info for the BJJ Journal app. A real-world version would require a server-side scraper to support any URL."));
            }
        }, 1500); // 1.5 second delay to feel like a real network request
    });
};