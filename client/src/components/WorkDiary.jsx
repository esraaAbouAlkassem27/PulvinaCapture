import React, { useEffect } from "react";
import { ProgressBar } from "react-bootstrap";
import dayjs from "dayjs";
import isBetweenPlugin from "dayjs/plugin/isBetween";
import { styled } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import {
  Box,
  Card,
  Grid,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import LinearProgress from "@mui/material/LinearProgress";
import ScreenShot from "./ScreenShot";
import axios from "axios";
dayjs.extend(isBetweenPlugin);

const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) => prop !== "isSelected" && prop !== "isHovered",
})(({ theme, isSelected, isHovered, day }) => ({
  borderRadius: 0,
  ...(isSelected && {
    backgroundColor: "#009b37",
    color: theme.palette.primary.contrastText,
    "&:hover, &:focus": {
      backgroundColor: "#009b37",
    },
  }),
  ...(isHovered && {
    backgroundColor: "#009b377d",
    "&:hover, &:focus": {
      backgroundColor: "#009b377d",
    },
  }),
  ...(day.day() === 0 && {
    borderTopLeftRadius: "50%",
    borderBottomLeftRadius: "50%",
  }),
  ...(day.day() === 6 && {
    borderTopRightRadius: "50%",
    borderBottomRightRadius: "50%",
  }),
}));

const isInSameWeek = (dayA, dayB) => {
  if (dayB == null) {
    return false;
  }
  return dayA.isSame(dayB, "week");
};

function Day(props) {
  const { day, selectedDay, hoveredDay, ...other } = props;

  return (
    <CustomPickersDay
      {...other}
      day={day}
      sx={{ px: 2.5 }}
      disableMargin
      selected={false}
      isSelected={isInSameWeek(day, selectedDay)}
      isHovered={isInSameWeek(day, hoveredDay)}
    />
  );
}

const DayContainer = styled("div")({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px",
  borderBottom: "1px solid #ddd",
  cursor: "pointer",
});

const DayLabel = styled("div")({
  flex: "1",
  fontWeight: "bold",
});

const DayProgress = styled("div")({
  flex: "4",
  margin: "0 16px",
});

const ProgressLabel = styled("div")({
  flex: "1",
  textAlign: "right",
});
function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box sx={{ width: "100%", mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">
          {Math.round(props.value)}%
        </Typography>
      </Box>
    </Box>
  );
}

const WorkDiary = () => {
  const weekDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const progressData = [
    { day: "Sunday", hours: 0, index: 0 },
    { day: "Monday", hours: 0, index: 1 },
    { day: "Tuesday", hours: 0, index: 2 },
    { day: "Wednesday", hours: 0, index: 3 },
    { day: "Thursday", hours: 26, index: 4 },
    { day: "Friday", hours: 0, index: 5 },
    { day: "Saturday", hours: 0, index: 6 },
  ];
  const [hoveredDay, setHoveredDay] = React.useState(null);
  const [value, setValue] = React.useState(dayjs(new Date()));
  const [selectedDayData, setSelectedDayData] = React.useState(null);
  const [selectedFirstDay, setSelectedFirstDay] = React.useState(null);
  const [selectedMonthData, setSelectedMonthData] = React.useState(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [workingHours, setWorkingHours] = React.useState([]);
  const [sinceHours, setSinceHours] = React.useState("");
  const [weekHours, setWeekHours] = React.useState(0);
  console.log("🚀 ~ WorkDiary ~ workingHours:", workingHours);
  const handleDayClick = (dayData) => {
    const selectedDate = value;
    console.log(
      "🚀 ~ handleDayClick ~ selectedDate:",
      selectedDate,
      dayData,
      selectedDate.daysInMonth(),
      value
    );
    const dayName = dayData.day;
    let month = selectedDate.format("MMMM");

    const startOfWeek = value.startOf("week");
    setSelectedFirstDay(startOfWeek);
    const daysInMonth = startOfWeek.daysInMonth();

    let dayNumber = startOfWeek.date() + dayData.index;

    if (dayNumber > daysInMonth) {
      dayNumber = dayNumber - daysInMonth;
    } else {
      month = startOfWeek.format("MMMM");
    }
    setSelectedMonthData(month);

    setSelectedDayData({ ...dayData, dayName, month, dayNumber });
    setDialogOpen(true);
  };

  const moment = require("moment");
  const padZero = (num) => (num < 10 ? `0${num}` : num);
  const formatTime = (time) => {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
  };
  function formatDate(date) {
    const year = date.getFullYear();
    const month = date.toLocaleString("default", { month: "long" });
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  async function fetchWeekData(startDate) {
    console.log("🚀 ~ fetchWeekData ~ startDate:", startDate.startOf("week"));
    const result = [];
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Set to Sunday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Set to Saturday

    console.log(
      "🚀 ~ fetchWeekData ~ weekStart:",
      formatDate(weekStart),
      "weekEnd:",
      formatDate(weekEnd)
    );
    setWeekHours(0);
    // Fetch data for each day in the week
    for (
      let date = new Date(weekStart);
      date <= weekEnd;
      date.setDate(date.getDate() + 1)
    ) {
      const formattedDate = formatDate(date);
      try {
        const response = await axios.get(
          `http://localhost:4001/api/day/:${formattedDate}`
        );
        if (response.data?.hoursTracked)
          setWeekHours(response.data?.hoursTracked + weekHours);
        result.push({
          date: formattedDate,
          hours: Math.floor((response.data?.hoursTracked * 3600000) / 3600000),
          minutes: Math.floor(
            ((response.data?.hoursTracked * 3600000) % 3600000) / 60000
          ),
          seconds: Math.floor(
            ((response.data?.hoursTracked * 3600000) % 60000) / 1000
          ),
        });
        if (response.data?.weekTotalHours) {
          setSinceHours(formatTime(response.data?.weekTotalHours * 3600000));
        }
      } catch (error) {
        console.error(
          `Error fetching data for ${formattedDate}:`,
          error.message
        );
        // Add the date with 0 hours if there's an error
        result.push({
          date: formattedDate,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
      }
    }

    return result;
  }

  // Usage
  useEffect(() => {
    const year = new Date().getFullYear();
    const month = value.format("MMMM"); // July

    fetchWeekData(value)
      .then((data) => setWorkingHours(data))
      .catch((error) => console.error("Error:", error));
  }, []);
  const handleWeekchange = async (newValue) => {
    setWeekHours(0);
    console.log("🚀 ~ WorkDiary ~ newValue:", newValue);
    setWorkingHours(await fetchWeekData(newValue));
    setValue(newValue);
  };
  return (
    <Grid container>
      <Grid item xs={12}>
        <Card
          sx={{
            backgroundColor: "#f9f9f9",
            boxShadow: "none",
            borderRadius: 3,
            p: 4,
            mb: 4,
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          <Box textAlign="center">
            <Typography variant="body1">Last 24 hours</Typography>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              0:00 hrs
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Last worked 2 months ago
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="body1">This week</Typography>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {formatTime(weekHours * 3600000)}
              {console.log("🚀 ~ WorkDiary ~ weekHours:", weekHours)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              of 30 hrs weekly limit
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="body1">Last week</Typography>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              0:00 hrs
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="body1">Since start</Typography>
            <Typography variant="h4" component="div" sx={{ mt: 1 }}>
              {sinceHours}
            </Typography>
          </Box>
        </Card>
      </Grid>
      <Grid item xs={4}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          Work diary
          <DateCalendar
            sx={{
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
            value={value}
            onChange={handleWeekchange}
            showDaysOutsideCurrentMonth
            slots={{ day: Day }}
            slotProps={{
              day: (ownerState) => ({
                selectedDay: value,
                hoveredDay,
                onPointerEnter: () => setHoveredDay(ownerState.day),
                onPointerLeave: () => setHoveredDay(null),
              }),
            }}
          />
        </LocalizationProvider>
      </Grid>
      <Grid item xs={8}>
        {progressData.map((data, index) => (
          <DayContainer key={index} onClick={() => handleDayClick(data)}>
            <DayLabel>{data.day}</DayLabel>
            <DayProgress>
              <LinearProgressWithLabel
                value={
                  (((workingHours.length > 0 && workingHours[index]?.hours) ||
                    0) /
                    4) *
                    100 || 0
                }
                color="success"
                sx={{ height: "10px", borderRadius: "5px" }}
                onClick={() => console.log("clicked")}
              />
            </DayProgress>
            <ProgressLabel>
              {workingHours[index]?.hours || 0}:
              {workingHours[index]?.minutes || 0}:
              {workingHours[index]?.seconds || 0}
            </ProgressLabel>
          </DayContainer>
        ))}
      </Grid>
      <ScreenShot
        selectedDayData={selectedDayData}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
      />
    </Grid>
  );
};

export default WorkDiary;
