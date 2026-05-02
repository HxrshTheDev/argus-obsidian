import express from "express";
import app from "../backend/src/app.js";

const mainApp = express();

// Explicitly use the imported app as middleware
mainApp.use(app);

export default mainApp;
