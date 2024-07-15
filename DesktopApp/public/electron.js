const {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  screen,
} = require("electron");
const path = require("path");
const fs = require("fs");
const log = require("electron-log");
const { GlobalKeyboardListener } = require("node-global-key-listener");
const player = require("node-wav-player");
const axios = require("axios");

let mainWindow;
let isTracking = false;
let mouseMovements = [];
let keyPresses = [];
let screenshotInterval;
let mouseCaptureInterval;
let keyboardListener;
let trackingStartTime;

const KEY_REPEAT_THRESHOLD = 250;
let lastKey = "";
let lastKeyTime = 0;

async function createWindow() {
  const { default: isDev } = await import("electron-is-dev");
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    backgroundColor: "#FFFFFF",
  });

  const startUrl = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../build/index.html")}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function takeScreenshot() {
  try {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;

    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width, height },
    });

    const screenshot = await sources[0].thumbnail.toPNG();
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const screenshotsDir = path.join(__dirname, "../images");
    const screenshotPath = path.join(
      screenshotsDir,
      `screenshot-${timestamp}.png`
    );

    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir);
    }

    fs.writeFileSync(screenshotPath, screenshot);

    return screenshotPath;
  } catch (error) {
    log.error("Error capturing screenshot:", error);
    throw error;
  }
}

function startTracking() {
  isTracking = true;
  trackingStartTime = Date.now();

  screenshotInterval = setInterval(async () => {
    try {
      if (isTracking) {
        await player.play({
          path: path.join(__dirname, "../public/screenshot.wav"),
        });
      }
      const screenshotPath = await takeScreenshot();

      // Reset arrays for new capture session
      mouseMovements = [];
      keyPresses = [];

      // Capture mouse movements and key presses
      let captureCount = 0;
      keyboardListener = new GlobalKeyboardListener();
      keyboardListener.addListener(function (e, down) {
        if (down && keyPresses.length < 6) {
          const currentTime = Date.now();
          if (
            e.name !== lastKey ||
            currentTime - lastKeyTime > KEY_REPEAT_THRESHOLD
          ) {
            keyPresses.push({ key: e.name, time: currentTime });
            lastKey = e.name;
            lastKeyTime = currentTime;
          }
        }
      });

      mouseCaptureInterval = setInterval(() => {
        if (captureCount < 5) {
          const mousePosition = screen.getCursorScreenPoint();
          mouseMovements.push({
            x: mousePosition.x,
            y: mousePosition.y,
            time: Date.now(),
          });
          captureCount++;
        } else {
          clearInterval(mouseCaptureInterval);

          // Save data after capturing mouse movements and key presses
          const data = {
            screenshotPath,
            mouseMovements,
            keyPresses,
            timestamp: Date.now(),
          };

          fs.writeFileSync(
            path.join(__dirname, `../data/data-${data.timestamp}.json`),
            JSON.stringify(data)
          );

          mainWindow.webContents.send("take-screenshot", data);

          log.info(
            `Captured screenshot, mouse movements, and key presses at ${new Date().toLocaleString()}`
          );

          // Reset for next capture
          keyPresses = [];
          mouseMovements = [];

          if (keyboardListener) {
            keyboardListener.kill();
            keyboardListener = null;
          }
        }
      }, 1000);
    } catch (error) {
      log.error("Error capturing data:", error);
    }
  }, 60 * 10 * 1000); // 10 minutes
}

async function stopTracking() {
  isTracking = false;
  clearInterval(screenshotInterval);
  clearInterval(mouseCaptureInterval);
  mainWindow.webContents.removeAllListeners("before-input-event");
  mainWindow.webContents.removeAllListeners("cursor-changed");
  mainWindow.webContents.removeAllListeners("before-input-event");
  mainWindow.webContents.removeAllListeners("cursor-changed");

  if (keyboardListener) {
    keyboardListener.kill();
    keyboardListener = null;
  }

  const trackingEndTime = Date.now();
  const sessionDuration = trackingEndTime - trackingStartTime;

  try {
    // const response = await axios.post(
    //   "http://localhost:4000/update-tracked-time",
    //   {
    //     trackedTime: sessionDuration,
    //   }
    // );
    // log.info(
    //   `Updated tracked time. Server response: ${JSON.stringify(response.data)}`
    // );
  } catch (error) {
    log.error("Error updating tracked time:", error);
  }
}

app.on("ready", () => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle("take-screenshot", async () => {
  return await takeScreenshot();
});

ipcMain.on("start-tracking", () => {
  startTracking();
});

ipcMain.on("stop-tracking", () => {
  stopTracking();
});

ipcMain.on("log-message", (event, message) => {
  log.info(message);
});

app.on("will-quit", () => {
  if (keyboardListener) {
    keyboardListener.kill();
    stopTracking();
  }
});

ipcMain.handle("read-screenshot", async (event, screenshotPath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(screenshotPath, (err, data) => {
      if (err) {
        console.error("Error reading screenshot:", err);
        reject(err);
      } else {
        resolve(data.toString("base64"));
      }
    });
  });
});
