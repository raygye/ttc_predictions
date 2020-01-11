//currently 1d, will be later pushed to 2d to store directions and their respective stops
let dirs = [];
//prediction string to be displayed
let predictions = "";
//boolean for if the desired prediction is found
let found = false;
//variable for setting update interval
let timer;
//variable for setting update countdown interval
let counter;
//variable for setting map update interval
let mapTimer;
//companion variable for counter, actual seconds elapsed, will be %5
let countNum = 0;
//variable storing last time refreshed
let lastRef;
//made just for making it easier to display months
let monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
];
//variable storing stopID
let stopID = -1;
//prediction to be printed if other routes are available
let subPrint;
//stores lat/lon
let stopLat = 0;
let stopLon = 0;
//current route
let curRoute;
//a 2d array of google lat/lng coordinates for route line
let routeLine = [];
//variable for epoch time of last return
let epoch = "0";
//set key
let script = document.createElement("script");
script.setAttribute("async", "");
script.setAttribute("defer", "");
script.setAttribute("src",
    atob("aHR0cHM6Ly9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzP2tleT1BSXphU3lDQ0dnLXh5bEJzQjhoQ2lqV1Ftc1BwNHZYZ3lhdWhuZWsNCg=="));
document.getElementById("predictions").appendChild(script);
//sets current route
function changeRoute() {
    curRoute = document.getElementById("selRoute").value;
    console.log(curRoute);
}

//empties selection menus
function empty(select) {
    for (let i = select.length - 1; i > 0; i--) {
        select.options[i] = null;
    }
}

//sets default menu options
function defOption(el) {
    el.setAttribute("selected", "");
    el.setAttribute("hidden", "");
    if (el===routeDef) {
        el.innerHTML = "Select a route";
    }
    else if (el===dirDef) {
        el.innerHTML = "Select a route to select direction";
    }
    else {
        el.innerHTML = "Select a direction to select a stop";
    }
}

//upon a route change, function changes second menu to display appropriate directions
function setDir() {
    dirDef.innerHTML = "Select a direction";
    //clear refresh timer
    document.getElementById("count").innerHTML = "";
    //clear map refresh timer
    document.getElementById("mapCount").innerHTML = "";

    const doc = $.ajax({
        type: "GET",
        url: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=ttc&r=" + document.getElementById("selRoute").value,
        xml: "xml",
        async: true,
    }).done(function(doc) {
        //contains stops,routes, directions,#text...
        let directions = doc.childNodes[0].childNodes[1].childNodes;
        //clear previous route's direction selection
        empty(selDir);
        //dirCount required as size of direction array is not equal to length of nodes (#text nodes exist)
        let dirCount = 0;
        for (let i = 0; i < directions.length; i++) {
            //incremented current node
            let curNode = directions[i];
            if (curNode.nodeName === "direction") {
                let opt = document.createElement("option");
                opt.value = dirCount.toString();
                opt.innerHTML = curNode.getAttribute("title");
                let stops = curNode.childNodes;
                dirs[dirCount] = [];
                for (let j = 0; j < stops.length; j++) {
                    if (stops[j].nodeName !== "#text") {
                        dirs[dirCount].push(stops[j].getAttribute("tag"));
                    }
                }
                selDir.appendChild(opt);
                dirCount++;
            }
        }
    });
}

function setStops() {
    //empty previous stops
    empty(selStop);
    stopDef.innerHTML = "Select a stop";
    //clear refresh timer
    document.getElementById("count").innerHTML = "";
    //clear map refresh timer
    document.getElementById("mapCount").innerHTML = "";
    $.ajax({
        type: "GET",
        url: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=ttc&r=" + document.getElementById("selRoute").value,
        xml: "xml",
        async: true,
    }).done(function(doc) {
        //contains stops, routes, directions,#text...
        let allRoutes = doc.childNodes[0].childNodes[1].childNodes;
        for (let i = 0; i < dirs.length; i++) {
            if (i == selDir.value) {
                for (let j = 0; j < dirs[i].length; j++) {
                    for (let k = 0; k < allRoutes.length; k++) {
                        //incremented current node
                        let curNode = allRoutes[k];
                        if (curNode.nodeName!=="#text" && curNode.getAttribute("tag") == dirs[i][j]) {
                            let opt = document.createElement("option");
                            //stop tags are used for predictions
                            opt.value = curNode.getAttribute("tag");
                            opt.innerHTML = curNode.getAttribute("title");
                            selStop.appendChild(opt);
                        }
                    }
                }
            }
        }
    });
}

function predict() {
    $.ajax({
        type: "GET",
        url: "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=ttc&r=" + document.getElementById("selRoute").value +
            "&s=" + document.getElementById("selStop").value,
        xml: "xml",
        async: true,
    }).done(function(doc) {
        console.log("http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=ttc&r=" + document.getElementById("selRoute").value +
            "&s=" + document.getElementById("selStop").value);
        if (doc.childNodes[0].childNodes[1].hasAttribute("dirTitleBecauseNoPredictions")) {
            predictions+= "No predictions available at the moment. There may be no vehicles running.";
        }
        //set stop name
        document.getElementById("stopName").innerHTML = doc.childNodes[0].childNodes[1].getAttribute("stopTitle");
        //contains #text as well as directions, directions will contain their respective predictions
        let directions = doc.childNodes[0].childNodes[1].childNodes;
        for (let i = 0; i < directions.length; i++) {
            //incremented current node
            let curNode = directions[i];
            //make sure we have found the appropriate direction
            if (curNode.nodeName=="direction") {
                predictions+="<h3>" + curNode.getAttribute("title") + "</h3>";
                found = true;
                for (let j = 0; j < curNode.childNodes.length; j++) {
                    //incremented current node for predictions (the child node of direction)
                    let curSub = curNode.childNodes[j];
                    if (curSub.nodeName=="prediction") {
                        //new time object
                        let current = new Date();
                        let seconds = curSub.getAttribute("seconds");
                        //seconds is multiplied by 1000 as js works with milliseconds
                        current = new Date(current.getTime() + seconds*1000);
                        predictions+= "<p>" + selRoute.value + " - Bus #" + curSub.getAttribute("vehicle") + " - in " +
                            Math.floor(seconds/60) + " min " + seconds%60 + " sec - ETA " + ("0" + current.getHours()).slice(-2) + ":" +
                            ("0" + current.getMinutes()).slice(-2) + "</p>";
                    }
                }
            }
            //accommodates the case where other direction's buses are available
            else if (curNode.nodeName=="direction" && found === false){
                if (subPrint==="") {
                    subPrint+="No vehicles available for this direction, but available for: " + curNode.getAttribute("title");
                }
                else {
                    subPrint+=", " + curNode.getAttribute("title");
                }
            }
        }
        predHandle();
    });
}

//handles appending predictions, wipes variables
function predHandle() {
    //final prediction printed
    if(predictions=="") {
        document.getElementById("printPre").innerHTML = subPrint;
    }
    else {
        document.getElementById("printPre").innerHTML = predictions;
    }
    document.getElementById("predictions").style.opacity = "1";
    lastRef = new Date();
    document.getElementById("lastRef").innerHTML = ("Last updated: " + monthNames[lastRef.getMonth()] + " " +
        ("0" + lastRef.getDate()).slice(-2) + ", " + lastRef.getFullYear() + " at " + ("0" + lastRef.getHours()).slice(-2) + ":" +
        ("0" + lastRef.getMinutes()).slice(-2) + ":" + ("0" + lastRef.getSeconds()).slice(-2));
    //clear predictions for next use
    predictions = "";
    subPrint = "";
    //reset found boolean
    found = false;
}

//sets intervals for updates and update countdown clock
function update() {
    timer = setInterval(predict, 5000);
    counter = setInterval(counting, 1000);
    mapTimer = setInterval(setMap, 30000);
}

//same function, for stopID
function updateID() {
    timer = setInterval(submit, 5000);
    counter = setInterval(counting, 1000);
    mapTimer = setInterval(setMap, 30000);
}

//will increment per second
function counting() {
    countNum++;
    document.getElementById("count").innerHTML = "Predictions refreshing in " + (5-(countNum%5)) + " second(s)";
    document.getElementById("mapCount").innerHTML = "Map refreshing in " + (30-(countNum%30)) + " second(s)";
}

//clears both update and update countdown clock (it's really "clearAll" now...)
function clearBoth() {
    clearInterval(timer);
    clearInterval(counter);
    clearInterval(mapTimer);
    countNum = 0;
}

//function starts on submission of stopID input
function submit() {
    stopID = document.getElementById("stopFill").value;
    document.getElementById("stopName").innerHTML = "Stop number " + stopID;
    $.ajax({
        type: "GET",
        url: "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=ttc&stopId=" + stopID,
        xml: "xml",
        async: true,
    }).done(function(doc) {
        console.log("http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=ttc&stopId=" + stopID);
        //contains #text as well as directions, directions will contain their respective predictions
        let routes = doc.childNodes[0].childNodes;
        for (let i = 0; i < routes.length; i++) {
            //incremented current node
            let curNode = routes[i];
            if (curNode.nodeName!=="#text" && !curNode.hasAttribute("dirTitleBecauseNoPredictions")) {
                //incremented current node, child of curNode
                curRoute = curNode.getAttribute("routeTag");
                let curSub = curNode.childNodes;
                for (let j = 0; j < curSub.length; j++) {
                    if (curSub[j].nodeName=="direction") {
                        found = true;
                        predictions+="<h3>" + curSub[j].getAttribute("title") + "</h3>";
                        //that's right, it's 2am so this is what I'm doing now I guess
                        let curSubSub = curSub[j].childNodes;
                        for (let k = 0; k < curSubSub.length; k++) {
                            if (curSubSub[k].nodeName=="prediction") {
                                //new time object
                                let current = new Date();
                                let seconds = curSubSub[k].getAttribute("seconds");
                                //seconds is multiplied by 1000 as js works with milliseconds
                                current = new Date(current.getTime() + seconds*1000);
                                predictions+= "<p>" +curSubSub[k].getAttribute("branch") + " - Bus #" + curSubSub[k].getAttribute("vehicle") + " - in " +
                                    Math.floor(seconds/60) + " min " + seconds%60 + " sec - ETA " + ("0" + current.getHours()).slice(-2) + ":" +
                                    ("0" + current.getMinutes()).slice(-2) + "</p>";
                            }
                        }
                    }
                }
            }
        }
        if (found===false) {
            predictions+= "No predictions available at the moment. There may be no vehicles running or the stop number may not exist.";
        }
        predHandle();
    })
}

function setMap() {
    $.ajax({
        type: "GET",
        url: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=ttc&r=" + curRoute,
        xml: "xml",
        async: false,
    }).done(function(doc) {
        console.log("http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=ttc&r=" + curRoute);
        //contains stops, routes, directions,#text...
        let allRoutes = doc.childNodes[0].childNodes[1].childNodes;
        let dirCount = 0;
        for (let i = 0; i < allRoutes.length; i++) {
            //incremented current node
            let curNode = allRoutes[i];
            if (curNode.nodeName == "stop" && (curNode.getAttribute("title") == $("#selStop option:selected").text() ||
                curNode.getAttribute("stopId") == stopID)) {
                stopLat = parseFloat(curNode.getAttribute("lat"));
                stopLon = parseFloat(curNode.getAttribute("lon"));
            }
            //counter for routeLine
            else if (curNode.nodeName == "path") {
                routeLine[dirCount] = [];
                for (let j = 0; j < curNode.childNodes.length; j++) {
                    //incremented childNodes
                    let curSub = curNode.childNodes[j];
                    if (curSub.nodeName == "point") {
                        routeLine[dirCount].push(new google.maps.LatLng(parseFloat(curSub.getAttribute("lat")), parseFloat(curSub.getAttribute("lon"))));
                    }
                }
                dirCount++;
            }
        }
        initMap();
    })

}
function initMap() {
    let theStop = {lat: stopLat, lng: stopLon};
    let map = new google.maps.Map(document.getElementById("map"), {
        zoom: 16,
        center: theStop
    });
    let marker = new google.maps.Marker({
        position: theStop,
        map: map,
    });
    for (let i = 0; i < routeLine.length; i++) {
        let fullRoute = new google.maps.Polyline({
            path: routeLine[i],
            strokeColor: "#FF0000",
            strokeOpacity: 0.5,
            strokeWeight: 2
        });
        fullRoute.setMap(map);
    }
    routeLine = [];
    $.ajax({
        type: "GET",
        url: "http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&r=" + curRoute + "&t=" + epoch,
        xml: "xml",
        async: true,
    }).done(function (doc) {
        console.log("http://webservices.nextbus.com/service/publicXMLFeed?command=vehicleLocations&a=ttc&r=" + curRoute + "&t=" + epoch);
        let vehicles = doc.childNodes[0].childNodes
        for (let i = 0; i < vehicles.length; i++) {
            let vehicle = vehicles[i];
            if (vehicle.nodeName == "vehicle") {
                let pos = new google.maps.LatLng(parseFloat(vehicle.getAttribute("lat")), parseFloat(vehicle.getAttribute("lon")));
                let icon = {
                    anchor: new google.maps.Point(0,0),
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 5,
                    rotation: parseInt(vehicle.getAttribute("heading"))
                }
                let marker = new google.maps.Marker({
                    position: pos,
                    icon: icon
                });
                marker.setMap(map);
            }
            else if (vehicle.nodeName == "lastTime") {
                epoch = vehicle.getAttribute("time");
            }
        }
    })
}

//site initialization
//first menu, route selection
let selRoute = document.createElement("select");
selRoute.className = "menu";
selRoute.id = "selRoute";
//second menu, direction selection
let selDir = document.createElement("select");
selDir.className = "menu";
selDir.id = "selDir";
//third menu, stop selection
let selStop = document.createElement("select");
selStop.className = "menu";
selStop.id = "selStop";
//default route selections
let routeDef = document.createElement("option");
defOption(routeDef);
selRoute.appendChild(routeDef);
//default direction selection
let dirDef = document.createElement("option");
defOption(dirDef);
selDir.appendChild(dirDef);
//default stop selection
let stopDef = document.createElement("option");
defOption(stopDef);
selStop.appendChild(stopDef);
//retrieves route info
$.ajax({
    type: "GET",
    url: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=ttc",
    xml: "xml",
    async: true,
}).done(function(doc) {
    let routes = doc.childNodes[0].childNodes;
//populates route menu
    for (let i = 0; i < routes.length; i++) {
        let route = routes[i];
        if (route.nodeName !== "#text") {
            let opt = document.createElement("option");
            opt.value = route.getAttribute("title").match(/\d+/)[0];
            opt.innerHTML = route.getAttribute("title");
            selRoute.appendChild(opt);
        }
    }
});
//listen for enter
document.getElementById("stopFill").addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("submit").click();
    }
});
//appends menus to DOM
document.getElementById("routes").append(selRoute);
document.getElementById("dirs").append(selDir);
document.getElementById("stops").appendChild(selStop);