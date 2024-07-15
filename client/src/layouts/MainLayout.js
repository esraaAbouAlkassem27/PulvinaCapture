import React from "react";
import {
  Container,
  CssBaseline,
  Box,
  Typography,
  AppBar,
  Toolbar,
  Avatar,
  Tabs,
  Tab,
  Button,
  Paper,
  Card,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    navigate(newValue);
  };

  return (
    <Box>
      <CssBaseline />
      <Card
        position="static"
        sx={{
          backgroundColor: "#004d40",
          width: "80%",
          borderRadius: "3",
          ml: "auto",
          mr: "auto",
          mt: 4,
          p: 2,
        }}
      >
        <Toolbar>
          <Typography variant="h4" sx={{ flexGrow: 1, color: "white" }}>
            Developer
          </Typography>
          <Avatar src="profile-pic-url" alt="Profile Picture" />
          <Box sx={{ ml: 2 }}>
            <Typography variant="body1">NAME</Typography>
            <Typography variant="body2" color="textSecondary">
              Country Name
            </Typography>
          </Box>
        </Toolbar>
        <Box>
          <Tabs
            value={location.pathname}
            onChange={handleTabChange}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{
              "& .MuiTabs-indicator": {
                backgroundColor: "#95df00",
              },
              "& .MuiTab-root": {
                color: "#95df00",
                fontFamily: "Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: "bold",
                textTransform: "capitalize",
                "&.Mui-selected": {
                  color: "#95df00",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  textTransform: "capitalize",
                },
              },
            }}
          >
            <Tab label="Overview" value="/" />
            <Tab label="Timesheet" value="/timesheet" />
          </Tabs>
        </Box>
      </Card>
      <Container component="main" sx={{ mt: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

export default MainLayout;
