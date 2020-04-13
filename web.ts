import WebsocketRequest from "./websockets/WebsocketRequest";
import {Request, Response} from 'express';
import express = require('express')
import expressLogging = require('express-logging');
import logger = require('logops');

import Vars from './websockets/Vars'
import Programs from "./websockets/Programs";
import ZoomCheck from "./ZoomCheck";


const port = 3001;

const get = (req: Request, res: Response, SubClass: new() => WebsocketRequest) => {
    res.setHeader('Content-Type', 'application/json');
    new SubClass().get()
        .then(result => res.end(JSON.stringify(result)));
};
const post = (req: Request, res: Response, SubClass: new() => WebsocketRequest) => {
    res.setHeader('Content-Type', 'application/json');
    let body: string = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        new SubClass().post(JSON.parse(body))
            .then(result => res.end(JSON.stringify(result)));
    });
}


const app = express();
app.use(expressLogging(logger));

app.get("/",(req : Request, res : Response) => {
    res.send('hello world');
});

app.get("/vars", (req : Request, res : Response) => get(req, res, Vars));
app.post("/vars", (req : Request, res : Response) => post(req, res, Vars));
app.get("/programs", (req : Request, res : Response) => get(req, res, Programs));

app.get("/checkProcess", (req :Request, res: Response) => {
    ZoomCheck().then(result => res.send(result));
});

app.listen(port, () => console.log(`app listening at http://localhost:${port}`));

setInterval(
    () => ZoomCheck(),
    15000
)