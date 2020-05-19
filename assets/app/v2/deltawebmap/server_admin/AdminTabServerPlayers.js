"use strict";

class AdminTabServerPlayers extends SubTabMenuTabModule {

    constructor() {
        super("Players");
        this.page = 0;
        this.mountpoint = null;
    }

    Attach() {
        this.mountpoint = DeltaTools.CreateDom("div", null);
        return this.mountpoint;
    }

    OnFirstOpened() {
        this.FetchPlayers();
    }

    async FetchPlayers() {
        //Load
        var results = await DeltaTools.WebRequest(this.server.BuildServerRequestUrl("/admin/players?page=" + this.page), {}, this.server.token);

        //Add players
        for (var i = 0; i < results.players.length; i += 1) {
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
            this.mountpoint.appendChild(this.CreatePlayerDom(results.players[i]));
        }
    }

    CreatePlayerDom(data) {
        var d = DeltaTools.CreateDom("div", "admintab_players_user");
        DeltaTools.CreateDom("img", "admintab_players_user_icon", d).src = data.icon;
        if (data.delta_account) {
            DeltaTools.CreateDom("div", "admintab_players_user_dwm", d, "DWM");
        }
        DeltaTools.CreateDom("div", "admintab_players_user_name", d, data.name);
        DeltaTools.CreateDom("div", "admintab_players_user_tribe", d, data.tribe_id.toString() + " / " + this.server.GetTribeByIdSafe(data.tribe_id).tribe_name);
        //DeltaTools.CreateDom("div", "admintab_players_user_time_label", d, "LAST SEEN");
        DeltaTools.CreateDom("div", "admintab_players_user_time", d, new moment(data.last_seen).format('MMMM Do, YYYY - h:mm A '));
        return d;
    }

}