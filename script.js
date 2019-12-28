//for debugging
function changeRoute() {
    let newRoute = document.getElementById("selRoute").value;
    console.log(newRoute);
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
        url: "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=ttc&r="+document.getElementById("selRoute").value,
        xml: "xml",
        async: false,
    }).responseXML;
    let directions = doc.childNodes[0].childNodes[1].childNodes;
    for (let i = 0; i <directions.length; i++) {
        let direction = directions[i];
        if (direction.nodeName === "direction") {
            let opt = document.createElement("option");
            opt.innerHTML = direction.getAttribute("title");
            selDir.appendChild(opt);
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
//default route selection
let routeDef = document.createElement("option");
defOption(routeDef, "Select a route");
selRoute.appendChild(routeDef);
//default direction selection
let dirDef = document.createElement("option");
defOption(dirDef, "Select a route to choose direction");
selDir.appendChild(dirDef);
//populates route menu
for (let i = 0; i < routes.length; i++) {
    let route = routes[i];
    if (route.nodeName !== "#text") {
        let opt = document.createElement("option");
        opt.value = route.getAttribute("title").match(/\d+/)[0];
        console.log(opt.value);
        opt.innerHTML = route.getAttribute("title");
        selRoute.appendChild(opt);
    }
}
//appends menus to DOM
document.getElementById("routes").append(selRoute);
document.getElementById("dirs").append(selDir);
