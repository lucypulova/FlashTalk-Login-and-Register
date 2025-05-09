import http from "node:http";
import express from "express";
import {Server} from "socket.io";
import cors from "cors"

//  Зареждаме променливите от .env файла
import dotenv from "dotenv";
dotenv.config(); // Важно: да е най-отгоре, преди да използваме process.env


import { SERVER_HOSTNAME, SERVER_PORT } from "@config/envConfig";
import corsOptions from "@config/corsConfig";
import responseMiddleware from "@middlewares/responseTypeMiddlware";
import * as userController from "@controllers/usersController";
import authRoutes from "./routes/authRoutes"; // или @routes/... ако имаш alias
import protectedRoutes from "@routes/protectedRoutes";

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
        interface Response {
            sendJson: <T>(data: T, message?: string) => this;
        }
    }
}

// Basic config
const app = express();
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: false }));
app.use(responseMiddleware)
/**
 * Бизнес-логика - авторизация и др http запроси (DR1, DR3, DR5)
 */

// Регистрация на API за login/register
app.use("/api/auth", authRoutes); // login, register

// Защитени API маршрути
app.use("/api/private", protectedRoutes); // me, settings, etc.

app.get('/', userController.getUser);
/**
 * Сокет соединение - DR4
 */
const server = http.createServer(app);
const io = new Server(server, {
    cors: corsOptions
});
const userSessions: Map<number, string>[] = [];
io.on("connection", (socket) => {
    console.log("Нов потребител е свързан:", socket.id);

    socket.on("message", (data) => {
        console.log("Съобщение:", data);
        io.emit("message", data);
    });

    socket.on("disconnect", () => {
        console.log("Потребителят прекъсна връзката:", socket.id);
    });
});

//Server start
server.listen(SERVER_PORT, () => {
    console.log(`[server]: Server is running at http://${SERVER_HOSTNAME}:${SERVER_PORT}`);
});


