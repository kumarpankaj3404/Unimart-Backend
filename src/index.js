import dotenv from "dotenv";
import http from "http";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { initSocket } from "./sockets/index.js";

dotenv.config({
  path: "../.env"
});

const PORT = process.env.PORT || 8000;


const server = http.createServer(app);


const io = initSocket(server);


app.set("io", io);


connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
  });
