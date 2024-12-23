// Use this to setup a development proxy that redirects all calls to /api -> bdc_srv:8090/

const { createProxyMiddleware } = require('http-proxy-middleware');

let SERVER_HOSTNAME = 'host.docker.internal';
if (process.env.SERVER_HOSTNAME != null) {
  SERVER_HOSTNAME = process.env.SERVER_HOSTNAME.toString();
}
console.log('using SERVER_HOSTNAME:',SERVER_HOSTNAME);

const TIMEOUT = 10 * 60 * 1000; // 10 min

module.exports = function(app) {
  
  // that's the route to the backend services that are implemented in the bdc-srv docker service
  app.use(
    '/api',
    createProxyMiddleware({
      target: `http://${SERVER_HOSTNAME}:8090`,
      logLevel: "debug",
      secure: false,
      changeOrigin: false,
      proxyTimeout: TIMEOUT,
      timeout: TIMEOUT,
    })
  );

  // app.use(
  //   '/jenkins',
  //   createProxyMiddleware({
  //     target: `http://${SERVER_HOSTNAME}:9095`,
  //     logLevel: "debug",
  //     secure: false,
  //     changeOrigin: true,
  //     //proxyTimeout: 10 * 60 * 1000,
  //   })
  // );


  // logoff when within GE network
  app.use(
    '/logoff',
    createProxyMiddleware({
      target: `https://ssologin.ssogen2.corporate.ge.com/logoff/logoff.jsp`,
      secure: true,
      changeOrigin: false,
      //proxyTimeout: 15 * 60 * 1000,
    })
  );

  // logoff when using AWS SSO provider
  app.use(
    '/logoff-aws',
    createProxyMiddleware({
      target: `https://affiliateservices.gecompany.com/logoff/logoff.jsp`,
      secure: true,
      changeOrigin: false,
      //proxyTimeout: 15 * 60 * 1000,
    })
  );

  // reads the logged user sso information from the request header and returns as a json body
  // it only returns the sso property as it is readily available 
  app.use('/sso', async (req, res, next) => {
    console.log('req.headers:',req.headers);
    
    let sso = req.headers['x-amzn-oidc-identity'];
    if (sso != null) 
      res.send({sso: sso});
    else 
      res.send({message:'could not resolve sso'});
  });

  // if we need more information as user name, address, etc. we need to retrieve it through an API
  app.use('/userinfo', async (req, res, next) => {
    console.log('req.headers:',req.headers);
    
    // gets access token and passes it in the header as: `Authorization: Bearer <access_token>` to:
    // https://fssfed.ge.com/fss/idp/userinfo.openid
    console.log('autho changes', req.headers['x-amzn-oidc-data'], req, res);
  
    let oidcData = req.headers['x-amzn-oidc-data'];
    if (oidcData != null){
      oidcData = atob(req.headers['x-amzn-oidc-data'])
    }
    console.log('oidcData:',oidcData);
    let token = req.headers['x-amzn-oidc-accesstoken'];
    if (token != null)  {
      console.log('read token:',token);
      const auth = 'Bearer '+ token;
      const requestOptions = {
        method: 'GET',
        headers: { 'Authorization':  auth}
      };

      let userInfoResp = await fetch(`https://fssfed.ge.com/fss/idp/userinfo.openid`, requestOptions);
      let userinfo = await userInfoResp.json();
      console.log('userinfo:',userinfo);
      res.send({userinfo: userinfo});
    } else { 
      res.send({message:'could not resolve userinfo'});
    }
  });

};