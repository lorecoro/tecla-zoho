import fetch from 'node-fetch'
import fs from 'fs'
import { refreshToken } from './zohoauth.js'

const baseUrl = 'https://calendar.zoho.eu/api/v1/calendars/'

const createEvent = async (body) => {
    console.log(body)
    if (!body.hasOwnProperty('attendees')) {
        console.log('api.createEvent 01', 'req.body does not contain attendees')
        return false
    }
    if (body.attendees.constructor !== Array) {
        console.log('api.createEvent 02', 'req.body.attendees is not an array but a ' + typeof body.attendees)
        return false
    }
    if (body.attendees.length < 1) {
        console.log('api.createEvent 03', 'req.body.attendees is empty')
        return false
    }

    try {
        fs.readFileSync('./config/zoho_calendars.json', 'utf8')
    } catch (err) {
        console.log('api.createEvent 04', `Error reading calendars file from disk: ${err}`)
        return false
    }

    let jsonTokens = {}
    let token = ''
    try {
        const stringTokens = fs.readFileSync('./config/zoho_tokens.json', 'utf8')
        jsonTokens = JSON.parse(stringTokens)
        token = jsonTokens.access_token
    } catch (err) {
        console.log('api.createEvent 05', `Error reading tokens file from disk: ${err}`)
        return false
    }

    if (await testToken(token) !== true) {
        console.log('api.createEvent 06', 'The token needs to be refreshed')
        if (!jsonTokens.hasOwnProperty('refresh_token')) {
            console.log('api.createEvent 07', 'The tokens do not seem to be correct, or refresh token is missing:')
            console.log(jsonTokens)
            return false
        }
        if (await refreshToken(jsonTokens) !== true) {
            console.log('api.createEvent 08', 'The token could not be refreshed')
            return false
        } else {
            // Read the new token from file; consider passing the token by reference
            try {
                const stringTokens = fs.readFileSync('./config/zoho_tokens.json', 'utf8')
                jsonTokens = JSON.parse(stringTokens)
                token = jsonTokens.access_token
                console.log('api.createEvent 09', 'The new token has been read from file')
            } catch (err) {
                console.log('api.createEvent 10', `Error reading tokens file from disk: ${err}`)
                return false
            }
        }
    }

    let found = true
    for (const attendee of body.attendees) {
        const data = fs.readFileSync('./config/zoho_calendars.json', 'utf8')
        const calendars = JSON.parse(data)
        found = calendars.find(row => row.email === attendee.email)
        if (found) {
            if (await createEventCalendar(found.uid, body, token) !== true) {
                console.log('api.createEvent 11', 'Error creating the event for ' + attendee.email)
                return false
            }
            else {
                console.log('api.createEvent 12', 'Created the event for ' + attendee.email)
            }
        }
        else {
            console.log('api.createEvent 13', attendee.email + ' not found in calendars')
            return false
        }
    }

    console.log('api.createEvent 14', 'finished')
    return true
}

const createEventCalendar = async (uid, body, token) => {
    try {
        const {summary, location, description, start, end} = body
        const gmaps = 'https://maps.google.com/maps?q=' + location.replace(/[\ ,]/g, '+')
        const cleanStart = start.replace(/[-:]/g, '')
        const cleanEnd = end.replace(/[-:]/g, '')

        const event = {
            "title": summary,
            "dateandtime": {
                "timezone": "Europe/Rome",
                "start": cleanStart,
                "end": cleanEnd
            },
            "location": location,
            "url": gmaps,
            "description": description
        }
        const completeUrl = new URL(baseUrl + uid + '/events')
        completeUrl.searchParams.append('eventdata', JSON.stringify(event))

        const options = {
            method: 'POST',
            body: {},
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        }
        const response = await fetch(completeUrl, options)
        if (!response.ok) {
            console.log('api.createEventCalendar 01', response)
            return false
        }
        console.log('api.createEventCalendar 02', 'Event created')
        return true
    }
    catch (error) {
        console.log('api.createEventCalendar 03', error)
        return false
    }
}

const testToken = async (token) => {
    // To check if the token is valid, let's just use a simple GET for user info
    try {
        console.log('api.testToken 01', 'check token')
        const completeUrl = 'https://accounts.zoho.eu/oauth/user/info'
        const options = {
            method: 'GET',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        }
        const response = await fetch(completeUrl, options)
        if (!response.ok) {
            console.log('api.testToken 02', response.status)
            return false
        }
        console.log('api.testToken 03', 'token is valid')
        return true
    }
    catch (error) {
        console.log('api.testToken 04', error)
        return false
    }
}

export { createEvent }