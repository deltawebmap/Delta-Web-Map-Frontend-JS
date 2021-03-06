"use strict";

class DeltaTools {

    constructor() {

    }

    static async _BaseWebRequest(url, type, method, body, token, args) {
        if (token === undefined || token == null) {
            token = new DeltaCancellationToken(null);
        }
        if (args == null) {
            args = {};
        }

        //ARGS API PARAMS:
        //getLoadedClientCallback : A callback that is called with the xhr client whem we successfully load, before we resolve
        //noauth : When set to true, does not send auth data

        return new Promise(function (resolve, reject) {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function () {
                if (this.readyState === 4 && this.status === 200) {
                    //Handle
                    if (token.IsValid()) {
                        //If requested, allow the handler to use the raw client
                        if (args.getLoadedClientCallback != null) {
                            args.getLoadedClientCallback(xmlhttp);
                        }

                        //Respond
                        resolve(this.response);
                    }
                } else if (this.readyState === 4) {
                    if (token.IsValid()) {
                        //Check if we're logged out
                        if (this.status == 401) {
                            window.location = "/auth/?client_id=" + window.LAUNCH_CONFIG.AUTH.AUTH_CLIENT_ID;
                        } else {
                            reject({
                                status: this.status
                            });
                        }
                    }
                }
            }
            xmlhttp.open(method, url, true);
            xmlhttp.responseType = type;
            if (args.noauth == false || args.noauth == null) {
                xmlhttp.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("access_token"));
            }
            xmlhttp.send(body);
        });
    }

    static async WebRequest(url, args, token) {
        /* Legacy; Launches with a JSON response */
        
        //Get type
        var type = "GET";
        if (args.type !== undefined) {
            type = args.type;
        }

        //Launch
        var r = await DeltaTools._BaseWebRequest(url, "text", type, null, token, args);
        return JSON.parse(r);
    }

    static async WebPOSTJson(url, data, token) {
        /* Legacy; Launches with a JSON response */

        //Launch
        var r = await DeltaTools._BaseWebRequest(url, "text", "POST", JSON.stringify(data), token);
        return JSON.parse(r);
    }

    static async WebRequestBinary(url, token, args) {
        /* Responds with a DataView to use */

        //Launch
        var r = await DeltaTools._BaseWebRequest(url, "arraybuffer", "GET", null, token, args);
        return new DataView(r);
    }

    static CreateDom(type, classname, parent, text, debug) {
        var e = document.createElement(type);
        if (classname != null) {
            e.className = classname;
        }
        if (parent != null) {
            parent.appendChild(e);
        }
        if (text != null) {
            e.innerText = text;
        }
        if (debug) {
            e.style.backgroundColor = "rgb(" + (Math.random() * 254) + ", " + (Math.random() * 254) + ", " + (Math.random() * 254) + ")";
        }
        return e;
    }

    static CreateNumberWithCommas (data) {
        //https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
        return Math.round(data).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    static CreateStatusBox(status, container) {
        var e = DeltaTools.CreateDom("div", "status_box_display", container);
        var s = statics.STATUS_STATES[status];
        e.innerText = s.text;
        e.style.color = s.modal_color;

        return e;
    }

    static RemoveClassFromClassNames(container, search, target) {
        var e = container.getElementsByClassName(search);
        for (var i = 0; i < e.length; i += 1) {
            e[i].classList.remove(target);
        }
    }

    static ForEachKey(data, callback) {
        var k = Object.keys(data);
        for (var i = 0; i < k.length; i += 1) {
            callback(data[k[i]], k[i]);
        }
    }

    static CheckIfItemExistsInArrayComparator(dataset, data, compare) {
        for (var i = 0; i < dataset.length; i += 1) {
            if (compare(dataset[i], data)) {
                return true;
            }
        }
        return false;
    }

    static async AsyncDelay(time) {
        return new Promise(function (resolve, reject) {
            window.setTimeout(() => {
                resolve();
            }, time);
        });
    }

    static async AwaitAnimationFrame() {
        return new Promise(function (resolve, reject) {
            window.requestAnimationFrame(() => {
                resolve();
            });
        });
    }

    static SetClassStatus(e, classname, active) {
        if (active) {
            e.classList.add(classname);
        } else {
            e.classList.remove(classname);
        }
    }

    static IsElementInEventPath(event, check) {
        var target = event.target;
        while (target.parentNode != null) {
            if (check == target) {
                return true;
            }
            target = target.parentNode;
        }
        return false;
    }

    static CopyToClipboard(text) {
        var copy = DeltaTools.CreateDom("input", null, document.body);
        copy.style.position = "fixed";
        copy.style.top = "-5000px";
        copy.type = "text";
        copy.value = text;
        copy.select();
        document.execCommand("copy");
        copy.remove();
    }

    static CreateTribeLabel(server, id, parent) {
        var d = DeltaTools.CreateDom("div", "tribelabel_container", parent);
        d._name = DeltaTools.CreateDom("div", "tribelabel_name", d, server.GetTribeByIdSafe(id));
        d._id = DeltaTools.CreateDom("div", "tribelabel_id", d, "ID " + id);
        return d;
    }

    static RemoveAllChildren(node) {
        while (node.firstChild) {
            node.removeChild(node.lastChild);
        }
    }

    static async DownloadImageAsync(url) {
        return await new Promise((resolve, reject) => {
            let img = new Image();
            img.setAttribute('crossorigin', 'anonymous');
            img.onload = function () {
                resolve(img);
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    static OpenFileDialog(accept, callback) {
        var input = DeltaTools.CreateDom("input", null, document.body);
        input.style.position = "fixed";
        input.style.top = "-5000px";
        input.type = "file";
        input.accept = accept;
        input.click();
        input.addEventListener("change", () => {
            if (input.files.length > 0) {
                callback(input.files[0]);
            }
            input.remove();
        });
    }

    static OpenImageFileDialog(callback) {
        this.OpenFileDialog("image/png, image/jpeg", callback);
    }

    static CreateList(dataset, createElement, clickCallback) {
        //Create container
        var container = DeltaTools.CreateDom("div", null);

        //Create each
        for (var i = 0; i < dataset.length; i += 1) {
            //Make
            var m = createElement(dataset[i]);
            container.appendChild(m);

            //Set events
            m._data = dataset[i];
            m.addEventListener("click", (evt) => {
                clickCallback(evt.currentTarget._data);
            });
        }

        return container;
    }

}