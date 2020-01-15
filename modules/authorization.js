var jwt = require('jsonwebtoken');
var request = require('request')

function getKeyID (kid,callback) {

    var uri = 'https://login.microsoftonline.com/common/discovery/keys'
    
       request(uri,{JSON:true}, (request,response) => {
    
       var res = JSON.parse(response.body)

       let keyMatch =  res.keys.find( (key)=> {
        return key.kid === kid 
        })
    
        if (!keyMatch) {
            return callback ('No matching key found on ' + uri,undefined)
    }

        callback(undefined,keyMatch)
    
        })
    
    }
   

//Const Option Parameters from app.js go here 
function AADJwtAuthorize ({issuer,audience,AllowInternalAPIClient}) {

    return function (req,res,next) {
        console.log('MiddleWare Called')
        console.log(req.path)
        
        if (AllowInternalAPIClient === true && (req.path === "/token" || req.path === "/favicon.ico"  )) {
            return next()
        }
        console.log(req.headers)
        if (!req.headers.authorization) {
            return next('Missing Authorization Header')
        }
        var token = req.headers.authorization.split("Bearer ")[1]
        var decodedToken = jwt.decode(token,{complete:true})
        console.log(decodedToken)
    
       getKeyID(decodedToken.header.kid,(error,data) => {
    
        if(error) {
            return next(error)
        }
    
       var key = '-----BEGIN CERTIFICATE-----' +'\n' + data.x5c + '\n' + '-----END CERTIFICATE-----'
        console.log(key)
          jwt.verify(token,key,{algorithms:'RS256',issuer,complete:true,audience},(error,verifiedToken) => {
    
            if(error) {
                return next(error.message)
            }
            
            res.body=[
                verifiedToken.payload,
                {
                status:"ok"
                },
            ]
            console.log(verifiedToken)
            return next()
          })
        
       })
    
    }
       
}

var getToken = (port,{client_id,redirect_uri,code,resource},callback) => {

    var options = {
    json:true,
    headers:[{
    "content-type":"application/x-www-form-urlencoded" 
    }
    ],
    form: {
        grant_type:"authorization_code",
        client_id,
        redirect_uri,
        resource,   
        code,
        }
    }

    request.post("https://login.microsoftonline.com/common/oauth2/token",options, (error,response) => {

     var APIoptions = {
        json:true,
        headers:{
        "Authorization": "Bearer " + response.body.access_token,
            }
        }

        console.log("error here:", response.body)
        if (response.body.error) {
            console.log('error found')
            return callback('Possibly wrong client type, or Code reuse: Check that the Client has redirect uri set to public - AzureAD Error:' + response.body.error_description)
        }
    
        var uriWithCorrectPort = "http://localhost:"+port +"/accounts"
      request.get(uriWithCorrectPort,APIoptions,(error,response) => {
          callback(response.body)
      })

     }
    )

}

var testOptions = (opts) => {
    console.log(opts)
}



module.exports={AADJwtAuthorize,getToken,testOptions}