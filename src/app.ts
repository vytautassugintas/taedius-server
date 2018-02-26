import express from "express";

const app = express();

app.get('/', (req: any, res: any) => res.send('Hello World!'))

app.listen(3000, () => console.log('Example app listening on port 3000!'))

export default app;