import { Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import axios from "axios";
import { Modal, Box } from "@mui/material";
const ScreenShot = ({ selectedDayData, dialogOpen, setDialogOpen }) => {
  console.log("🚀 ~ ScreenShot ~ selectedDayData:", selectedDayData);
  const [documents, setDocuments] = useState([]);
  const [hours, sethours] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  console.log("🚀 ~ ScreenShot ~ documents:", documents, hours);
  const padZero = (num) => (num < 10 ? `0${num}` : num);
  const formatTime = (time) => {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
  };
  const handleOpenModal = (image) => {
    setSelectedImage(image);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedImage(null);
  };
  useEffect(() => {
    if (dialogOpen === true) {
      const fetchDocuments = async () => {
        try {
          const response = await axios.get(
            "http://localhost:4001/api/screenshots",
            {
              params: {
                date: `2024-${selectedDayData?.month}-${selectedDayData?.dayNumber}`,
              },
            }
          );
          console.log("🚀 ~ fetchDocuments ~ response.data:", response.data);
          setDocuments(response.data);
        } catch (error) {
          console.error("Error fetching documents:", error);
        }
      };
      const fetchHours = async () => {
        try {
          let day = `${new Date().getFullYear()}-${selectedDayData?.month}-${
            selectedDayData?.dayNumber
          }`;
          const response = await axios.get(
            `http://localhost:4001/api/day/:${day}`
          );
          console.log(
            "🚀 ~ fetchDocuments ~ response.data:",
            response.data.hoursTracked * 3600000
          );
          sethours(formatTime(response.data.hoursTracked * 3600000));
        } catch (error) {
          console.error("Error fetching documents:", error);
        }
      };

      fetchDocuments();
      fetchHours();
    }
  }, [dialogOpen]);
  const processArrayMouse = (data) => {
    let result = [];

    for (let i = 0; i < data.length; i++) {
      let isUnique = true;
      for (let j = 0; j < data.length; j++) {
        if (i !== j && data[i].x === data[j].x && data[i].y === data[j].y) {
          isUnique = false;
          break;
        }
      }
      result.push(isUnique ? 1 : 0);
    }
    result = result.sort((a, b) => b - a);

    return result;
  };
  const processArrayKeyboard = (data) => {
    let result = [];

    for (let i = 0; i < data.length; i++) {
      let isUnique = true;
      for (let j = 0; j < data.length; j++) {
        if (
          i !== j &&
          data[i].key === data[j].key &&
          data[i].key === data[j].key
        ) {
          isUnique = false;
          break;
        }
      }
      result.push(isUnique ? 1 : 0);
    }
    result = result.sort((a, b) => b - a);
    const finalResult = [...result.slice(0, 5), ...Array(5).fill(0)].slice(
      0,
      5
    );
    return finalResult;
  };
  function extractTime(timestamp) {
    const date = new Date(timestamp);
    return date.toTimeString().split(" ")[0];
  }
  return (
    <Dialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle>
        {selectedDayData?.day} {selectedDayData?.dayNumber}{" "}
        {selectedDayData?.month}
      </DialogTitle>
      <DialogContent>
        {selectedDayData && (
          <div>
            <Typography variant="body1">Hours worked: {hours} hrs</Typography>
          </div>
        )}
        <ImageList sx={{ height: 450, overflow: "auto" }}>
          {documents.length > 0 &&
            documents.map((item) => (
              <ImageListItem
                key={item.img}
                onClick={() => handleOpenModal(item.screenshot)}
              >
                <img
                  src={
                    item.screenshot &&
                    `data:image/png;base64,${item.screenshot}`
                  }
                  alt="screen"
                  loading="lazy"
                />
                <ImageListItemBar
                  title={
                    <span>
                      mouse
                      {processArrayMouse(item.mouseMovements).map(
                        (item, index) => (
                          <div
                            key={index}
                            style={{
                              display: "inline-block",
                              width: "20px",
                              height: "7px",
                              backgroundColor: item === 1 ? "green" : "grey",
                              margin: "0 2px",
                            }}
                          ></div>
                        )
                      )}
                    </span>
                  }
                  subtitle={
                    <span>
                      keyboard:{" "}
                      {processArrayKeyboard(item.keyPresses).map(
                        (item, index) => (
                          <div
                            key={index}
                            style={{
                              display: "inline-block",
                              width: "20px",
                              height: "7px",
                              backgroundColor: item === 1 ? "green" : "grey",
                              margin: "0 2px",
                            }}
                          ></div>
                        )
                      )}
                      <span style={{ display: "block" }}>
                        timestamp: {extractTime(item.timestamp)}
                      </span>
                    </span>
                  }
                  position="below"
                />
              </ImageListItem>
            ))}
          <Modal
            open={modalOpen}
            onClose={handleCloseModal}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "90%",
                height: "90%",
                bgcolor: "background.paper",
                border: "2px solid #000",
                boxShadow: 24,
                p: 4,
              }}
            >
              {selectedImage && (
                <img
                  src={`data:image/png;base64,${selectedImage}`}
                  alt="Full screen"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              )}
            </Box>
          </Modal>
        </ImageList>
      </DialogContent>
    </Dialog>
  );
};
const itemData = [
  {
    img: "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e",
    title: "Breakfast",
    author: "@bkristastucchio",
  },
  {
    img: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d",
    title: "Burger",
    author: "@rollelflex_graphy726",
  },
  {
    img: "https://images.unsplash.com/photo-1522770179533-24471fcdba45",
    title: "Camera",
    author: "@helloimnik",
  },
  {
    img: "https://images.unsplash.com/photo-1444418776041-9c7e33cc5a9c",
    title: "Coffee",
    author: "@nolanissac",
  },
  {
    img: "https://images.unsplash.com/photo-1533827432537-70133748f5c8",
    title: "Hats",
    author: "@hjrc33",
  },
  {
    img: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62",
    title: "Honey",
    author: "@arwinneil",
  },
  {
    img: "https://images.unsplash.com/photo-1516802273409-68526ee1bdd6",
    title: "Basketball",
    author: "@tjdragotta",
  },
  {
    img: "https://images.unsplash.com/photo-1518756131217-31eb79b20e8f",
    title: "Fern",
    author: "@katie_wasserman",
  },
  {
    img: "https://images.unsplash.com/photo-1597645587822-e99fa5d45d25",
    title: "Mushrooms",
    author: "@silverdalex",
  },
  {
    img: "https://images.unsplash.com/photo-1567306301408-9b74779a11af",
    title: "Tomato basil",
    author: "@shelleypauls",
  },
  {
    img: "https://images.unsplash.com/photo-1471357674240-e1a485acb3e1",
    title: "Sea star",
    author: "@peterlaster",
  },
  {
    img: "https://images.unsplash.com/photo-1589118949245-7d38baf380d6",
    title: "Bike",
    author: "@southside_customs",
  },
];
export default ScreenShot;
