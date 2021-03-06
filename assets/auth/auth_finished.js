function FinishLogon() {
    //Make sure token matches
    if (localStorage.getItem("delta_logon_nonce") != DELTA_LOGON_DATA.nonce) {
        Reject("There was a security error. Please log in again.");
        return;
    }

    //Go
    window.setTimeout(() => {
        window.location = DELTA_LOGON_DATA.return_url;
    }, 2000);
}

function CreateDom(type, classname, parent, text) {
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
    return e;
}

function Reject(message) {
    document.getElementById('og_content').remove();
    var a = CreateDom("div", "content auth_content", document.body);
    CreateDom("div", "auth_fail_title", a, "There was an error");
    CreateDom("div", null, a, message);
    CreateDom("div", "accept_btn", a, "Try Again").addEventListener("click", () => {
        window.location = DELTA_LOGON_DATA.reject_url;
    });
}

async function RequestBetaKey() {
    //Prompt
    var key = prompt("Type your Delta Web Map beta key.", "XXXX-XXXX-XXXX");

    //Get
    var status = await WebPost(DELTA_LOGON_DATA.beta_key_url, JSON.stringify({
        "key": key,
        "user_id": DELTA_LOGON_DATA.user_id
    }));

    //Check
    if (status.ok) {
        FinishLogon();
    } else {
        Reject("Sorry, that beta key is not valid or was used by someone else. Delta Web Map will be open to the public soon!");
    }
}

async function WebPost(url, body) {
    return new Promise(function (resolve, reject) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                resolve(JSON.parse(this.response));
            } else if (this.readyState === 4) {
                reject({
                    status: this.status
                });
            }
        }
        xmlhttp.open("POST", url, true);
        xmlhttp.send(body);
    });
}

RequestBetaKey();