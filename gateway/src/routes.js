const RATING_URL = process.env.RATING_URL || 'http://localhost:8050';
const LIBRARY_URL = process.env.LIBRARY_URL || 'http://localhost:8060';
const RESERVATION_URL = process.env.RESERVATION_URL || 'http://localhost:8070';

const ROUTES = [
    {
        url: '/api/v1/reservations',
        options: {
            target: RESERVATION_URL,
            changeOrigin: true,
            pathRewrite: {'^/api/v1' : ''}
        }
    },
    {
        url: '/api/v1/libraries',
        options: {
            target: LIBRARY_URL,
            changeOrigin: true,
            pathRewrite: {'^/api/v1' : ''}
        }
    },
    {
        url: '/api/v1/books',
        options: {
            target: LIBRARY_URL,
            changeOrigin: true,
            pathRewrite: {'^/api/v1' : ''}
        }
    },
    {
        url: '/api/v1/rating',
        options: {
            target: RATING_URL,
            changeOrigin: true,
            pathRewrite: {'^/api/v1' : ''}
        }
    }
]

module.exports = ROUTES;