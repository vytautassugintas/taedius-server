import express from 'express';
import  mongoose from 'mongoose';
const app = express();

mongoose.connect('mongodb://localhost/test');

const db = mongoose.connection;

const userSchema = new mongoose.Schema({
    name: String
});

const User = mongoose.model('User', userSchema);

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('connected');
  User.find((err, users) => {
      if (err) console.log(err);
      console.log(users);
  });
});

app.get('/', (req: any, res: any) => res.send('Hello world!'));

app.listen(3000, () => console.log('Example app listening on port 3000!'));

export default app;