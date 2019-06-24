var map = {};
map.map = null;
map.layerList = {};
map.onClickQueue = []; //List of events fired when a click is down. Only called once. Format: {"callback":function(ok, pos, context), "context":context}

map.populationMapFilter = "";

map.init = function() {
    //Create map
    map.map = L.map('map_part', {
        crs: L.CRS.Simple,
        minZoom: 0,
        /*maxBounds:L.latLngBounds(L.latLng(-256, 0), L.latLng(0, 256))*/
    }).setView([-128, 128], 2);

    //Set background color
    if(ark.session.mapBackgroundColor != null) {
        map.setBackground(ark.session.mapBackgroundColor);
    } else {
        map.restoreDefaultBackgroundColor();
    }

    //Add click events
    map.map.on("click", function(e) {
        //Convert this to coords and call all of the click queue
        var coords = map.convertFromMapPosToNormalized({
            "x":e.latlng.lng,
            "y":e.latlng.lat
        });
        coords = {
            "x":coords[0],
            "y":coords[1]
        };

        //Call all 
        for(var i = 0; i<map.onClickQueue.length; i+=1) {
            var d = map.onClickQueue[i];
            d.callback(true, coords, d.context);
        }

        //Clear
        map.onClickQueue = [];
    });

    //Add events for drawable
    map.map.on("move", draw_map.redraw);
    map.map.on('mousedown', function(e) {
        if(e.originalEvent.button == 2) {
            //Right click
            map.map.dragging.disable();
            draw_map.onDrawBegin();
        }
    });
    map.map.on('mouseup', function(e) {
        if(e.originalEvent.button == 2) {
            //Right click
            map.map.dragging.enable();
            draw_map.onDrawEnd();
        }
    });
    map.map.addEventListener('mousemove', function(e) {
        draw_map.onDrawMove(e.containerPoint, e.latlng);
    });
    map.map.on("contextmenu", function(){}); //Only used to prevent context menu

    //Trigger resize of canvas
    draw_map.onResize();

    //Show map list
    draw_map.onDoneSwitchServer();
};

map.resetPopulationMap = function(isOn, filteredClassname) {
    //Remove layer if needed
    if(map.layerList["population_map"] != null) {
        try {
            map.layerList["population_map"].removeFrom(map.map);
        } catch {

        }
    }

    //If it is on, add it
    if(isOn) {
        map.addPopulationMap(filteredClassname);
    }
}

map.addGameMapLayer = function() {
    //Create main tile layer
    L.tileLayer(ark.session.endpoint_game_map, {
        attribution: 'Studio Wildcard',
        maxNativeZoom: 5,
        maxZoom:12,
        id: 'ark_map',
        opacity: 1,
        zIndex: 1,
        bounds:map.getBounds()
    }).addTo(map.map);
}

map.onPopulationMapToggle = function(value) {
    if(value == false) {
        //Remove
        map.layerList["population_map"].removeFrom(map.map);
    } else {
        //Add
        map.addPopulationMap(map.populationMapFilter);
    }
}

map.getBounds = function() {
    return [
        [-256, 0],
        [0, 256]
    ];
}

map.addPopulationMap = function(filter) {
    var url = ark.session.endpoint_population_map.replace("{filter}", encodeURIComponent(filter));
    map.layerList["population_map"] = L.tileLayer(url, {
        maxZoom: 50,
        id: 'ark_map',
        opacity: 1,
        zIndex: 2,
        bounds: map.getBounds()
    });
    map.layerList["population_map"].addTo(map.map);
}

map.onChangePopulationMapFilter = function(dinoData) {
    //Remove
    if(map.layerList["population_map"] != null) {
        map.layerList["population_map"].removeFrom(map.map);
    }
    //Activate
    document.getElementById('population_map_check').checked = true;
    if(dinoData == null) {
        //No filter
        map.addPopulationMap("");
    } else {
        //Dino filter
        map.addPopulationMap(dinoData.classname);
    }
}

//Key: Dino ID, 
map.dino_marker_list = {};
map.dino_marker_list_index = 0;

/* Tribe dinos */
map.onEnableTribeDinos = function(callback) {
    //Query tribe dinos
    ark.serverRequestWithOfflineFallback(ark.session.endpoint_tribes, "tribe", "Failed to refresh tribe data.", function(d) {
        //Add dinos
        for(var i = 0; i<d.dinos.length; i+=1) {
            var dino = d.dinos[i];
            if(dino == null) {
                console.warn("Warning: Dino ID "+dino_id+" was not found, but was referenced.");
            }
            //Create marker
            map.addDinoMarker(dino);
        }

        //Add tribemates
        for(var i = 0; i<d.player_characters.length; i+=1) {
            var player = d.player_characters[i];
            var pos = map.convertFromNormalizedToMapPos(player.adjusted_map_pos);
            map.addMapIcon(1, player.profile.arkPlayerId.toString(), player, pos, player.steamProfile.avatarfull, null, null, null, true );
        }

        //Add structures
        map.enableStructuresLayer(d.structures, ark.session.mapData.sourceImageSize * ark.session.mapData.pixelsPerMeter);

        //Start rendering map layer. We waited to save bandwidth.
        map.addGameMapLayer();

        //Callback
        callback();
    });
}

map.structuresScale = {
    "TheCenter":800,
    "Extinction":2000
}

map.enableStructuresLayer = function(structures, mapSize) {
    var CanvasLayer = L.GridLayer.extend({
        createTile: function(coords){
            // create a <canvas> element for drawing
            var tile = L.DomUtil.create('div', 'leaflet-tile structures_layer');
            console.log("warning: recreating tiles");

            // setup tile width and height according to the options
            var size = this.getTileSize();
            /*ft.style.width = size.x;
            ft.style.height = size.y;

            //Create tile where things will be placed
            var tile = ark.createDom("div", "structures_layer", ft);*/
            tile.style.width = size.x;
            tile.style.height = size.y;
            
            //Add structures
            for(var i = 0; i<structures.length; i+=1) {
                var s = structures[i];
                if(s.priority != 1 && s.priority != 10 && s.priority != 11) {
                    continue;
                }
                var t = ark.createDom("div", "structures_item", tile);
                t.style.left = (s.map_pos.x - 4).toString() + "%";
                t.style.top = (s.map_pos.y - 4).toString() + "%";
                t.style.backgroundImage = "url('"+s.imgUrl+"')";
                t.style.transform = "scale("+(s.ppm/map.structuresScale[ark.session.mapName]).toString()+") rotate("+s.rot.toString()+"deg)";
                t.style.zIndex = (s.priority+100).toString();
            }

            //This is such an ugly hack.
            window.setTimeout(function() {
                //This is called AFTER the transform is applied, so we can apply our own. Ew.
                var scale = 256 / mapSize;
                tile.style.transform+=" scale("+scale.toString()+")"; //I hate myself for writing this line
            }, 50);
            return tile;
        }
    });
    var l = new CanvasLayer({
        maxNativeZoom: 0,
        maxZoom:12,
        id: 'structure_map',
        opacity: 1,
        zIndex: 2,
        tileSize:mapSize,
        bounds:map.getBounds()
    });
    l.addTo(map.map);
}

map.addDinoMarker = function(dino) {
    var pos = map.convertFromNormalizedToMapPos(dino.adjusted_map_pos);
    map.addMapIcon(0, dino.id, dino, pos, dino.imgUrl, map.onDinoClicked, map.onHoverDino, map.onEndHoverDino, false );
}

map.layer_list = [
    {}, //Dinos
    {} //Players
]

map.marker_name_map = {}; //Maps marker names to their layer IDs and layer indexes

map.addMapIcon = function(layerId, markerId, data, pos, img, onclick, onmouseover, onmouseout, doCrop ) {
    var icon_size = 40;
    var icon = L.icon({
        iconUrl: "/assets/images/blank_50px.png",
        shadowUrl: null,
    
        iconSize:     [icon_size, icon_size], // size of the icon
        shadowSize:   [0, 0], // size of the shadow
        iconAnchor:   [icon_size/2, icon_size/2], // point of the icon which will correspond to marker's location
        shadowAnchor: [icon_size/2, icon_size/2],  // the same for the shadow
        popupAnchor:  [icon_size/2, icon_size/2] // point from which the popup should open relative to the iconAnchor
    });

    //Add to map
    var innerIndex = Object.keys(map.layer_list[layerId]).length;
    var mapped_name = layerId.toString()+"_"+innerIndex;
    var index = innerIndex + (3000 * layerId) + 80;
    var dino_icon = L.marker(pos, {
        icon: icon,
        zIndexOffset:index+1
    }).addTo(map.map);
    

    //Add data
    dino_icon.x_mapped_name = mapped_name;
    dino_icon.x_data = data;

    //Add events
    if(onclick != null) { dino_icon.on('click', onclick); }
    if(onmouseover != null) { dino_icon.on("mouseover", onmouseover); }
    if(onmouseout != null) { dino_icon.on("mouseout", onmouseout); }

    //Remove existing markers if they exist
    map.removeMarkerById(layerId, innerIndex);

    //Add to list
    map.layer_list[layerId][innerIndex] = dino_icon;
    map.marker_name_map[mapped_name] = {
        "layerId":layerId,
        "name":markerId,
        "internalIndex":innerIndex
    };
    
    //Set real image
    map.createBackground(dino_icon._icon, img);
    if(doCrop) {
        dino_icon._icon.style.backgroundSize = "40px";
    }
}

map.removeMarkerById = function(layerId, id) {
    if(map.layer_list[layerId][id] != null) {
        map.layer_list[layerId][id].removeFrom(map.map); //Remove from map
        delete map.marker_name_map[ map.layer_list[layerId][id].x_mapped_name ];
        delete map.layer_list[layerId][id]; //Remove from list
    }
}

map.createBackground = function(e, imgUrl) {
    e.style.background = "url('"+imgUrl+"'), white";
    e.style.backgroundRepeat = "no-repeat";
    e.style.backgroundPositionX = "center";
    e.style.backgroundPositionY = "center";
    e.style.border = "2px solid black";
    e.style.borderRadius = "40px";
}

map.onDinoClicked = function(e) {
    //If the system is currently offline, stop this
    if(!ark.isCurrentServerOnline) {
        ark.onClickOnlineFeatureOffline();
        return;
    }

    var url = this.x_data.apiUrl;

    //Get pos
    var rect = this._icon.getBoundingClientRect();

    //Show
    dinopop.downloadAndShow(rect.left - 14, rect.top - 10, url, this);
}

map.setBackground = function(color) {
    document.getElementById('map_part').style.backgroundColor = color;
}

map.restoreDefaultBackgroundColor = function() {
    map.setBackground("#1c1d21");
}

map.onHoverDino = function() {
    var ele = this._icon;
    var pos = ele.getBoundingClientRect();
    var data = this.x_data;
    this.x_has_hovered_ended = false;

    //Check if we only need to interrupt a fadeout
    if(this.x_modal_removeanim != null) {
        //Cancel
        clearTimeout(this.x_modal_removeanim);
        this.x_modal_removeanim = null;

        //Fade in
        this.x_modal.classList.add("mini_modal_active");

        //Stop creation
        return;
    }
    
    //Create element
    var e = ark.createDom("div", "mini_modal mini_modal_anim");

    //Set position
    e.style.top = pos.top - 10;
    e.style.left = pos.left - 14;

    //Add icon
    var icon = ark.createDom("img", "mini_modal_icon", e);
    icon.src = "/assets/images/blank_50px.png";
    map.createBackground(icon, data.imgUrl);

    //Create content
    var ce = ark.createDom("div", "mini_modal_content", e);
    ark.createDom("div", "mini_modal_title", ce).innerText = data.tamedName;
    ark.createDom("div", "mini_modal_sub", ce).innerText = data.displayClassname+" - Lvl "+data.level;;

    //Add to body and set ref on it
    this.x_modal = e;
    document.body.appendChild(e);

    //Fade in
    setTimeout(function() {
        e.classList.add("mini_modal_active");
    }, 10);
}

map.onEndHoverDino = function() {
    //Do not run if already running.
    if(this.x_modal == null) {
        return;
    }

    //Do not run if we're currently loading the dino data
    if(this.x_is_loading) {
        this.x_has_hovered_ended = true;
        return;
    }

    map.doEndHover(this);    
}

map.doEndHover = function(e) {
    //Remove
    var ele = e.x_modal;
    e.x_modal = null;
    setTimeout(function() {
        ele.remove();
    }, 100);

    //Anim out
    ele.classList.remove("mini_modal_active");
}

map.convertFromNormalizedToMapPos = function(pos) {
    ///This map is weird. 0,0 is the top right, while -256, 256 is the bottom right corner. Invert x
    return [
        (-pos.y * 256),
        (pos.x * 256)
    ];
}

map.convertFromMapPosToNormalized = function(pos) {
    ///This map is weird. 0,0 is the top right, while -256, 256 is the bottom right corner. Invert x
    return [
        (-pos.y / 256),
        (pos.x / 256)
    ];
}

map.addClickEvent = function(callback, context) {
    //Push
    map.onClickQueue.push({
        "callback":callback,
        "context":context
    })
};

map.remoteUpdateMultipleRealtime = function(e) {
    //Loop through and check names
    var keys = Object.keys(map.marker_name_map);
    for(var i = 0; i<keys.length; i+=1) {
        var entry = map.marker_name_map[keys[i]];
        
        //Check if this matches any of our items
        for(var j = 0; j<e.length; j+=1) {
            var search = e[j];
            if(search.t == entry.layerId && search.id == entry.name) {
                //Update this
                var marker = map.layer_list[entry.layerId][entry.internalIndex];
                var pos = map.convertFromNormalizedToMapPos({
                    "x":search.mx,
                    "y":search.my
                });
                marker.setLatLng(L.latLng( pos[0], pos[1] ));
            }
        }
    }
}

var draw_map = {};
draw_map.e = document.getElementById('map_draw_part');
draw_map.c = draw_map.e.getContext('2d');

draw_map.points = [];

draw_map.txBuffer = [];
draw_map.rxBuffer = [];

draw_map.activeMapId = -1;

draw_map.reset = function() {
    draw_map.lastZoom = null;
    draw_map.isFirst = true;

    draw_map.points = [];
    draw_map.c.clearRect(0, 0, draw_map.c.canvas.width, draw_map.c.canvas.height);
}

draw_map.onResize = function() {
    //Resize to match the frame of the standard map
    var map = document.getElementById('map_part');
    draw_map.e.width = map.clientWidth;
    draw_map.e.height = map.clientHeight;

    //Redraw
    draw_map.redraw();
}
window.addEventListener("resize", draw_map.onResize);

draw_map.redraw = function() {
    draw_map.c.clearRect(0, 0, draw_map.c.canvas.width, draw_map.c.canvas.height);
    var center = map.map.getBounds().getNorthWest();
  
    draw_map.c.strokeStyle = "#df4b26";
    draw_map.c.lineJoin = "round";
    draw_map.c.lineWidth = 5;

    var zoom = map.map.getZoom();

    if(draw_map.points.length >= 1) {
        var p;
        var pos;
        draw_map.c.beginPath();
        for(var i = 1; i<draw_map.points.length; i+=1) {
            p = draw_map.points[i];
            pos = map.map.project(L.latLng(p.ex - center.lat, p.ey - center.lng), zoom);
            if(p.n) {
                draw_map.c.stroke();
                draw_map.c.beginPath();
                draw_map.c.moveTo(pos.x, pos.y);
            } else {
                draw_map.c.lineTo(pos.x, pos.y);
            }
        }
        draw_map.c.stroke();
        draw_map.c.beginPath();
    }
}

draw_map.isDown = false;
draw_map.isFirst = true;
draw_map.lastPoint = null;

draw_map.onDrawBegin = function() {
    draw_map.isDown = true;
}

draw_map.onDrawEnd = function() {
    draw_map.isDown = false;
    draw_map.isFirst = true;
    draw_map.lastPoint = null;

    //Flush the latest buffer to the gateway
    draw_map.flushTx();

    //Flush the rx buffer into the standard buffer
    for(var i = 0; i<draw_map.rxBuffer.length; i+=1) {
        draw_map.points.push( draw_map.rxBuffer[i] );
    }
    draw_map.rxBuffer = [];
}

draw_map.lastZoom = null;

draw_map.onDrawMove = function(screenPos, mapPos) {
    if(!draw_map.isDown) { return; }

    //Check if we're close enough to the last to ignore
    /*if(draw_map.lastPoint != null) {
        if(Math.abs(draw_map.lastPoint.x - screenPos.x) <= 2) {return;}
        if(Math.abs(draw_map.lastPoint.y - screenPos.y) <= 2) {return;}
    }*/
    draw_map.lastPoint = screenPos;

    //Push to map
    var p = {
        "ex":mapPos.lat,
        "ey":mapPos.lng,
        "n":draw_map.isFirst
    };

    var pr = {
        "ex":draw_map.roundNetwork(mapPos.lat),
        "ey":draw_map.roundNetwork(mapPos.lng),
        "n":draw_map.isFirst
    };

    //Add any setting changes
    var zoom = map.map.getZoom();
    if(draw_map.lastZoom != zoom) {
        draw_map.lastZoom = zoom;
        p.z = zoom;
    }

    draw_map.isFirst = false;
    draw_map.points.push(p);
    draw_map.txBuffer.push(pr);
    
    //Now, draw
    if(p.n) {
        draw_map.c.moveTo(screenPos.x, screenPos.y);
    } else {
        draw_map.c.lineTo(screenPos.x, screenPos.y);
    }
    draw_map.c.stroke();
}

draw_map.injectLines = function(points) {
    //Interrupt any currently active drawing and inject these points.
    //Start new
    draw_map.c.stroke();
    draw_map.c.beginPath();

    //Draw lines
    var center = map.map.getBounds().getNorthWest();
    var zoom = map.map.getZoom();
    var pos;
    for(var i = 0; i<points.length; i+=1) {
        var p = points[i];
        pos = map.map.project(L.latLng(p.ex - center.lat, p.ey - center.lng), zoom);
        if(p.n) {
            draw_map.c.stroke();
            draw_map.c.beginPath();
            draw_map.c.moveTo(pos.x, pos.y);
        } else {
            draw_map.c.lineTo(pos.x, pos.y);
        }

        //Push for redraw
        if(!draw_map.isDown) {
            draw_map.points.push(p); //Push now
        } else {
            draw_map.rxBuffer.push(p); //This'll be applied to the redraw buffer when we release the mouse button
        }
        
    }

    //Now apply and reset
    draw_map.c.stroke();
    draw_map.c.beginPath();

    //And jump back if needed
    if(draw_map.points.length > 0) {
        var p = draw_map.points[draw_map.points.length-1];
        pos = map.map.project(L.latLng(p.ex - center.lat, p.ey - center.lng), zoom);
        draw_map.c.moveTo(pos.x, pos.y);
    }
}

draw_map.onRx = function(msg) {
    if(draw_map.activeMapId == msg.mapId && msg.senderSessionId != gateway.sessionId) {
        //This was not sent by us and it is for this targetted map ID
        draw_map.injectLines(msg.points);
    }
}

draw_map.flushTx = function() {
    //Flush the tx buffer, up to 100 points at a time
    while(draw_map.txBuffer.length > 0) {
        //Get up to 100 items at once
        var items = draw_map.txBuffer.splice(0, 100);

        //Send
        var p = {
            "points":items,
            "mapId":draw_map.activeMapId
        };
        gateway.sendMsg(2, p);
    }
}

draw_map.roundNetwork = function(e) {
    //Rounds a number to send over the network
    return Math.round(e * 100) / 100;
}

draw_map.onDeinitCurrentServer = function() {
    //Clear the map
    draw_map.reset();
}

draw_map.onDoneSwitchServer = function() {
    //Fetch new maps
    ark.serverRequest("https://ark.romanport.com/api/servers/"+ark.currentServerId+"/maps", {}, function(c) {
        //If there is a map, choose the first one on the list
        if(c.maps.length >= 1) {
            var m = c.maps[0];
            draw_map.chooseMap(m.name, m.url, m.id);
        }

        //Set picker
        draw_map.setMapPicker(c.maps);
    });
}

draw_map.latestMaps = [];
draw_map.setMapPicker = function(data) {
    draw_map.latestMaps = data;
    var e = document.getElementById('map_btn_layers_content');
    ark.removeAllChildren(e);

    //Add maps
    for(var i = 0; i<data.length; i+=1) {
        var m = data[i];
        var c = ark.createDom("div", "map_layer_select_item", e);
        c.x_id = m.id;
        c.x_url = m.url;
        c.x_name = m.name;
        c.innerText = m.name;
        c.addEventListener("click", draw_map.onChooseNewMap);
        var d = ark.createDom("div", "map_layer_select_item_delete", c);
        d.addEventListener("click", draw_map.onChooseDeleteMap);
        if(m.isNextStepDelete) {
            d.classList.add("map_layer_select_item_delete_forever");
        }
    }

    //Add the add button
    var c = ark.createDom("div", "map_layer_select_item_add", e);
    c.innerText = "Add Map";
    c.addEventListener("click", draw_map.onChooseCreateMap);

    //Add bottom
    ark.createDom("div", "map_layer_select_item_bottom", e).innerText = "Draw on the map by holding right click. Drawings are synced in realtime with tribemates.";

    //Show
    document.getElementById('map_btn_layers').classList.remove("top_nav_btn_hidden");
}

draw_map.onChooseNewMap = function() {
    console.log("Switching to map ID "+this.x_id);
    draw_map.chooseMap(this.x_name, this.x_url, this.x_id);
}

draw_map.chooseMap = function(name, url, id) {
    //Clear
    draw_map.reset();

    //Set map
    draw_map.activeMapId = id;
    draw_map.changeTitleName(name);

    //Request from the server
    ark.serverRequest(url, {}, function(c) {
        draw_map.points = c.points;
        draw_map.redraw();
    });
}

draw_map.onChooseDeleteMap = function(evt) {
    //Stop continuation
    evt.stopImmediatePropagation();

    //Get parent URL
    var context = this;
    var parentUrl = this.parentNode.x_url;
    var parentName = this.parentNode.x_name;
    var parentId = this.parentNode.x_id;
    
    //The first click on this clears, and the second click deletes. Check if we have cleared yet.
    if(!this.classList.contains("map_layer_select_item_delete_forever")) {
        //Set the flag on the entry in the saved maps list
        //Rename on our stored list
        for(var i = 0; i<draw_map.latestMaps.length; i+=1) {
            if(draw_map.latestMaps[i].id == parentId) {
                draw_map.latestMaps[i].isNextStepDelete = true;
                break;
            }
        }

        //Clear
        var body = {
            "name":parentName,
            "doClear":true
        };
        ark.serverRequest(parentUrl, {"type":"post", "body":JSON.stringify(body)}, function() {
            //Now handled from the gateway.
        });
    } else {
        //Delete
        ark.serverRequest(parentUrl, {"type":"delete", "body":"{}"}, function() {
            //Now handled from the gateway.
        });
    }
}

draw_map.onChooseCreateMap = function() {
    pform.show([
        {
            "type":"input",
            "name":"Map Name",
            "id":"f_mapname"
        },
        {
            "type":"bottom",
            "text":"This map will sync across all of your tribemates and will save automatically. Only your tribe can see this map. Hold right click on the map to draw."
        }
    ], "Create New Map", "Create Map", function(){

        //The map request was ok. Continue and create the map.
        var name = document.getElementById('f_mapname').value;
        if(name.length > 24 || name.length < 2) {
            return [
                {
                    "id":"f_mapname",
                    "text":"2-24 characters are required."
                }
            ];
        }
        
        //Now, create it 
        var body = {
            "name":name
        };
        ark.serverRequest("https://ark.romanport.com/api/servers/"+ark.currentServerId+"/maps", {
            "type":"post",
            "body":JSON.stringify(body)
        }, function(c) {
            //Set this to the active map
            draw_map.activeMapId = c.id;
            draw_map.changeTitleName(name);

            //Adding is now handled from the gateway.
        });

    }, function(){});
}

draw_map.changeTitleName = function(name) {
    document.getElementById('map_btn_layers_title').innerText = name;
}

draw_map.onGatewayMapEvent = function(msg) {
    switch(msg.mapOpcode) {
        case 0: draw_map.onRemoteDelete(msg.id, msg.name); break;
        case 1: draw_map.onRemoteCreate(msg.id, msg.name); break;
        case 2: draw_map.onRemoteRename(msg.id, msg.name); break;
        case 3: draw_map.onRemoteClear(msg.id, msg.name); break;
    }
}

draw_map.onRemoteDelete = function(id, name) {
    //Remove it from the stored list
    for(var i = 0; i<draw_map.latestMaps.length; i+=1) {
        if(draw_map.latestMaps[i].id == id) {
            draw_map.latestMaps.splice(i, 1);
            break;
        }
    }

    //Refresh
    draw_map.setMapPicker(draw_map.latestMaps);

    //If this is the active map, clear and switch away from any
    if(draw_map.activeMapId == id) {
        draw_map.reset();
        draw_map.activeMapId = -1;
        draw_map.changeTitleName("Add Layer...");
    }
}

draw_map.onRemoteCreate = function(id, name) {
    //Add it to the list of maps and reload the list
    var entry = {
        "name":name,
        "id":id,
        "url":"https://ark.romanport.com/api/servers/"+ark.currentServerId+"/maps/"+id
    };
    draw_map.latestMaps.push(entry);
    draw_map.setMapPicker(draw_map.latestMaps);
}

draw_map.onRemoteRename = function(id, name) {
    //Rename on our stored list
    for(var i = 0; i<draw_map.latestMaps.length; i+=1) {
        if(draw_map.latestMaps[i].id == id) {
            draw_map.latestMaps[i].name = name;
            break;
        }
    }

    //Refresh
    draw_map.setMapPicker(draw_map.latestMaps);

    //If this is the active map, rename
    if(draw_map.activeMapId == id) {
        draw_map.changeTitleName(name);
    }
}

draw_map.onRemoteClear = function(id, name) {
    //If this matches the active ID, clear
    if(draw_map.activeMapId == id) {
        draw_map.reset();
    }
}

