import React from "react";
import { CssBaseline, Box, Typography, Toolbar, Card } from "@mui/material";
const ContractInfo = () => {
  return (
    <Box>
      <CssBaseline />
      <Card
        position="static"
        sx={{
          backgroundColor: "#f9f9f9",
          borderRadius: "3",
          ml: "auto",
          mr: "auto",
          mt: 4,
          p: 2,
        }}
      >
        <Toolbar>
          <Typography variant="h4" sx={{ flexGrow: 1, color: "white" }}>
            Earnings this week
          </Typography>
          <Box sx={{ ml: 2 }}>
            <Typography variant="body1">NAME</Typography>
            <Typography variant="body2" color="textSecondary">
              Country Name
            </Typography>
          </Box>
        </Toolbar>
      </Card>
    </Box>
  );
};

export default ContractInfo;
