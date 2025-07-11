import {Server} from "http"
import mongoose from "mongoose";
import app from "./app";
let server : Server ;
const PORT = 5000;
const startServer = async()=>{
    try {
        mongoose.connect("mongodb+srv://admin:xgeBqpro1gUyPx0g@learning2023.svtmaib.mongodb.net/tour-management?retryWrites=true&w=majority&appName=learning2023")
        console.log("Database connected");
        app.listen(PORT,()=>{
            console.log(`server is running on port ${PORT}`);
            
        })
        
    } catch (error) {
        console.log(error);
        
    }
}

startServer()