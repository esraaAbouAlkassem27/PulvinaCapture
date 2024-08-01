import React, { useState, useEffect } from "react";
import {
  Grid,
  Container,
  Typography,
  IconButton,
  Divider,
  Box,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import Switch from "@mui/material/Switch";
import { styled } from "@mui/material/styles";
import FormControlLabel from "@mui/material/FormControlLabel";
import axios from "axios";
const path = require("path");
const os = window.require("os");

const { ipcRenderer } = window.require("electron");
const hostname = os.hostname();
const IOSSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: 0,
    margin: 2,
    transitionDuration: "300ms",
    "&.Mui-checked": {
      transform: "translateX(16px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        backgroundColor: theme.palette.mode === "dark" ? "#2ECA45" : "#65C466",
        opacity: 1,
        border: 0,
      },
      "&.Mui-disabled + .MuiSwitch-track": {
        opacity: 0.5,
      },
    },
    "&.Mui-focusVisible .MuiSwitch-thumb": {
      color: "#33cf4d",
      border: "6px solid #fff",
    },
    "&.Mui-disabled .MuiSwitch-thumb": {
      color:
        theme.palette.mode === "light"
          ? theme.palette.grey[100]
          : theme.palette.grey[600],
    },
    "&.Mui-disabled + .MuiSwitch-track": {
      opacity: theme.palette.mode === "light" ? 0.7 : 0.3,
    },
  },
  "& .MuiSwitch-thumb": {
    boxSizing: "border-box",
    width: 22,
    height: 22,
  },
  "& .MuiSwitch-track": {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.mode === "light" ? "#E9E9EA" : "#39393D",
    opacity: 1,
    transition: theme.transitions.create(["background-color"], {
      duration: 500,
    }),
  },
}));

function App() {
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [lastScreenshotID, setLastScreenshotID] = useState("");
  const [status, setStatus] = useState("Stopped");
  const [logMessages, setLogMessages] = useState([]);
  const [isToggled, setIsToggled] = useState(false);
  const [lastScreenshot, setLastScreenshot] = useState(null);
  const [screenshotTimestamp, setScreenshotTimestamp] = useState(Date.now());
  const [mouseMovements, setMouseMovements] = useState([]);
  const [keyPresses, setKeyPresses] = useState([]);
  const [showDeleteIcon, setShowDeleteIcon] = useState(false);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const [weeklyTrackedTime, setWeeklyTrackedTime] = useState(0);
  const [lastTrackedTime, setLastTrackedTime] = useState(0);

  useEffect(() => {
    return () => clearInterval(intervalId);
  }, [intervalId]);
  const fetchWeeklyTrackedTime = async () => {
    try {
      const weeklyResponse = await axios.get(
        "http://70.82.4.42:4000/get-weekly-tracked-time",
        { params: { hostname } }
      );
      const lastTrackedResponse = await axios.get(
        "http://70.82.4.42:4000/get-last-tracked-time",
        { params: { hostname } }
      );

      logMessage(
        `Fetched weekly tracked time: ${weeklyResponse.data.weeklyTrackedTime} ${weeklyResponse.data.lastTrackedTime}`
      );
      setWeeklyTrackedTime(weeklyResponse.data.weeklyTrackedTime);
      setLastTrackedTime(lastTrackedResponse.data.lastTrackedTime);
    } catch (error) {
      console.error("Error fetching tracked times:", error);
      setWeeklyTrackedTime(0);
      setLastTrackedTime(0);
    }
  };

  useEffect(() => {
    fetchWeeklyTrackedTime();
  }, []);
  const startTracking = async () => {
    await fetchWeeklyTrackedTime();
    const startTime = Date.now();
    const initialWeeklyTime = weeklyTrackedTime;
    const initialTime = weeklyTrackedTime;

    const id = setInterval(() => {
      const now = Date.now();
      const elapsedTime = now - startTime;
      setTimer(initialTime + elapsedTime);
    }, 1000);

    setIntervalId(id);
    setStatus("Tracking");
    logMessage(`Tracking started at ${new Date().toLocaleString()}`);

    setTrackingStartTime(startTime);
    ipcRenderer.send("start-tracking");

    ipcRenderer.on("take-screenshot", async (event, data) => {
      logMessage(
        `Received screenshot at ${new Date().toLocaleString()}: ${
          data.screenshotPath
        }`
      );
      setMouseMovements(data.mouseMovements);
      setKeyPresses(data.keyPresses);
      const screenshotBuffer = await readFileAsBuffer(data.screenshotPath);
      setLastScreenshot(screenshotBuffer);
      setScreenshotTimestamp(data.timestamp);
      logMessage(
        `Tracking stopped. Mouse movements: ${data.mouseMovements.length}, Key presses: ${data.keyPresses.length}`
      );
      uploadScreenshot(
        data.screenshotPath,
        data.mouseMovements,
        data.keyPresses,
        data.timestamp,
        data.hostname
      );
      setShowDeleteIcon(true);
      setTimeout(() => {
        setShowDeleteIcon(false);
      }, 10000);
    });
  };

  const stopTracking = async () => {
    clearInterval(intervalId);
    setStatus("Stopped");
    const trackingEndTime = Date.now();
    const sessionDuration = timer - lastTrackedTime;

    try {
      logMessage(`Tracking stopped at weekly tracked time: ${timer}`);
      const response = await axios.post(
        "http://70.82.4.42:4000/update-tracked-time",
        {
          trackedTime: sessionDuration,
          hostname: hostname,
        }
      );
      const newWeeklyTotal = response.data.totalHoursThisWeek * 3600000; // Convert hours to milliseconds
      setWeeklyTrackedTime(newWeeklyTotal);
      setTimer(newWeeklyTotal); // Set timer to the new weekly total
      logMessage(
        `Tracking stopped. Total time this week: ${formatTime(newWeeklyTotal)}`
      );
    } catch (error) {
      console.error("Error updating tracked time:", error);
    }

    logMessage(`Tracking trackingStartTime at ${trackingStartTime}`);
    logMessage(`Tracking trackingEndTime at ${trackingEndTime}`);
    logMessage(`Tracking session duration: ${formatTime(sessionDuration)}`);
    ipcRenderer.send("stop-tracking", {
      startTime: trackingStartTime,
      endTime: trackingEndTime,
    });
    setTrackingStartTime(null);
  };

  const handleToggle = () => {
    setIsToggled(!isToggled);
    if (!isToggled) {
      startTracking();
    } else {
      stopTracking();
    }
  };

  const logMessage = (message) => {
    try {
      const updatedLogs = [
        ...logMessages,
        `[${new Date().toISOString()}] ${message}`,
      ];
      setLogMessages(updatedLogs);
      ipcRenderer.send("log-message", updatedLogs);
    } catch (error) {
      ipcRenderer.send(
        "log-message",
        `ErrorsESRAAAAAAAAAAA: ${error.message}` + error
      );
      console.log("🚀 ~ logMessage ~ error:", error);
    }
  };

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
  };

  const uploadScreenshot = async (
    screenshotPath,
    movements,
    keyPresses,
    screenshotTimestamp,
    hostname
  ) => {
    try {
      const base64Image = await ipcRenderer.invoke(
        "read-screenshot",
        screenshotPath
      );
      const formData = new FormData();
      const byteCharacters = atob(base64Image);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      const screenshotTimestampServer = new Date();
      formData.append("screenshot", blob, path.basename(screenshotPath));

      formData.append("mouseMovements", JSON.stringify(movements));
      formData.append("keyPresses", JSON.stringify(keyPresses));
      formData.append("timestamp", screenshotTimestampServer);
      formData.append("hostname", hostname);
      logMessage(
        `Uploading screenshot at ${screenshotTimestampServer} tttttt:${new Date(
          screenshotTimestamp
        ).toLocaleString()}`
      );
      const response = await axios.post(
        "http://70.82.4.42:4000/upload-screenshot",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      logMessage(response.data);
      setLastScreenshotID(response.data.lastScreenshotID);
      console.log("Screenshot uploaded successfully");
    } catch (error) {
      logMessage(error);
      console.error("Error uploading screenshot:", error);
    }
  };

  const padZero = (num) => (num < 10 ? `0${num}` : num);

  const readFileAsBuffer = async (filePath) => {
    const fs = window.require("fs").promises;
    const buffer = await fs.readFile(filePath);
    return buffer;
  };
  const deleteScreenshot = async (id) => {
    try {
      const response = await axios.delete(
        `http://70.82.4.42:4000/delete-screenshot/${id}`,
        { params: { hostname } }
      );

      logMessage(response.data);
      setLastScreenshot(response.data.lastScreenshot.screenshot);
      setLastScreenshotID(response.data.lastScreenshot._id);
      setScreenshotTimestamp(response.data.lastScreenshot.timestamp);
      logMessage("Screenshot deleted successfully");
    } catch (error) {
      console.error("Error deleting screenshot:", error);
    }
  };
  const timeDifferenceInMinutes = (currentTimestamp, screenshotTimestamp) => {
    const diffInMillis = currentTimestamp - screenshotTimestamp;
    return Math.floor(diffInMillis / (1000 * 60));
  };

  return (
    <Container sx={{ textAlign: "center" }}>
      <Grid container spacing={1}>
        <Grid item xs={10}>
          <TextField
            variant="outlined"
            placeholder="Search contracts"
            InputProps={{
              startAdornment: (
                <IconButton>
                  <SearchIcon />
                </IconButton>
              ),
            }}
            sx={{ marginBottom: 2 }}
            fullWidth
          />
        </Grid>
        <Grid item xs={2}>
          <IconButton
            sx={{
              border: "2px solid",
              borderColor: "#072b35",
              borderRadius: "21px",
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Grid>
        <Grid
          item
          xs={12}
          container
          justifyContent="flex-end"
          alignItems="center"
        >
          <FormControlLabel
            control={
              <IOSSwitch
                checked={isToggled}
                onChange={handleToggle}
                sx={{ m: 1 }}
              />
            }
            label={status === "Tracking" ? "Stop Tracking" : "Start Tracking "}
          />
          <Typography variant="body1" sx={{ m: 1 }}>
            {formatTime(timer)}
          </Typography>
        </Grid>
      </Grid>

      <Divider sx={{ marginY: 2, width: "100%" }} />

      {lastScreenshot && (
        <Box sx={{ textAlign: "center", marginY: 2 }}>
          <Box sx={{ position: "relative", display: "inline-block" }}>
            {showDeleteIcon &&
              timeDifferenceInMinutes(Date.now(), screenshotTimestamp) < 5 && (
                <IconButton
                  aria-label="delete"
                  sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    backgroundColor: "white",
                    "&:hover": {
                      backgroundColor: "white",
                    },
                  }}
                  onClick={() => deleteScreenshot(lastScreenshotID)}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            <img
              src={`data:image/png;base64,${Buffer.from(
                lastScreenshot
              ).toString("base64")}`}
              alt="Last Screenshot"
              style={{ maxWidth: "100%" }}
            />
          </Box>
        </Box>
      )}
    </Container>
  );
}

export default App;
