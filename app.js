var express = require("express");
var fs= require("fs");
var app = express();
var cors = require('cors');
app.use(cors());

var secret = JSON.parse(fs.readFileSync("secret.json"));

const port = 3000;

const {Client} = require("@googlemaps/google-maps-services-js");

var mysql = require('mysql')
var connection = mysql.createConnection({
  host: secret.sqlHost,
  port:secret.sqlPort,
  user: secret.user,
  password: secret.sqlPass,
  database: secret.DB
});

/*REQUIRES:
    LOCATION [lat,lng]
    RADIUS [meters]
*/ 
app.get('/getRestaurantSuggestions', (req, res) => {
    

    const client = new Client({});

    client.placesNearby({
        params: {
            location: req.query.location,
            radius:req.query.radius,
            type:'restaurant',
            keyword:'fastfood',
            key: secret.googleApiKey,
        },
        timeout: 1000, // milliseconds
    }).then((r) => {

        res.send(r.data.results.map(function(x){return {name:x.name}}));

    }).catch((e) => {

        console.log(e.response.data.error_message);

    });
});

app.get('/getUser', (req, res) => {

})

/*REQUIRES:
    restaurantName
    userID
*/ 
app.post('/addRestaurantToFav', (req, res) => {
    

    var newFav;

    connection.connect();

    connection.query("SELECT ID, name from Restaurants", function (err, rows, fields) {
        if (err) throw err

        for(var i = 0; i < rows.length; i++) {
            if(req.body.restaurantName.includes(rows[i].name)) {
                newFav = {name:rows[i].name, ID:rows[i].ID};
            }
        }
    });

    connection.end();





    if(newFav == null) {
        newFav = {name:req.body.restaurantName};
    }








    connection.connect();

    connection.query("UPDATE Users SET favourites = JSON_ARRAY_APPEND(favourites, '$', '?') where ID = ?", [newFav, req.body.userID], function (err, rows, fields) {
        if (err) throw err

        console.log(rows[0]);
    });

    connection.end();

});

app.listen(port, () => console.log(`Listening on port ${port}!`));