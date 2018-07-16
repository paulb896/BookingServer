/**
 * Appointment Booking Server that uses Koa2
 */

const config = require('config');
const Koa = require('koa');
const koaBody = require('koa-body');
const Router = require('koa-router');
const axios = require('axios');
const session  = require('koa-generic-session')
const redisStore = require('koa-redis');
const redis = require('redis');

// Initialize Database
const remoteDbUrl = config.has('remoteDbUrl') ? config.get('remoteDbUrl') : 'http://localhost:4000';
const dbPort = config.has('dbPort') ? config.get('dbPort') : 6379;
const dbHost = config.has('dbHost') ? config.get('dbHost') : 'localhost';
const redisClient = redis.createClient(dbPort, dbHost);

// Initialize App and router
const port = config.get('bookingServerPort') ? config.get('bookingServerPort') : 3000;
const app = new Koa();
const router = new Router();
const storage = redisStore({
    url: `redis://${dbHost}:${dbPort}`
});
app.keys = ['keys-this-is-a-test', 'keykeys'];
app.use(session({
    store: storage
}, app));
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(port);
app.use(koaBody());

/**
 * Set CORS Headers.
 */
app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    await next();
});

/**
 * Public View counter endpoint that counts view for all users total,
 * and for the current user in their session.
 */
router.get('/view-counter', async (ctx, next) => {
    let userSpecificViews = ctx.session.userSpecificViews || 0;

    await next();
    ctx.session.userSpecificViews = ++userSpecificViews;
    ctx.body = {message: 'No data'};
    await new Promise((resolve, reject) => {
        redisClient.get('totalViews', (err, totalViews) => {
            if (err) {
                totalViews = -1;
            }
            ctx.body = {
                message: `Booking API View Counter, user views: ${userSpecificViews}, shared total: ${totalViews}`
            };
            resolve();
        });
    })

    redisClient.incr('totalViews');
});

/**
 * Get Company Booking Endpoint that returns company details
 * and all bookings for that company.
 */
router.get('/company/:id', async (ctx, next) => {
    const companyId = ctx.params.id;
    const companyCacheKey = `company-${companyId}`;

    await next();
    await new Promise((resolve, reject) => {
        redisClient.get(companyCacheKey, (err, companyData) => {
            if (err || !companyData) {
                let fullCompany = {message: 'no data'};
                const company = axios(`${remoteDbUrl}/companies/${companyId}`);
                const booking = axios(`${remoteDbUrl}/bookings?company=${companyId}`);

                Promise.all([company, booking]).then((responses) => {
                    if (responses.length === 2) {
                        fullCompany = {
                            company: responses[0].data,
                            bookings: responses[1].data,
                        };
                        ctx.body = fullCompany;
                        redisClient.set(companyCacheKey, JSON.stringify(fullCompany));
                        resolve();
                    } else {
                        reject();
                    }
                }).catch(error => reject(error))
            } else {
                ctx.body = JSON.parse(companyData);
                resolve();
            }
        });
    }).catch(error => {
        // TODO: Log debug message
    })

    redisClient.incr('totalViews');
})

/**
 * Add a company.
 */
router.post('/company', koaBody(), async (ctx, next) => {
    await axios({
        method: 'post',
        url: `${remoteDbUrl}/companies`,
        data: {
            name: ctx.request.body.name
        }
    }).then(result => {

    })
});

/**
 * Catch uncaught application errors and set error message in error response.
 */
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = err.message;
        ctx.app.emit('error', err, ctx);
    }
});

/**
 * Absolute Error Fallback.
 */
app.on('error', (err, ctx) => {
    console.log('There was an error', err);
});
