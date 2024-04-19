const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const dpPath = path.join(__dirname, 'userData.db')
let db = null

const initilizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dpPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error:${error.message}`)
  }
}

initilizeDBAndServer()

app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const userDataQuery = `SELECT * FROM user WHERE username='${username}'`
  const hashPassword = await bcrypt.hash(password, 10)
  const dbUser = await db.get(userDataQuery)
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400).send('Password is too short')
    } else {
      const userInsert = `INSERT INTO user(username,name,password,gender,location)VALUES('${username}','${name}','${hashPassword}','${gender}','${location}')`
      const dbResponse = await db.run(userInsert)
      response.status(200).send('User created successfully')
    }
  } else {
    response.status(400).send('User already exists')
  }
})

//login method

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const userDataQuery = `SELECT * FROM user WHERE username='${username}'`
  const dbUser = await db.get(userDataQuery)
  if (dbUser === undefined) {
    response.status(400).send('Invalid user')
  } else {
    const encryptPassword = await bcrypt.compare(password, dbUser.password)
    if (encryptPassword === true) {
      response.status(200).send('Login success!')
    } else {
      response.status(400).send('Invalid password')
    }
  }
})

//user changed password

app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const userDataQuery = `SELECT * FROM user WHERE username='${username}'`
  const dbUser = await db.get(userDataQuery)
  if (dbUser === undefined) {
    response.status(400).send('User not registered')
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (isValidPassword === true) {
      if (newPassword.length < 5) {
        response.status(400).send('Password is too short')
      } else {
        const encryptPassword = await bcrypt.hash(newPassword, 10)
        const userUpdate = `UPDATE user SET password='${encryptPassword}' WHERE username='${username}'`
        const dbResponse = await db.run(userUpdate)
        response.status(200).send('Password updated')
      }
    } else {
      response.status(400).send('Invalid current password')
    }
  }
})

module.exports = app
