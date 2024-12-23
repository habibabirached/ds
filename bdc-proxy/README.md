# bdc-proxy

It is the HTTPS/OIDC/Reverse proxy front-end for the app.

It is implemented entirely in Node.js using express, express-openid-connect and express-proxy-middleware
This component should be used together with bdc-src and bdc-ui

## Configuration

The PROD configuration is in the file config_prod.json and it is loaded by default by Dockerfile
the DEV (localhost) configuration is in the file config_dev.json and is loaded mounting that file on top of config.json file of the container

e.g. RenInspect product config file:

```
{
    "WS_URL": "http://reninspect.ren.apps.ge.com:8443",
    "API_URL": "http://reninspect.ren.apps.ge.com:8443",
    "UI_URL": "http://reninspect.ren.apps.ge.com:3000",
    "BASE_URL": "https://reninspect.ren.apps.ge.com"
}
```
BASE_URL hostname should match the one registered in the /CSR certificates

## Building

It can be built individually with the script in docker-build.sh
It is built & deployed together with backend and new ui by docker-compose-aws.yml and docker-compose-dev.yml

## Reading Logged User SSO

The proxy will run on ports 80 (http) and 443 (https). It actually redirects all traffic from 80 to 443.
Your app api and app ws routes should be well defined in the config file as previously defined.

The proxy has a special route called /sso. You can call from it within your app (which was loaded through the proxy), and it will return the sso of the person logged in. e.g.

```
fetch('/sso')
  .then(response => response.json() // user sso )
  .then(data => console.log(data));
```