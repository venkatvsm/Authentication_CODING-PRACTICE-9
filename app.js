const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'userData.db')
let db = null
const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server Started!!!')
    })
  } catch (e) {
    console.log(e.message)
    proccess.exit(1)
  }
}
intializeDbAndServer()

//API 1
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedpassword = await bcrypt.hash(password, 10)
  const usernameEl = `
  SELECT *
  FROM user
  WHERE username = '${username}';
  `
  const checkUsername = await db.get(usernameEl)
  //console.log(checkUsername)
  if (checkUsername === undefined) {
    let addNewUser = `
    INSERT INTO 
      user(username, name, password, gender, location)
    VALUES
      ('${username}',' ${name}', '${hashedpassword}', '${gender}', '${location}');
    `
    if (password.length > 5) {
      const query_result = await db.run(addNewUser)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})
//API 2
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const query = `
  SELECT 
    *
  FROM
    user
  WHERE
    username = '${username}';
  `
  const userNameEl = await db.get(query)
  if (userNameEl === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const userPassword = await bcrypt.compare(password, userNameEl.password)
    if (userPassword) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//API 3
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body

  const query = `
  SELECT *
  FROM user
  WHERE username = '${username}';
  `
  const currentUser = await db.get(query)
  if (currentUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const newhasedpassword = await bcrypt.hash(newPassword, 10)
    const change_password_Query = `
      UPDATE user
      SET
        password = '${newhasedpassword}'
      WHERE
        username = '${username}';
      `
    const currentPassword = await bcrypt.compare(
      oldPassword,
      currentUser.password,
    )
    if (currentPassword) {
      if (newPassword.length > 5) {
        const passwordchanged = await db.run(change_password_Query)
        response.status(200)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
