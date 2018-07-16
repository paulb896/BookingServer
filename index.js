const Koa = require('koa');
const Router = require('koa-router');
const axios = require('axios');
const session  = require('koa-generic-session')
const redisStore = require('koa-redis');
const redis = require('redis');
const redisClient = redis.createClient();

// Initialize App and router
const app = new Koa();
const router = new Router();
const storage = redisStore({
    url: 'redis://localhost:6379'
});
app.keys = ['keys-this-is-a-test', 'keykeys'];
app.use(session({
    store: storage
}, app));
app.use(router.routes());
app.use(router.allowedMethods());

// Set CORS HEADERS
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
 * Company Booking Endpoint that returns company details
 * and all bookings for that company.
 */
router.get('/company/:id', async (ctx, next) => {
    const userId = 1;
    const companyId = ctx.params.id;
    const companyCacheKey = `user-${userId}-company-${companyId}`;

    await next();
    await new Promise((resolve, reject) => {
        redisClient.get(companyCacheKey, (err, companyData) => {
            if (err || !companyData) {
                let fullCompany = {message: 'no data'};
                const company = axios(`http://localhost:4000/companies/${companyId}`);
                const booking = axios(`http://localhost:4000/bookings?company=${companyId}`);

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
                })
            } else {
                ctx.body = JSON.parse(companyData);
                resolve();
            }
        });
    })

    redisClient.incr('totalViews');
})

app.listen(3000);
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.status || 500;
        ctx.body = err.message;
        ctx.app.emit('error', err, ctx);
    }
});

app.on('error', (err, ctx) => {
    console.log('There was an error');
});
