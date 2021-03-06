"use strict";

class DeltaServerTab {

    /* This is an abstract class that defines a tab shown to the user */

    constructor(server) {
        this.server = server;
        this.openCount = 0;
        this.menu = null;
        this.token = new DeltaCancellationToken(server.token);
        this.top = null;
        this.lastQuery = "";
    }

    GetDisplayName() {
        /* Returns the display name as a string */
        
    }

    GetId() {
        /* Returns the display name as a string */
        
    }

    IsEnabled() {
        return true;
    }

    CreateMenuItem(container) {
        var btn = DeltaTools.CreateDom("div", "v3_nav_server_bottom_item", container);
        btn.innerText = this.GetDisplayName();
        return btn;
    }

    async RedownloadData() {
        /* Used when tribes are changing */
    }

    OnInit(mountpoint) {
        /* Called when this tab (and thus, the server) is initially created */
        this.mountpoint = mountpoint;

        //Create top strip
        this.top = DeltaTools.CreateDom("div", "server_top_strip", mountpoint);
    }

    async OnFirstOpen() {
        /* Called when this tab is opened for the first time */
        
    }

    async OnOpen() {
        /* Called when this tab is switched to */
        
    }

    async OnClose() {
        /* Called when this tab is switched away from */
        
    }

    async OnDeinit() {
        /* Called when this tab (and thus, the server) is closed */
        
    }

    GetIsSearchQueryEnabled() {
        //Returns if we should enable the search query
        return true;
    }

    GetQueryPlaceholder() {
        //Returns the string to place in the query input box
        return "Search Tribe";
    }

    OnQueryChanged(value) {
        //When the current query changes
    }

}