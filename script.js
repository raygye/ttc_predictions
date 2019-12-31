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
//for debugging
function changeRoute() {
    let newRoute = document.getElementById("selRoute").value;
    console.log(newRoute);
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
    el.setAttribute("hidden", "")
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
    const doc = $.ajax({
        type: "GET",
        url: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=ttc&r=" + document.getElementById("selRoute").value,
        xml: "xml",
        async: false,
    }).responseXML;
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
}

function setStops() {
    //empty previous stops
    empty(selStop);
    stopDef.innerHTML = "Select a stop";
    //clear refresh timer
    document.getElementById("count").innerHTML = "";
    const doc = $.ajax({
        type: "GET",
        url: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=ttc&r=" + document.getElementById("selRoute").value,
        xml: "xml",
        async: false,
    }).responseXML;
    //contains stops,routes, directions,#text...
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
}
function predict() {
    document.getElementById("stopName").innerHTML = $("#selStop option:selected").text();
    document.getElementById("dirName").innerHTML = $("#selDir option:selected").text();
    const doc = $.ajax({
        type: "GET",
        url: "http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=ttc&r=" + document.getElementById("selRoute").value +
            "&s=" + document.getElementById("selStop").value,
        xml: "xml",
        async: false,
    }).responseXML;
    console.log("http://webservices.nextbus.com/service/publicXMLFeed?command=predictions&a=ttc&r=" + document.getElementById("selRoute").value +
        "&s=" + document.getElementById("selStop").value);
    if (doc.childNodes[0].childNodes[1].hasAttribute("dirTitleBecauseNoPredictions")) {
        predictions+= "No predictions available at the moment. There may be no buses running.";
    }
    //contains #text as well as directions, directions will contain their respective predictions
    let directions = doc.childNodes[0].childNodes[1].childNodes;
    for (let i = 0; i < directions.length; i++) {
        //incremented current node
        let curNode = directions[i];
        //make sure we have found the appropriate direction
        if (curNode.nodeName=="direction" && $("#selDir option:selected").text()==curNode.getAttribute("title")) {
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
                    predictions+=selRoute.value + " - Bus #" + curSub.getAttribute("vehicle") + " - in " +
                        Math.floor(seconds/60) + " min " + seconds%60 + " sec - ETA " + ("0" + current.getHours()).slice(-2) + ":" +
                        ("0" + current.getMinutes()).slice(-2) + "<br>";
                }
            }
        }
        //accommodates the case where other direction's buses are available
        else if (curNode.nodeName=="direction" && found === false){
            if (predictions==="") {
                predictions+="No buses available for this direction, but available for: " + curNode.getAttribute("title");
            }
            else {
                predictions+=", " + curNode.getAttribute("title");
            }
        }
    }
    //final prediction printed
    document.getElementById("printPre").innerHTML = predictions;
    document.getElementById("predictions").style.opacity = "1";
    lastRef = new Date();
    document.getElementById("lastRef").innerHTML = ("Last updated: " + monthNames[lastRef.getMonth()] + " " +
        ("0" + lastRef.getDay()).slice(-2) + ", " + lastRef.getFullYear() + " at " + ("0" + lastRef.getHours()).slice(-2) + ":" +
        ("0" + lastRef.getMinutes()).slice(-2) + ":" + ("0" + lastRef.getSeconds()).slice(-2));
    //clear predictions for next use
    predictions = "";
}
//sets intervals for updates and update countdown clock
function update() {
    timer = setInterval(predict, 5000);
    counter = setInterval(counting, 1000);
}
//will increment per second
function counting() {
    countNum++;
    document.getElementById("count").innerHTML = "Refreshing in " + (5-(countNum%5)) + " second(s)";
}
//clears both update and update countdown clock
function clearBoth() {
    clearInterval(timer);
    clearInterval(counter);
    countNum = 0;
}
//site initialization
//retrieves route info
const doc = $.ajax({
    type: "GET",
    url: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=ttc",
    xml: "xml",
    async: false,
}).responseXML;
let routes = doc.childNodes[0].childNodes;
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
//appends menus to DOM
document.getElementById("routes").append(selRoute);
document.getElementById("dirs").append(selDir);
document.getElementById("stops").appendChild(selStop);