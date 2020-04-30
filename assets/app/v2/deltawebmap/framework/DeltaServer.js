"use strict";

class DeltaServer extends DeltaTabView {

    constructor(app, info, menu) {
        super(app);

        //Set vars
        this.info = info;
        this.menu = menu;
        this.mountpoint = null; //This is the main location where we will be able to attach our own stuff
        this.dispatcher = new DeltaEventDispatcher();
        this.id = info.id;
        this.tribe = 0;
        this.nativeTribe = 0;
        this.activeTab = -1;
        this.menu = null;
        this.prefs = info.user_prefs;
        this.first = true; //Set to false after this is opened for the first time
        this.myLocation = null; //May or may not be null
        this.downloadTask = null; //Task that is run to create a session on this server
        this.error = null;
        this.token = new DeltaCancellationToken(null);
        this.db = new DeltaServerDatabase(this);
        this.db_sessions = []; //Managed DB sessions. In format [collection_key, session_token, options];
        this.ready = false; //Set to true when all data has been synced
        this.bottomBanner = null;

        //Create tabs
        this.tabs = [
            new TabMap(this),
            new TabDinos(this),
            new TabAdmin(this)
        ];

        //Set some content
        this.myLocation = this.info.my_location;
        if (this.info.target_tribe != null) {
            this.tribe = this.info.target_tribe.tribe_id;
            this.nativeTribe = this.info.target_tribe.tribe_id;
        } else {
            this.tribe = '*';
            this.nativeTribe = '*';
        }
    }

    GetDisplayName() {
        return this.info.display_name;
    }

    GetUrl() {
        if (this.activeTab == -1) {
            return this.info.id;
        } else {
            return this.info.id + "/" + this.tabs[this.activeTab].GetId();
        }
    }

    SubscribeRPCEvent(tag, opcode, event) {
        app.rpc.SubscribeServer(this.info.id, tag, opcode, event);
    }

    UnsubscribeRPCEvent(tag) {
        app.rpc.UnsubscribeServer(this.info.id, tag);
    }

    SetLoaderStatus(shown) {
        if (shown) {
            this.menu.loaderBadge.classList.add("server_loader_active");
        } else {
            this.menu.loaderBadge.classList.remove("server_loader_active");
        }
    }

    GetMapInfo() {
        var m = this.app.maps.maps[this.info.map_id];
        if (m == null) {
            return this.app.maps.maps["DEFAULT"];
        }
        return m;
    }

    GetIsMapSupported() {
        return this.app.maps.maps[this.info.map_id] != null;
    }

    ForceAbort(error) {
        /* Aborts a server and triggers the error badge */

        //Set state
        this.error = error;
        this.menu.alertBadge.classList.add("sidebar_server_error_badge_active");
        this.SetLoaderStatus(false);

        //If we are the active server, boot the user out
        if (this.app.lastServer == this) {
            console.log("Kicking the user out of the active server due to an error.");
            this.app.SwitchServer(this.app.msgViewActiveServerErr);
        }
    }

    CancelTokens() {
        this.token.Cancel();
        this.token = new DeltaCancellationToken(null);
        for (var i = 0; i < this.tabs.length; i += 1) {
            this.tabs[i].token = new DeltaCancellationToken(this.token);
        }
    }

    async Init(mountpoint) {
        /* Called when we are adding this server to the list of servers. */
        /* Returns null if we can load this server, or else it will return a string that will be displayed as an error. */
        await super.Init(mountpoint);

        //Add banner mounts
        this.bottomBanner = new DeltaBannerMount(DeltaTools.CreateDom("div", "server_bottom_banner", mountpoint), null);

        //Check if the current map is compatible
        if (!this.GetIsMapSupported()) {
            this.bottomBanner.AddBanner("advanced_banner_style_red", "This map isn't supported. You won't be able to view map tiles for now. Sorry about that.", [], () => { });
        }

        //Init our tabs
        for (var i = 0; i < this.tabs.length; i++) {
            var m = DeltaTools.CreateDom("div", "main_tab", this.mountpoint); //This is the mountpoint for the tab
            await this.tabs[i].OnInit(m);
        }

        //Add RPC events
        this.SubscribeRPCEvent("server", 7, (m) => this.OnCharacterLiveUpdate(m));

        return null;
    }

    CheckStatus() {
        /* Returns null if all is OK to change to this server, else returns a string */

        return this.error;
    }

    async Deinit() {
        //Cancel
        this.token.Cancel();

        //Deinit our tabs
        for (var i = 0; i < this.tabs.length; i++) {
            await this.tabs[i].OnDeinit();
            this.tabs[i].mountpoint.remove();
        }

        //Unsubscribe from RPC events
        this.UnsubscribeRPCEvent("server");
    }

    GetTribesEndpointUrl(extra) {
        return LAUNCH_CONFIG.ECHO_API_ENDPOINT + "/" + this.id + "/tribes/*" + /*this.tribe + */extra;
    }

    async WebRequestToEndpoint(extra, args, replacements) {
        var url = this.GetTribesEndpointUrl(extra);
        if (replacements !== undefined) {
            var keys = Object.keys(replacements);
            for (var i = 0; i < keys.length; i += 1) {
                url = url.replace(keys[i], replacements[keys[i]]);
            }
        }
        return await DeltaTools.WebRequest(url, args, this.token);
    }

    async DownloadData() {
        /* Downloads all of the server info */
        /* Returns true if this loaded OK, or else returns false */

        //Download data
        await this.db.Init();

        this.SetLoaderStatus(false);
        this.ready = true;

        return true;
    }

    OnSwitchedTo() {
        /* Called when this server is switched to */
        super.OnSwitchedTo();

        //If this hasn't been used yet, init the first tab
        if (this.first) {
            //Switch
            this.first = false;
            this.OnSwitchTab(0);

            //Start downloading
            this.SetLoaderStatus(true);
            this.downloadTask = this.DownloadData();
        }
    }

    OnSwitchedAway() {
        /* Called when this server is switched away from */

        super.OnSwitchedAway();
    }

    async OnSwitchTab(index) {
        /* Called when we switch tabs */

        //Check to make sure this isn't the active tab
        if (this.activeTab == index) {
            return;
        }

        //Close the old tab
        if (this.activeTab != -1 && this.activeTab != index) {
            //Hide
            this.tabs[index].mountpoint.classList.remove("main_tab_active");

            //Hide on the menu
            this.tabs[index].menu.classList.remove("v3_nav_server_bottom_item_selected");

            //Deactivate
            this.tabs[this.activeTab].OnClose();
        }

        //Remove active tabs and menu tabs
        DeltaTools.RemoveClassFromClassNames(this.mountpoint, "main_tab_active", "main_tab_active");
        DeltaTools.RemoveClassFromClassNames(this.menu, "v3_nav_server_bottom_item_selected", "v3_nav_server_bottom_item_selected");

        //Go to this tab
        if (this.activeTab != index) {
            //Run first open on this tab, if needed
            if (this.tabs[index].openCount == 0) {
                await this.tabs[index].OnFirstOpen();
            }

            //Show
            this.tabs[index].mountpoint.classList.add("main_tab_active");

            //Show on the menu
            this.tabs[index].menu.classList.add("v3_nav_server_bottom_item_selected");

            //Open the new tab
            await this.tabs[index].OnOpen();

            //Set vars
            this.tabs[index].openCount += 1;
            this.activeTab = index;
        }

        //Update
        this.app.RefreshBrowserMetadata();
    }

    async ResetTabs() {
        /* Clears out all information in tabs and resets them entirely. */
        /* Usually used when switching data tracks */

        //Clear cached info
        this.icons = null;
        this.overview = null;

        //Cancel token and create new 
        this.token.Cancel();
        this.token = new DeltaCancellationToken(null);

        //Loop through and deinit tabs
        for (var i = 0; i < this.tabs.length; i += 1) {
            var menu = this.tabs[i].menu; //Get a ref to the menu
            await this.tabs[i].OnDeinit(); //Deinit
            this.tabs[i] = new this.tabs[i].constructor(this); //Create new 
            this.tabs[i].menu = menu; //Set menu
            var m = DeltaTools.CreateDom("div", "main_tab", this.mountpoint); //Create mountpoint
            await this.tabs[i].OnInit(m); //Init
        }

        //Open first tab
        var t = this.activeTab;
        this.activeTab = -1;
        this.OnSwitchTab(t);
    }

    SubscribeEvent(sourceTag, eventTag, callback) {
        this.dispatcher.PushSubscription(this.id, sourceTag, eventTag, callback);
    }

    UnsubscribeEvent(sourceTag) {
        this.dispatcher.UnsubscribeServer(this.id, sourceTag);
    }

    DispatchEvent(eventTag, data) {
        this.dispatcher.FireSubscription({
            "opcode": eventTag
        }, data);
    }

    GetDistanceFromMe(x, y) {
        if (this.myLocation == null) {
            return null;
        }
        var a1 = Math.abs(this.myLocation.x - x);
        var a2 = Math.abs(this.myLocation.y - y);
        return Math.sqrt(Math.pow(a1, 2) + Math.pow(a2, 2));
    }

    OnCharacterLiveUpdate(m) {
        /* Called when there is a live update for a character. We check if this concerns US, and if it does, we will dispatch an event */
        /* BUG: This will fail if the user changes tribes without reloading the page, but since this is such a rare occurance, we're not going to worry about it. */

        //Check if our data exists
        if (this.info.my_profile == null) { return; }

        //Run
        for (var i = 0; i < m.updates.length; i += 1) {
            var u = m.updates[i];

            //Check if this is us
            if (u.type != 0 || u.id != this.info.my_profile.ark_id) { continue; }

            //Check if this is a location update
            if (u.x == null || u.y == null || u.z == null) { continue; }

            //Create location vector
            var vector = {
                "x": u.x,
                "y": u.y,
                "z": u.z
            };

            //Update the location
            this.myLocation = vector;

            //This is valid. Dispatch
            this.DispatchEvent(R.server_events.EVT_SERVER_MY_LOCATION_UPDATE, vector);
        }
    }

    async PushUserPrefs() {
        /* Pushes user prefs for this server */
        this.prefs = await DeltaTools.WebPOSTJson(LAUNCH_CONFIG.API_ENDPOINT + "/servers/" + this.id + "/put_user_prefs", this.prefs, this.token);
        return this.prefs;
    }

    CreateManagedDinoDbListener(add, remove, reset) {
        //Create
        var token = this.db["dinos"].AddManagedFilterListener((adds, removes) => {
            if (adds.length > 0) {
                add(adds);
            }
            if (removes.length > 0) {
                remove(removes);
            }
        }, (item) => {
            return this.CheckFilterDino(item);
        });

        //Add to collection

        return token;
    }

    CreateManagedStructureDbListener(callback) {
        //Create
        var token = this.db["structures"].AddManagedFilterListener((add, remove) => callback(add, remove), (item) => {
            return this.CheckFilterStructure(item);
        });

        //Add to collection

        return token;
    }

    CheckFilterDino(dino) {
        /* Checks if a dino fits the criteria for the active filter */
        return true;
    }

    CheckFilterStructure(structure) {
        /* Checks if a structure fits the criteria for the active filter */
        return true;
    }

    async OpenSortDialog() {
        var builder = new DeltaModalBuilder();
        var modal = this.app.modal.AddModal(670, 380);

        //Fetch dinos and get their name and ID
        var species = await app.db.species.GetAllItems();
        species.sort((a, b) => {
            return a.screen_name.localeCompare(b.screen_name);
        });
        var speciesTitles = ["Any"];
        var speciesIds = ["*"];
        for (var i = 0; i < species.length; i += 1) {
            speciesTitles.push(species[i].screen_name);
            speciesIds.push(species[i].classname);
        }

        var commonGridBuilder = new DeltaModalBuilder(false, "sort_menu_grid", "sort_menu_grid_item");
        commonGridBuilder.AddContentInputSelect("Status", ["Alive", "(Wanted) Dead or Alive", "Dead"], ["alive", "any", "dead"], "alive");
        commonGridBuilder.AddContentInputSelect("Cryo Status", ["Any", "In World", "In Cryo"], ["any", "world", "cryo"], "any");
        commonGridBuilder.AddContentInputSelect("Species", speciesTitles, speciesIds, "*");
        commonGridBuilder.AddContentInputSelect("Sex", ["Any", "Male", "Female"], ["any", "male", "female"], "any");
        builder.AddContentBuilder(commonGridBuilder);

        builder.AddAction("Apply", "POSITIVE", () => {
            modal.Close();
        });
        builder.AddAction("Clear", "NEUTRAL", () => {
            modal.Close();
        });
        modal.AddPage(builder.Build());
    }
}