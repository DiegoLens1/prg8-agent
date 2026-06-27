import express from "express"
import { callAgent } from "./agent.js"

const app = express()
app.use(express.json())
app.use(express.static("public"))

app.get('/', async (req, res) => {
  res.sendFile("public/index.html", { root: "." })
})

app.post('/api/chat', async (req, res) => {
  const { message, userid } = req.body
  if (!userid || !message) {
    return res.status(400).json({ error: "userid en message zijn verplicht" })
  }
  const response = await callAgent(message, userid)
  res.json({ response })
})

app.listen(3000, () => console.log("started on localhost:3000"))