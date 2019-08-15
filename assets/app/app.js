var APP_VERSION = 1;
var ROOT_URL = "https://deltamap.net/api/";
var APP_HASH = "2185ee3957de4f8d9ea23f6f4c5cf8535cff89d1";

var main = {};

/* Vars */
main.currentServerId = null;
main.currentServerOnline = true;
main.me = null;
main.sessionToken = 0; //Changed every time we load a new server
main.HUDMessages = [];
main.isDemo = false;
/* Tools */

main.serverRequest = function(url, args, callback) {
    var xmlhttp = new XMLHttpRequest();
    var startId = main.sessionToken;
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            //Get reply
            var reply = this.responseText;
            if(args.isJson == null || args.isJson == true) {
                reply = JSON.parse(this.responseText);
            }

            //Check if we should cancel
            if((args.enforceServer != null && args.enforceServer) && startId != main.sessionToken) {
                main.log("server-request", 1, "Stopping reply because server changed when it was enforced.");
                return;
            }

            //Callback
            callback(reply);
        } else if(this.readyState == 4) {
            if(args.failOverride != null) {
                //Check if we should cancel
                if((args.enforceServer != null && args.enforceServer) && startId != main.sessionToken) {
                    main.log("server-request", 1, "Stopping reply because server changed when it was enforced.");
                    return;
                }
                
                args.failOverride(this);
            } else {
                if (this.readyState == 4 && this.status == 502) {
                    //This is the error code when the subserver is offline.
                } else if (this.readyState == 4 && this.status == 500) {
                    //Server error.
                    form.add("Server Error", [
                        {
                            "type":"text",
                            "text":"The server reported an error. Try again later."
                        }
                    ], [
                        {
                            "type":0,
                            "name":"Okay",
                            "callback":function() {
                                
                            }
                    }], "xform_area_interrupt");
                } else if (this.readyState == 4 && this.status == 503) {
                    //Server is down
                    form.add("Server Unavailable", [
                        {
                            "type":"text",
                            "text":"The server is under high load and cannot be reached. Please try again later."
                        }
                    ], [
                        {
                            "type":0,
                            "name":"Reload",
                            "callback":function() {
                                window.location.reload();
                            }
                    }], "xform_area_interrupt");
                } else if (this.readyState == 4 && this.status == 401) {
                    //Not authenticated
                    form.add("You've Been Signed Out", [
                        {
                            "type":"text",
                            "text":"The account owner signed you out. Please sign in again."
                        }
                    ], [
                        {
                            "type":0,
                            "name":"Sign In",
                            "callback":function() {
                                window.location = "/login/";
                            }
                    }], "xform_area_interrupt");
                } else if (this.readyState == 4) {
                    //Other error
                }
            }
        }
    }
    if(args.type == null) {
        args.type = "GET";
    }
    xmlhttp.open(args.type, url, true);
    if(args.nocreds == null || !args.nocreds) {
        //Include auth. If we don't have a token, redirect to login now
        if(main.getAccessToken() == null) {
            window.location = "/login/";
        } else {
            xmlhttp.setRequestHeader("Authorization", "Bearer "+main.getAccessToken());
        }
    }
    xmlhttp.send(args.body);
}

main.getAccessToken = function() {
    if(main.isDemo) {
        return "demo-user";
    }
    return localStorage.getItem("access_token");
}

main.log = function(topic, level, msg) {
    console.log("["+topic+"] "+msg);
}

main.foreach = function(data, loop) {
    for(var i = 0; i<data.length; i+=1) {
        loop(data[i], i);
    }
}

main.onGatewayDisconnect = function() {
    main.log("gateway-status", 0, "Gateway disconnected.");
    main.addHUDMessage("Reconnecting...", "#4973c9", "/assets/icons/baseline-cloud-24px.svg", 2, 10);
}

main.onGatewayConnect = function() {
    main.log("gateway-status", 0, "Gateway connected.");
    main.removeHUDMessage(2);
}

main.removeAllChildren = function(e) {
    while(e.firstChild != null) {
        e.firstChild.remove();
    }
}

main.setClass = function(e, name, status) {
    if(status) {
        e.classList.add(name);
    } else {
        e.classList.remove(name);
    }
}

main.setLoader = function(status) {
    main.setClass(document.getElementById('loader_view'), "loader_view_hidden", status);
}

main.createDom = function(type, classname, parent) {
    var e = document.createElement(type);
    e.className = classname;
    if(parent != null) {
        parent.appendChild(e);
    }
    return e;
}

main.generateTextTemplate = function(fontHeight, color, maxWidth) {
    //Generate a random length
    var length = maxWidth * ((Math.random() * 0.5) + 0.25);
    var height = (fontHeight - 2);

    //Create element
    var e = main.createDom("div", "glowing");
    e.style.width = length.toString()+"px";
    e.style.height = height.toString()+"px";
    e.style.marginTop = "1px";
    e.style.marginBottom = "1px";
    e.style.borderRadius = height.toString()+"px";
    e.style.backgroundColor = color;
    e.style.display = "inline-block";

    return e;
}

main.createNumberWithCommas = function(data) {
    //https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
    return Math.round(data).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

main.createCustomDinoEntry = function(img_url, title_text, sub_text, customClass) {
    //Create html node
    var e = document.createElement('div');
    e.className = "dino_entry "+customClass;

    var img = document.createElement('img');
    img.src = img_url;
    e.appendChild(img);

    var title = document.createElement('div');
    title.className = "dino_entry_title";
    title.innerText = title_text;
    e.appendChild(title);

    var sub = document.createElement('div');
    sub.className = "dino_entry_sub";
    sub.innerText = sub_text;
    e.appendChild(sub);

    return e;
}

main.refreshHUDMessages = function() {
    //Find the highest priority message
    var msg = null;
    var priority = -1;
    for(var i = 0; i<main.HUDMessages.length; i+=1) {
        var m = main.HUDMessages[i];
        if(m.priority >= priority) {
            msg = m;
            priority = m.priority;
        }
    }

    //Get host
    var b = document.getElementById('hud_bar');

    //Cancel existing timers
    if(b.x_timer != null) {
        clearTimeout(b.x_timer);
    }

    //Show or hide
    if(msg == null) {
        b.classList.remove("hud_bar_active");
        b.x_last_id = null;
    } else {
        //Check if this is the same ID
        if(b.x_last_id == msg.id) {
            return;
        }
        b.x_last_id = msg.id;

        //If one is already displayed, set a timer before showing
        if(b.classList.contains("hud_bar_active")) {
            b.classList.remove("hud_bar_active");
            b.x_timer = window.setTimeout(function() {
                b.x_timer = null;
                b.innerText = msg.title;
                b.style.backgroundColor = msg.color;
                main.createDom("img", "hub_bar_img", b).src = msg.img;
                b.classList.add("hud_bar_active");
            }, 200);
        } else {
            b.innerText = msg.title;
            b.style.backgroundColor = msg.color;
            main.createDom("img", "hub_bar_img", b).src = msg.img;
            b.classList.add("hud_bar_active");
        }
    }
}

main.addHUDMessage = function(title, color, img, id, priority) {
    //Create
    var o = {
        "title":title,
        "color":color,
        "img":img,
        "id":id,
        "priority":priority
    };
    main.HUDMessages.push(o);
    main.refreshHUDMessages();
}

main.removeHUDMessage = function(id) {
    //Find and remove
    for(var i = 0; i<main.HUDMessages.length; i+=1) {
        var m = main.HUDMessages[i];
        if(m.id >= id) {
            main.HUDMessages.splice(i, 1);
            i--;
        }
    }
    main.refreshHUDMessages();
}

main.makeServerList = function(onClick) {
    //Create elements
    var body = main.createDom("div", "dino_sidebar_helper server_picker_helper");
    for(var i = 0; i<main.me.servers.length; i+=1) {
        var s = main.me.servers[i];
        main.makeServerEntry(body, s.id, s.display_name, s.map_name, s.image_url, onClick);
    }

    return body;
}

main.makeServerEntry = function(body, id, name, sub, icon, onclick) {
    var b = main.createDom("div", "dino_sidebar_item", body);
    b.x_id = id;
    main.createDom("img", "server_picker_img", b).src = icon;
    main.createDom("div", "dino_sidebar_item_title", b).innerText = name;
    main.createDom("div", "dino_sidebar_item_sub", b).innerText = sub;
    b.addEventListener("click", onclick);
}

main.createSidebarServerList = function() {
    var body = main.makeServerList(function() {
        var id = this.x_id;
        
    });

    //Add "create server" option
    main.createDom("div", "dino_sidebar_section_header", body);
    main.makeServerEntry(body, null, "Create Server", "Add your own server!", "/assets/icons/baseline-add-24px.svg", main.onClickServer);
}

main.createServer = function() {
    window.location = "/app/servers/create/";
}

main.createLink = function(parent, text, url) {
    var d = main.createDom("a", "", parent);
    d.href = url;
    d.target = "_blank";
    d.innerText = text;
}

main.checkUpdates = function() {
    main.serverRequest("https://config.deltamap.net/prod/frontend/web_version.json", {"nocreds":true, "failOverride": function() {
        //Offline
        main.addHUDMessage("Limited or no internet connection.", "#eb3434", "/assets/icons/baseline-signal_cellular_connected_no_internet_0_bar-24px.svg", 3, 11);
    }}, function(d) {
        main.removeHUDMessage(3);
        var outdated = APP_HASH != d.latest_hash;
        if(outdated) {
            main.addHUDMessage("There is an update available. Reload the page to update!", "#eb3434", "/assets/icons/baseline-cloud_download-24px.svg", 4, 9);
        }
    });
}

main.logout = function() {
    form.add("Log Out", [
        {
            "type":"text",
            "text":"Are you sure you'd like to sign out? You will have to sign in again."
        }
    ], [
        {
            "type":0,
            "name":"Log Out",
            "callback":function() {
                form.add("Logged Out", [
                    {
                        "type":"text",
                        "text":"You signed out."
                    }
                ], [
                    {
                        "type":0,
                        "name":"Sign In Again",
                        "callback":function() {
                            window.location = "/login/";
                        }
                    }
                ], "xform_area_interrupt");
                main.serverRequest(ROOT_URL+"users/@me/tokens/@this/devalidate", {"type":"POST"}, function() {});
            }
        },
        {
            "type":1,
            "name":"Cancel",
            "callback":function() {
                
            }
    }], "xform_area_interrupt");
}

/* Init */

main.init = function() {
    //Set up demo if needed
    main.isDemo = window.location.hash == "#dwm-demo-frontpage-src";
    if(main.isDemo) {
        main.initDemo();
    }

    //First, we'll download user data
    main.serverRequest(ROOT_URL+"users/@me/", {}, function(d) {
        main.log("Init", 0, "User data downloaded.");
        main.me = d;

        //Set placeholders
        frontend.setUserData(d);
        frontend.showServerPlaceholders();

        if(!main.isDemo) {
            main.addHUDMessage("Connecting...", "#4973c9", "/assets/icons/baseline-cloud-24px.svg", 2, 10);
            main.setLoader(true);
    
            //Now, we'll connect to the gateway
            gateway.create(function() {
                main.log("Init", 0, "Gateway connected.");
            }, main.onGatewayDisconnect, main.onGatewayConnect);
    
            //We'll load the last server
            main.selectLastServer();
        } else {
            //Show just the demo server
            main.setLoader(true);
            ark.init(main.me.servers[0]);
        }
    });
}

main.initDemo = function() {
    //Sets up the demo view 
    document.getElementsByClassName("top_nav_title_area")[0].style.display = "none";
    document.getElementsByClassName("bottom_nav")[0].style.display = "none";
    document.getElementsByClassName("bottom_nav_me_badge")[0].style.display = "none";
    document.getElementById('dino_sidebar').style.bottom = "0";
}

main.selectLastServer = function() {
    var lastServerId = localStorage.getItem("latest_server");
    var d = null;
    for(var i = 0; i<main.me.servers.length; i+=1) {
        if(main.me.servers[i].id == lastServerId) {
            d = main.me.servers[i];
        }
    }
    if(d != null) {
        ark.initAndVerify(d, true);
    } else {
        ark.showServerPicker();
    }
}