const co = require('co');
const fs = require('fs');
const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');

const url = 'https://www.apple.com/news/';
const delay = 1000;
const fullPage = true;
const viewportWidth = 1440;
const viewportHeight = 900;

function* launchChrome() {
  return yield chromeLauncher.launch({
    chromeFlags: [`--window-size=${viewportWidth},${viewportHeight}`, '--headless', '--disable-gpu']
  }).then(chrome => {
    console.log(`Chrome debugging port running on ${chrome.port}`);
    return chrome;
  });
}

function* getClient(chrome) {
  return yield CDP({
    port: chrome.port,
  }).catch(err => console.log(err));
}

function* getScreenShot(client, chrome) {
  const {Emulation, Page, DOM} = client;
  const deviceMetrics = {
    width: viewportWidth,
    height: viewportHeight,
    deviceScaleFactor: 0,
    mobile: false,
    fitWindow: false,
  };

  yield Page.enable();
  yield DOM.enable();
  yield Page.navigate({url});
  console.log('Waiting for page loading..');
  
  Page.loadEventFired(co.wrap(function* () {
    if (fullPage) {
      const {root: {nodeId: documentNodeId}} = yield DOM.getDocument();
      const {nodeId: bodyNodeId} = yield DOM.querySelector({
        selector: 'body',
        nodeId: documentNodeId,
      });
      const {model: {height}} = yield DOM.getBoxModel({nodeId: bodyNodeId});
      deviceMetrics.height = height;
    }
    yield Emulation.setDeviceMetricsOverride(deviceMetrics);

    yield sleep(delay);
    const screenShot = yield Page.captureScreenshot({ format: 'jpeg' });
    const buffer = new Buffer(screenShot.data, 'base64');
    fs.writeFile('output.png', buffer, 'base64', function(err) {
      if (err) {
        console.error(err);
      } else {
        console.log('Screenshot saved');
      }
      client.close();
      chrome.kill();
      process.exit();
    });
  }));
}

function sleep(time) {
  return new Promise(function (resolve) {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

function* main() {
  const chrome = yield launchChrome();
  
  const client = yield getClient(chrome);
  yield getScreenShot(client, chrome);
}

co(main());
