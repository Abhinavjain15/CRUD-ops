const express = require('express');
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const fs = require('fs');
const { v4: idv4 } = require('uuid');


const app = express();

passport.use(
    new BasicStrategy((username, password, done) => {
        fs.readFile('users.json', 'utf8', (err, data) => {
            if (err) {
                return done(err);
            }
            const users = JSON.parse(data);
            const user = users[0].creds.username === username && users[0].creds.password === password
            if (!user) {
                return done(null, false);
            }
            return done(null, user);
        });
    })
);

app.use(express.json());
app.use(passport.initialize());

app.get('/', (req, res) => {
    return res.json({ message: 'Hi' });
})

//register
app.post('/register', (req, res) => {

    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read users' });
        }
        const users = JSON.parse(data);
        const newUser = req.body;
        if (users.some((user) => user.username === newUser.username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        const userId = idv4();
        newUser.userID = userId;
        users.push(newUser);
        fs.writeFile('users.json', JSON.stringify(users), 'utf8', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Unable to register user' });
            }
            return res.json({ message: 'User registered successfully' });
        });
    });
});

//log
app.get('/log/:id', passport.authenticate('basic', { session: false }), (req, res) => {
    const id = req.params.id;
    const users = JSON.parse(fs.readFileSync('./users.json'));
    let isUser
    users.some((user) => {
        if (user.userID === id) {
            isUser = user
            return
        }
    })
    if (isUser) return res.json({ isUser })
    else return res.status(400).json({ error: 'Invalid ID' });
});

//update
app.put('/updateUser/:id', passport.authenticate('basic', { session: false }), (req, res) => {
    const id = req.params.id;
    const updatedInfo = req.body;

    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read users' });
        }
        const users = JSON.parse(data);
        const index = users.findIndex((u) => u.userID === id);
        if (index === -1) {
            return res.status(404).json({ error: 'User not found' });
          }
        users[index] = {
            name: updatedInfo.name || users[index].name,
            username: updatedInfo.username || users[index].username,
            age: updatedInfo.age || users[index].age,
            speciality: updatedInfo.speciality || users[index].speciality,
            userID:users[index].userID
        }
        fs.writeFile('users.json', JSON.stringify(users), 'utf8', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Unable to update user' });
            }
            return res.json({ message: 'User updated' });
        })
    })
})

//delete
app.delete('/deleteUser/:id', passport.authenticate('basic', { session: false }), (req, res) => {
    const id = req.params.id;
    const users = JSON.parse(fs.readFileSync('./users.json'));
    const index = users.findIndex((u) => u.userID === id);
    if (index === -1) {
        return res.status(404).json({ error: 'User not found' });
      }
      users.splice(index, 1);
    fs.writeFileSync('./users.json', JSON.stringify(users));
    return res.json({ message: 'User deleted successfully' });
  });
  
  // List all users
  app.get('/listAllUsers', passport.authenticate('basic', { session: false }), (req, res) => {
    const users = JSON.parse(fs.readFileSync('./users.json'));
    return res.json(users.slice(1));
  });

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});