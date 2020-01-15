//App.js Depedencies 
const express = require('express')
const {
    AADJwtAuthorize,
    getToken,
    testOptions
} = require('./modules/authorization')
const app = express()
const port = 3000

//Middleware and optional client options
const tenantId = "f996ef8a-f93b-47e5-9ed9-a9d5e5b95245"
const options = {
    audience:"https://jwtapi.dewi.red",
    issuer:"https://sts.windows.net/"+tenantId +"/",
    AllowInternalAPIClient:true,
        clientOptions: {
        ClientId:"355e0149-c459-411e-a0b2-6e6f8cee286f",
        RedirectUri:"http://localhost:3000/token"
        }
}
//destructure optional client options for easier reading 
const {ClientId,RedirectUri} = options.clientOptions

//Enable the middleware
app.use(AADJwtAuthorize(options))

// Internal Client starts if used, could have been also inside '/*/ but this makes cleaner separation with slight cost of more code
    app.get('/token', (req, Response) => {
     console.log(req.query)

        if(req.query.error) {
            return(Response.send(req.query.error_description))
        }

        if(!req.query.code) {
        console.log('no query code')
        var link = 'https://login.microsoftonline.com/' + tenantId + '/oauth2/authorize?client_id=' + ClientId + '&response_type=code&response_mode=query&resource=' + options.audience + "&redirect_uri" + RedirectUri
        return Response.redirect(link)
        }

        var clientOptions = {
            client_id:ClientId,
            redirect_uri:RedirectUri,
            code:req.query.code,
            resource:options.audience
        }
       
        getToken(port,clientOptions, (data) => {
            console.log(data)
            return(Response.send(data))
        })
        
    })
// // Internal Client stops

app.get('/*', (req, Response) => {
    Response.send(Response.body)
})

app.listen(port, () => {
    console.log('Running API Application with options:', options)
})