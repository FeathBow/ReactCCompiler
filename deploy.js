const ghpages = require('gh-pages');

function formatDate(date) {
    const padZero = (num) => num.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = padZero(date.getMonth() + 1);
    const day = padZero(date.getDate());
    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());
    const seconds = padZero(date.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const now = new Date();
const timestamp = formatDate(now);
const commitMessage = `build: deploy to gh-pages at ${timestamp}`;

ghpages.publish(
    'dist',
    {
        branch: 'gh-pages',
        message: commitMessage,
    },
    (err) => {
        if (err) {
            console.error('Deployment failed:', err);
        } else {
            console.log('Deployment successful!');
        }
    },
);
