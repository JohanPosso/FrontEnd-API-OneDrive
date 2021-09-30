
function odauth(wasClicked) {
  ensureHttps();
  var token = getTokenFromCookie();
  if (token) {
    onAuthenticated(token);
  }
  else if (wasClicked) {
    challengeForAuth();
  }
  else {
    showLoginButton();
  }
}


function ensureHttps() {
  if (window.location.protocol != "https:" && window.location.protocol != "file:" && window.location.hostname != "localhost") {
    window.location.href = "https:" + window.location.href.substring(window.location.protocol.length);
  }
}

function onAuthCallback() {
  var authInfo = getAuthInfoFromUrl();
  var token = authInfo["access_token"];
  var expiry = parseInt(authInfo["expires_in"]);
  if (token)
  {
    setCookie(token, expiry);
    window.opener.onAuthenticated(token, window);
  }
}

function getAuthInfoFromUrl() {
  if (window.location.hash) {
    var authResponse = window.location.hash.substring(1);
    var authInfo = JSON.parse(
      '{' + authResponse.replace(/([^=]+)=([^&]+)&?/g, '"$1":"$2",').slice(0,-1) + '}',
      function(key, value) { return key === "" ? value : decodeURIComponent(value); });
    return authInfo;
  }
  else {
    alert("failed to receive auth token");
  }
}

function getTokenFromCookie() {
  var cookies = document.cookie;
  var name = "odauth=";
  var start = cookies.indexOf(name);
  if (start >= 0) {
    start += name.length;
    var end = cookies.indexOf(';', start);
    if (end < 0) {
      end = cookies.length;
    }
    else {
      postCookie = cookies.substring(end);
    }

    var value = cookies.substring(start, end);
    return value;
  }

  return "";
}

function setCookie(token, expiresInSeconds) {
  var expiration = new Date();
  expiration.setTime(expiration.getTime() + expiresInSeconds * 1000);
  var cookie = "odauth=" + token +"; path=/; expires=" + expiration.toUTCString();

  if (document.location.protocol.toLowerCase() == "https") {
    cookie = cookie + ";secure";
  }

  document.cookie = cookie;
}

function clearCookie()
{
  var expiration = new Date();
  var cookie = "odauth=; path=/; expires=" + expiration.toUTCString();
  document.cookie = cookie;
}

var storedAppInfo = null;

function provideAppInfo(obj)
{
  storedAppInfo = obj;
}

function getAppInfo() {

  if (storedAppInfo)
    return storedAppInfo;

  var scriptTag = document.getElementById("odauth");
  if (!scriptTag) {
    alert("the script tag for odauth.js should have its id set to 'odauth'");
  }

  var clientId = scriptTag.getAttribute("clientId");
  if (!clientId) {
    alert("the odauth script tag needs a clientId attribute set to your application id");
  }

  var scopes = scriptTag.getAttribute("scopes");
  // scopes aren't always required, so we don't warn here.

  var redirectUri = scriptTag.getAttribute("redirectUri");
  if (!redirectUri) {
    alert("the odauth script tag needs a redirectUri attribute set to your redirect landing url");
  }

  var resourceUri = scriptTag.getAttribute("resourceUri");

  var authServiceUri = scriptTag.getAttribute("authServiceUri");
  if (!authServiceUri) {
    alert("the odauth script tag needs an authServiceUri attribtue set to the oauth authentication service url");
  }

  var appInfo = {
    "clientId": clientId,
    "scopes": scopes,
    "redirectUri": redirectUri,
    "resourceUri": resourceUri,
    "authServiceUri": authServiceUri
  };

  storedAppInfo = appinfo;

  return appInfo;
}

function showLoginButton() {
  if (typeof showCustomLoginButton === "function") {
    showCustomLoginButton(true);
    return;
  }

  var loginText = document.createElement('a');
  loginText.href = "#";
  loginText.id = "loginText";
  loginText.onclick = challengeForAuth;
  loginText.innerText = loginText.textContent = "[sign in]";
  document.body.insertBefore(loginText, document.body.children[0]);
}

function removeLoginButton() {
  if (typeof showCustomLoginButton === "function") {
    showCustomLoginButton(false);
    return;
  }

  var loginText = document.getElementById("loginText");
  if (loginText) {
    document.body.removeChild(loginText);
  }
}

function challengeForAuth() {
  var appInfo = getAppInfo();
  var url =
    appInfo.authServiceUri +
    "?client_id=" + appInfo.clientId +
    "&response_type=token" +
    "&redirect_uri=" + encodeURIComponent(appInfo.redirectUri);

    if (appInfo.scopes)
      url = url + "&scope=" + encodeURIComponent(appInfo.scopes);
    if (appInfo.resourceUri)
      url = url + "&resource=" + encodeURIComponent(appInfo.resourceUri);

      console.log(url);

  popup(url);
}

function logoutOfAuth() {
  clearCookie();
  showLoginButton();
}

function popup(url) {
  var width = 525,
      height = 525,
      screenX = window.screenX,
      screenY = window.screenY,
      outerWidth = window.outerWidth,
      outerHeight = window.outerHeight;

  var left = screenX + Math.max(outerWidth - width, 0) / 2;
  var top = screenY + Math.max(outerHeight - height, 0) / 2;

  var features = [
              "width=" + width,
              "height=" + height,
              "top=" + top,
              "left=" + left,
              "status=no",
              "resizable=yes",
              "toolbar=no",
              "menubar=no",
              "scrollbars=yes"];
  var popup = window.open(url, "oauth", features.join(","));
  if (!popup) {
    alert("failed to pop up auth window");
  }

  popup.focus();
}
