//currently 1d, will be later pushed to 2d to store directions and their respective stops
let dirs = [];
//for debugging
function changeRoute() {
    let newRoute = document.getElementById("selRoute").value;
    console.log(newRoute);
}

//empties selection menus
function empty(select) {
    for (let i = select.length - 1; select.length > 1; i--) {
        select.options[i] = null;
    }
}

//sets default menu options
function defOption(el, text) {
    el.value = "none";
    el.setAttribute("selected", "");
    el.setAttribute("hidden", "");
    el.setAttribute("disabled", "");
    el.innerHTML = text;
}

//upon a route change, function changes second menu to display appropriate directions
function setDir() {
    dirDef.innerHTML = "Select a direction";
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
    empty(selStop);
    stopDef.innerHTML = "Select a stop";
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
defOption(routeDef, "Select a route");
selRoute.appendChild(routeDef);
//default direction selection
let dirDef = document.createElement("option");
defOption(dirDef, "Select a route to select direction");
selDir.appendChild(dirDef);
//default stop selection
let stopDef = document.createElement("option");
defOption(stopDef, "Select a direction to select a stop");
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