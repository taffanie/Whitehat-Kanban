const express = require('express')
const Handlebars = require('handlebars')
const expressHandlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const { Board, User, Task, sequelize } = require('./server/models/models.js');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access')

const app = express()

const handlebars = expressHandlebars({
    handlebars: allowInsecurePrototypeAccess(Handlebars)
})

app.use(express.static('public'))
app.engine('handlebars', handlebars)
app.set('view engine', 'handlebars')
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.get('/', (req, res) => { //Login Page
    res.render('login')
})

app.get('/boards', (req, res) => { //All Boards Page
    res.render('boards')
})

app.get('/:userid/myboards', (req, res) => { //Boards You are part of Page
    res.render('myboards')
})


app.get('/board/:id', (req, res) => { // Specific Board Page
    res.render('board')
})


///////////// REST /////////////

////Users

app.get('/api/users', async (req, res) => { //Get All Users
    const users = await User.findAll()
    res.send(users)
})

app.post('/api/users', async (req, res) => { // Create New User
    await User.create(req.body)
    res.send(true)
})

app.get('/api/users/:userid', async (req, res) => { //Get User with ID
    const user = await User.findByPk(req.params.userid)
    res.send(user)
})

app.get('/api/users/:userid/boards', async (req, res) => { //Get the Boards of the User with ID
    const user = await User.findByPk(req.params.userid)
    const boards = await user.getBoards()
    res.send(boards)
})

app.post('/api/users/:userid', async (req, res) => { // Update User with that ID
    await User.update(req.body, {
        where: { id: req.params.userid }
    })
    res.send(true)
})

app.post('/api/users/:userid/delete', async (req, res) => { // Delete User With That ID
    await User.destroy({
        where: { id: req.params.userid }
    })
    res.send(true)
})

////Boards

app.get('/api/boards', async (req, res) => { //Get All Boards
    let boards = await Board.findAll({
        include: { model: User, as: "users" }
    });
    res.send(boards)
})

app.post('/api/boards', async (req, res) => { //Create New Board
    if (req.body.title && req.body.userid && req.body.image && req.body.desc) {
        const user = await User.findOne({
            where: { id: req.body.userid }
        });
        const board = await Board.create({ title: req.body.title, image: req.body.image, desc: req.body.desc })
        await user.addBoard(board);
        res.send(true);
    } else {
        res.send(false);
    }
})


app.get('/api/board/:id', async (req, res) => { //Get Board With ID
    let board = await Board.findOne({
        where: { id: req.params.id },
        include: { model: User, as: "users" }
    });
    res.send(board)
})

app.post('/api/board/:id', async (req, res) => { //Update Board with that ID
    let result = false;
    if (req.body.title) {
        await Board.update({ title: req.body.title }, {
            where: { id: req.params.id }
        })
        result = true;
    }
    if (req.body.image) {
        await Board.update({ image: req.body.image }, {
            where: { id: req.params.id }
        })
        result = true
    }
    if (req.body.desc) {
        await Board.update({ desc: req.body.desc }, {
            where: { id: req.params.id }
        })
        result = true;
    }
    res.send(result)
})

app.post('/api/board/:id/adduser/:userid', async (req, res) => { //Update Board -- Add User
    let board = await Board.findOne({
        where: { id: req.params.id }
    });
    let user = await User.findOne({
        where: { id: req.params.userid }
    });
    if (user && board) {
        board.addUser(user);
        res.send(true);
    } else {
        res.send(false)
    }
})

app.post('/api/board/:id/removeuser/:userid', async (req, res) => { //Update Board -- Remove User
    let board = await Board.findOne({
        where: { id: req.params.id }
    });
    let user = await User.findOne({
        where: { id: req.params.userid }
    });
    if (user && board) {
        board.removeUser(user);
        res.send(true);
    } else {
        res.send(false)
    }
})

// app.post('/api/board/:id/title', async (req, res) => { //Update Title of Board with that ID
//     await Board.update({ title: req.body.title }, {
//         where: { id: req.params.id }
//     })
//     res.send(true)
// })

app.post('/api/board/:id/delete', async (req, res) => { //Delete Board With that ID
    await Board.destroy({
        where: { id: req.params.id }
    });
    res.send(true)
})

//// Tasks

app.get('/api/board/:id/tasks', async (req, res) => { // Get Tasks From the Board With that Board ID
    let board = await Board.findOne({
        where: { id: req.params.id }
    });
    let tasks = await board.getTasks({include: { model: User}});
    res.send(tasks);
})

app.post('/api/board/:id/tasks', async (req, res) => {// Create a New Task For the Board with that Board ID
    const task = await Task.create({ name: req.body.name, state: 0 })
    let id = req.params.id;
    let board = await Board.findOne({
        where: { id: id }
    });
    if (board) {
        board.addTask(task)
        if (req.body.userid) {
            let user = await User.findOne({
                where: { id: req.body.userid }
            });
            if (user) {
                user.addTask(task)
            }
        }
        res.send(true)
    } else {
        res.send(false)
    }
})

//(Each task has a unique ID regardless of their board so we can just refrence it)

app.get('/api/task/:taskid', async (req, res) => { // Get A Single Task 
    let task = await Task.findOne({
        where: { id: req.params.taskid },
        include: { model: User}
    });
    res.send(task)
})

app.post('/api/task/:taskid', async (req, res) => {// Update a Specific Task with that Task ID
    let result = false;
    if (req.body.name) {
        await Task.update({ name: req.body.name }, {
            where: { id: req.params.taskid }
        })
        result = true;
    }
    if (req.body.state) {
        await Task.update({ name: req.body.name }, {
            where: { id: req.params.taskid }
        })
        result = true;
    }
    res.send(result)
})

app.post('/api/task/:taskid/assign/:userid', async (req, res) => {// Update the assigned User of Specific Task with that Task ID
    const task = await Task.findByPk(req.params.taskid)
    let user = await User.findOne({
        where: { id: req.params.userid }
    });
    if (user && task) {
        await task.setUser(user)
        res.send(true)
    } else {
        res.send(false)
    }
})

app.post('/api/task/:taskid/delete', async (req, res) => { // Delete Task With that Task ID
    await Task.destroy({
        where: { id: req.params.taskid }
    });
    res.send()
})


app.listen(3000, () => {
    sequelize.sync();
    console.log('web server running on port 3000')
})