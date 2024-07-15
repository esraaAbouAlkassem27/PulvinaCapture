import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MainLayout from "./layouts/MainLayout"; // adjust the import path as needed
import Home from "./pages/Home"; // adjust the import path as needed
import WorkDiary from "./components/WorkDiary"; // adjust the import path as needed
import theme from "./theme"; // adjust the import path as needed

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/timesheet" element={<WorkDiary />} />
            {/* Add other routes here */}
          </Routes>
        </MainLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
