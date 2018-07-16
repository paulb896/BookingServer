const Koa = require('koa');
const Router = require('koa-router');
const axios = require('axios');
// const session = require('koa-session');
const session  = require('koa-generic-session')
const redisStore = require('koa-redis');
const redis = require("redis");
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

router.get('/company/:id', async (ctx, next) => {
    const userId = 1;
    const companyId = 1;
    const companyCacheKey = `user-${userId}-company-${companyId}`;

    await new Promise( async (resolve, reject) => {
        redisClient.get(companyCacheKey, async (err, companyData) => {
            if (err || !companyData) {
                let fullCompany = {message: 'no data'};
                const user = axios(`http://localhost:4000/users/${userId}`);
                const booking = axios(`http://localhost:4000/bookings?company=${companyId}`);

                Promise.all([user, booking]).then((responses) => {
                    fullCompany = {
                        user: responses[0].data,
                        bookings: responses[1].data,
                    };
                    ctx.body = fullCompany;
                    redisClient.set(companyCacheKey, JSON.stringify(fullCompany));
                    resolve();
                })
            } else {
                ctx.body = JSON.parse(companyData);
                resolve();
            }
        });
    });

    redisClient.incr('totalViews');
})

// Setup Router
app
  .use(router.routes())
  .use(router.allowedMethods());

// Set CORS HEADERS
app.use(function *(){
    this.set('Access-Control-Allow-Origin', '*');
    this.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
});

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
