import express from 'express'
import 'dotenv/config'
const app = express()
const port = process.env.PORT || 3003
import { basicAuth } from './auth.js'
import { authorizeUrl, requestToken } from './zohoauth.js'
import { createEvent } from './api.js'

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Return a link to the zoho authorization, which will be returned to the redirect uri
app.get('/zoho_request', (req, res) => {
    const title = 'tecla-zoho :: Autorizzazione'
    const url = authorizeUrl()
    res.render('auth_request', {
        title: title,
        url: url,
    })
})

// Redirect URI from zoho
app.get('/zoho_return', (req, res) => {
    if ('code' in req.query) {
        // Zoho is returning an authorization code that will be needed to generate the token
        requestToken(req, res)
    }
})

// Actual endpoint for creating calendar events
app.post('/zoho/calendar/create', async (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    if (!basicAuth(req)) {
        return res.status(401).json({ message: 'Invalid Authentication Credentials' })
    }
    if (await createEvent(req.body) === true) {
        res.status(201).json({ message: 'The event has been created'})
    }
    else {
        res.status(500).json({ message: 'The event has NOT been created: check the logs'})
    }
})

app.listen(port, () => {
    console.log(`tecla-zoho listening at http://localhost:${port}`)
})
