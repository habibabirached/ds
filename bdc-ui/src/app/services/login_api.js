import { BASE_URL } from './api_config';

export const isUserInDL = async (inputSSO) => {
    console.log("SSO of user trying to log in", inputSSO);
    let data = {}; //blank object initialized to hold user data
    let res = null; //boolean variable to return if user is present in DL or not
    try {
        data = await fetch(`${BASE_URL}/idmcheck/${inputSSO}`);
        console.log("Logged in user details", data);
        res = data?.ok;
        console.log("Is logged in user valid ?", res);
    } catch (e) {
        console.log('Error:', e);
    }
    return res;
}

export const isUserLoggedIn = (inputSSO) => {
    console.log("sso check = ", inputSSO);

    let bRes = (false);
    try {
        if (localStorage.getItem("loggedSSO") != null && localStorage.getItem("loggedSSO") !== '' 
        && localStorage.getItem("loggedSSO") === inputSSO){
            bRes = (true);
            console.log("user is part of localstorage");
        } else {
            console.log("user is not part of localstorage");
        }
    } catch (e) {
    }

    return bRes;
}


const promiseWrapper = (inputSSO) => {
    isUserInDL(inputSSO).then((res) => {
        console.log(" ...... ",res);
        return res;
    });
    return null;
};

export const logInUser = (inputSSO) => {
    let result = false;

    let promiseResult = isUserInDL(inputSSO).then((res) => {
        console.log("Promise Result ----- ",res);
        if (res) {
            console.log('Setting user to local storage>>>');
            localStorage.setItem("loggedSSO", inputSSO);
        } else {
            console.log("Un-authorized user SSO", inputSSO);
        }
        return res;
    });
}

export const logOutUser = async (inputSSO) => {
    let bRes = false;
    console.log("logOutUser is called ");
    if (localStorage.getItem("loggedSSO") !== '') {
        localStorage.removeItem("loggedSSO");
        localStorage.clear();
        console.log("remove item from localStorage");
        // const logoutResp = await fetch(`${BASE_URL}/logoff`);
        // console.log('logoutResp:',logoutResp);
        bRes = true;
        window.location.href = `${BASE_URL}/logoff`;
        // window.location.href = 'https://ssologin.ssogen2.corporate.ge.com/logoff/logoff.jsp?referrer=https://digitalhealthrecord-dbc.gevernova.net/';

    }
    return bRes;
}

export const getCurrentUser = () => {
    return localStorage.getItem("loggedSSO");
}

export const loginUserInfo = async (req, res, next) => {

    //let logoutResp = await fetch('/userinfo');
    console.log('Header info ', req, res);
    

}