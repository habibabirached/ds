const express = require('express');
const { auth } = require('express-openid-connect');
//require('dotenv').config();

const http = require('http');
const https = require('https');
const fs = require('fs');

// certificates produced to the specific server name.
const CREDENTIALS = {
  key: fs.readFileSync('CSR/reninspect.ren.apps.ge.com.key'),
  cert: fs.readFileSync('CSR/reninspect.ren.apps.ge.com.crt')
};


const URL_CONFIG_RAW = fs.readFileSync('./config.json');
const URL_CONFIG = JSON.parse(URL_CONFIG_RAW);
console.log('Using config:',URL_CONFIG);

const OIDC_CONFIG = {
    authRequired: true,
    auth0Logout: true,
    secret: 'sadlfjeoru508gfdjcxoweqiurlasdjf3249712.,xzmnvv/moeeowiru', // completely random string used by the lib
    baseURL: URL_CONFIG.BASE_URL,
    clientID: 'RenInspectTest',
    clientSecret: 'secret',
    clientAuthMethod: 'client_secret_basic',
    issuerBaseURL: 'https://fssfed.stage.ge.com/fss/.well-known/openid-configuration',
    routes: {
        callback: '/redirect_uri'
    },
    authorizationParams: {
        response_type: 'code',
        scope: 'api openid profile',
    }
  };

let useAuthentication = true;
console.log('ENV: process.env.REQUIRE_AUTHENTICATION:',process.env.REQUIRE_AUTHENTICATION)
if (process.env.REQUIRE_AUTHENTICATION) {
  useAuthentication = (process.env.REQUIRE_AUTHENTICATION == 'true');
}  
console.log('requireAuthentication:',useAuthentication);
  

const app = express();
app.enable("trust proxy");

if (useAuthentication) {
  app.use(auth(OIDC_CONFIG));
}


// ========================================= CORS ======================================
const cors = require('cors');
const corsOptions = {
  origin: '*',
  //credentials: true
}
app.use(cors(corsOptions));


// ================================= Redirect to https ==================================
// const redirectToHTTPS = require('express-http-to-https').redirectToHTTPS;
// app.use(redirectToHTTPS());

// ==================================== Regular Routes ==================================

// return the user sso 
app.get('/sso', (req, res) => {
  console.log("In the get SSO ", req, res);
  res.send(JSON.stringify(req.oidc.user.sub));
});


app.get('/userinfo', (req, res) => {
  console.log('Inside UserInfo ', req, res);
  res.send(JSON.stringify(req));
});
// ===================================== Proxy routes ===================================

const { createProxyMiddleware } = require('http-proxy-middleware');

// Options documentation: https://github.com/http-party/node-http-proxy#using-https

const responseHeaders = function onProxyRes(proxyRes, req, res) {
  proxyRes.headers['Access-Control-Allow-Origin'] = '*'; // add new header to response
  //delete proxyRes.headers['x-removed']; // remove header from response
};

const requestHeaders = function onProxyReq(proxyReq, req, res) {
  // add custom header to request
  proxyReq.setHeader('Access-Control-Expose-Headers', '*');
  proxyReq.setHeader('X-Forwarded-Proto', 'https');
  // or log the req
};

app.use('/ws', createProxyMiddleware({
  target: URL_CONFIG.WS_URL,
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
  ws: true, // enable websocket proxy
  logLevel: 'debug',
  xfwd: true,
  //protocolRewrite:'http',
  secure: false,
  onProxyReq: requestHeaders,
  onProxyRes: responseHeaders,
}));

app.use('/api', createProxyMiddleware({
  target: URL_CONFIG.API_URL,
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
  //ws: true, // enable websocket proxy
  logLevel: 'debug',
  xfwd: true,
  //protocolRewrite:'http',
  secure: false,
  onProxyReq: requestHeaders,
  onProxyRes: responseHeaders,
}));

app.use('/', createProxyMiddleware({
  target: URL_CONFIG.UI_URL,
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
  //ws: true, // enable websocket proxy
  logLevel: 'debug',
  xfwd: true,
  //protocolRewrite:'http',
  secure: false,
  onProxyReq: requestHeaders,
  onProxyRes: responseHeaders,
}));



// =======================================================================================
 

//redirect 80 -> 443 
function ensureSecure(req, res, next){
  if(req.headers["x-forwarded-proto"] === "https" || req.secure){
    // OK, continue
    return next();
  };
  // handle port numbers if you need non defaults
  // res.redirect('https://' + req.host + req.url); // express 3.x
  res.redirect('https://' + req.hostname + req.url); // express 4.x
}

const HTTPS_PORT = 443;
const HTTP_PORT = 8080;

if (useAuthentication) {
  // redirects all http calls to https
  app.all('*', ensureSecure);
  
  // https requires a valid certificate
  const httpsServer = https.createServer(CREDENTIALS, app);
  httpsServer.listen(HTTPS_PORT, () => console.log(`listening at https://localhost:${HTTPS_PORT}`));
}

const httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT ,() => console.log(`listening at http://localhost:${HTTP_PORT}`));
