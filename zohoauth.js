import fetch from 'node-fetch'
import fs from 'fs'
const baseUrl = 'https://accounts.zoho.eu/oauth/v2/'
const clientId = process.env.ZOHO_CLIENT_ID
const clientSecret = process.env.ZOHO_CLIENT_SECRET
const redirectUri = process.env.ZOHO_REDIRECT_URI
const scope = process.env.ZOHO_SCOPE

const authorizeUrl = () => {
    const completeUrl = new URL(baseUrl + 'auth')
    completeUrl.searchParams.append('response_type', 'code')
    completeUrl.searchParams.append('access_type', 'offline')
    completeUrl.searchParams.append('prompt', 'consent')
    completeUrl.searchParams.append('client_id', clientId)
    completeUrl.searchParams.append('scope', scope)
    completeUrl.searchParams.append('redirect_uri', redirectUri)
    return completeUrl
}

const requestToken = async (req, res) => {
    const { code } = req.query
    const completeUrl = new URL(baseUrl + 'token')
    completeUrl.searchParams.append('grant_type', 'authorization_code')
    completeUrl.searchParams.append('code', code)
    completeUrl.searchParams.append('client_id', clientId)
    completeUrl.searchParams.append('client_secret', clientSecret)
    completeUrl.searchParams.append('scope', scope)
    completeUrl.searchParams.append('redirect_uri', redirectUri)

    try {
        const options = {
            method: 'POST',
            body: {},
            headers: {}
        }
        const response = await fetch(completeUrl, options)
        if (!response.ok) {
            res.render('auth_failure', {
                title: 'tecla-zoho :: Error',
                message: response
            })
            return
        }

        const tokens = await response.json()
        if (!tokens.hasOwnProperty('refresh_token')) {
            const message = 'The tokens do not seem to be correct, or refresh token is missing'
            console.log('auth.requestToken 01', tokens)
            res.render('auth_failure', {
                title: 'tecla-zoho :: Error',
                message: message
            })
            return
        }

        const jsonTokens = JSON.stringify(tokens)
        console.log('auth.requestToken 02', 'Writing new tokens in the json file')
        fs.writeFile('./config/zoho_tokens.json', jsonTokens, 'utf8', (err) => {
            if (err) {
                const message = `Error writing file: ${err}`
                console.log('auth.requestToken 03', message)
                res.render('auth_failure', {
                    title: 'tecla-zoho :: Error',
                    message: message
                })
            }
            else {
                res.render('auth_success', {
                    title: 'tecla-zoho :: Authorization confirmed',
                })
            }
        })
    }
    catch (error) {
        console.log('auth.requestToken 04', error)
        res.render('auth_failure', {
            title: 'tecla-zoho :: Error',
            message: error
        })
    }
}

const refreshToken = async (jsonTokens) => {
    const { access_token, refresh_token } = jsonTokens

    const completeUrl = new URL(baseUrl + 'token')
    completeUrl.searchParams.append('grant_type', 'refresh_token')
    completeUrl.searchParams.append('access_token', access_token)
    completeUrl.searchParams.append('refresh_token', refresh_token)
    completeUrl.searchParams.append('client_id', clientId)
    completeUrl.searchParams.append('client_secret', clientSecret)
    completeUrl.searchParams.append('scope', scope)
    completeUrl.searchParams.append('redirect_uri', redirectUri)

    try {
        const options = {
            method: 'POST',
            body: {},
            headers: {}
        }
        const response = await fetch(completeUrl, options)
        if (!response.ok) {
            console.log('auth.refreshToken 01', response)
            return false
        }

        // here we change the access_token only, becaus the response does not contain the refresh_token
        const newTokens = await response.json()
        jsonTokens.access_token = newTokens.access_token
        const stringTokens = JSON.stringify(jsonTokens)
        console.log('auth.refreshToken 02', 'Updating access token in the json file', jsonTokens)

        try {
            fs.writeFileSync('./config/zoho_tokens.json', stringTokens, 'utf8')
            console.log('auth.refreshToken 03', 'Token updated in the json file')
            return true
        }
        catch (error) {
            const message = `Error writing file: ${err}`
            console.log('auth.refreshToken 04', message)
            return false
        }
    }
    catch (error) {
        console.log('auth.refreshToken 05', error)
        return false
    }
}

export { authorizeUrl, requestToken, refreshToken }