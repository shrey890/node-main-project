const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({ path: './config.env' })
process.on('uncaughtException', err => {
    console.log('UNHANDLER EXCEPTION Shutting Down... ')
    console.log(err)
        process.exit(1)
})
const app = require("./app");
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log('db connection successfully ✅')
})
const port = process.env.PORT || 3000
// ! server
const server = app.listen(port, () => console.log(`app listening at ${port}`))
process.on('unhandledRejection', err => {
    console.log(err.name, err.message)
    console.log('UNHANDLER REJECTION SHUTTING DOWN... ')
    server.close(() => {
        process.exit(1) 
    })
})
