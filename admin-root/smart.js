var req;
var playlist_info={};


function pl_popup(URL) {
    day = new Date();
    id = day.getTime();
    eval("pagemtdaapdplPop = window.open(URL, 'mtdaapdple', 'toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=1,width=500,height=240,left = 320,top = 448');");
}

function pl_editor_state(state) {
    var pleditor = document.getElementById("pl_editor");
    if(!pleditor)
        return;
        
    if(state) {
        pleditor.style.display="block";
    } else {
        pleditor.style.display="none";
    }

    return;
}

function pl_errormsg(msg) {
    var msgdiv = document.getElementById("pl_warning");

    if(!msgdiv)
        return;
    
    msgdiv.innerHTML = msg + "\n";
    
    if(msg == "") {
        msgdiv.style.display="none";
    } else {
        msgdiv.style.display="block";
    }
}

function pl_displayresults(xmldoc) {
}

function pl_update() {
    /* this is either update or create, depending... */
    var id, name, spec;

    id = document.forms['pl_form']['playlist_id'].value;
    name = encodeURIComponent(document.forms['pl_form']['playlist_name'].value);
    spec = encodeURIComponent(document.forms['pl_form']['playlist_spec'].value);
    
    if(id == '0') {
        /* new playlist... post it! */
        var url = '/databases/1/containers/add?output=xml&org.mt-daapd.playlist-type=1&dmap.itemname=' + name + '&org.mt-daapd.smart-playlist-spec=' + spec;
        result = pl_exec(url,false);
    } else {
        var url='/databases/1/containers/edit?output=xml&dmap.itemid=' + id + '&dmap.itemname=' + name + '&org.mt-daapd.smart-playlist-spec=' + spec;
        result = pl_exec(url,false);
    }
    
    init();
    pl_editor_state(false);   
}

function pl_cancel() {
    pl_errormsg("Cancelled");
    pl_editor_state(false);
}

function pl_new() {
    var msgdiv = document.getElementById("pl_warning");
    var pleditor=document.getElementById("pl_editor");

    pl_errormsg("");
    
    document.forms['pl_form']['playlist_id'].value='0';
    document.forms['pl_form']['playlist_name'].value = 'New Playlist';
    document.forms['pl_form']['playlist_spec'].value = '';
    document.forms['pl_form']['submit_button'].value = 'Create';
    
    pl_editor_state(true);
}

function pl_delete(pl_id) {
    if(confirm('Are you sure you want to delete playlist "' + playlist_info[pl_id]['name'] + '"?')) {
        result=pl_exec("/databases/1/containers/del?output=xml&dmap.itemid=" + pl_id,false);
        init();
    }
}


function pl_edit(pl_id) {
    var msgdiv = document.getElementById("pl_warning");
    var pleditor=document.getElementById("pl_editor");

    if((!msgdiv)||(!pleditor))
        return;
        
    msgdiv.style.display="none";
    pleditor.style.display="none";
    
    if(pl_id == 1) {
        msgdiv.innerHTML="Cannot edit library playlist";
        msgdiv.style.display="block";
        return;
    }
    
    if(playlist_info[pl_id]['type'] != 1) {
        msgdiv.innerHTML="Can only edit smart playlists";
        msgdiv.style.display="block";
        return;
    }
    
    document.forms['pl_form']['playlist_id'].value = pl_id;
    document.forms['pl_form']['playlist_name'].value = playlist_info[pl_id]['name'];
    document.forms['pl_form']['playlist_spec'].value = playlist_info[pl_id]['spec'];
    document.forms['pl_form']['submit_button'].value = 'Update';
    
    pleditor.style.display="block";
    
    //alert(playlist_info[pl_id]['name']);   
}

function pl_process() {
    var xmldoc = req.responseXML;
    var playlists = xmldoc.getElementsByTagName("dmap.listingitem");
    var pl_table = document.getElementById("playlists");
    playlist_info = {};
    
    while(pl_table.childNodes.length > 0) {
        pl_table.removeChild(pl_table.lastChild);
    }
    for(var x=0; x < playlists.length; x++) {
        var pl_id;
        var pl_name;
        var pl_type;
        
        pl_id=playlists[x].getElementsByTagName("dmap.itemid")[0].firstChild.nodeValue;
        if(playlists[x].getElementsByTagName("dmap.itemname")[0].firstChild) {
            pl_name=playlists[x].getElementsByTagName("dmap.itemname")[0].firstChild.nodeValue;
        } else {
            pl_name = "";
        }
        pl_type=playlists[x].getElementsByTagName("org.mt-daapd.playlist-type")[0].firstChild.nodeValue;

        
        playlist_info[String(pl_id)] = { 'name': pl_name, 'type': pl_type };
        if(pl_type == 1) {
            var pl_spec=playlists[x].getElementsByTagName("org.mt-daapd.smart-playlist-spec")[0].firstChild.nodeValue;
            playlist_info[String(pl_id)]['spec'] = pl_spec;
        }
        
        switch(pl_type) {
            case "0":
                pl_type = "Static&nbsp;(Web&nbsp;Edited)";
                break;
            case "1":
                pl_type = "Smart";
                break;
            case "2":
                pl_type = "Static&nbsp;(m3u/pls&nbsp;file)";
                break;
            case "3":
                pl_type = "Static&nbsp;(iTunes&nbsp;xml)";
                break;
        }


        var row = document.createElement("tr");
        var td1 = document.createElement("td");
        var td2 = document.createElement("td");
        var td3 = document.createElement("td");
        var td4 = document.createElement("td");
        td1.innerHTML=pl_id + '\n';
        td2.innerHTML=pl_name + '\n';
        td3.innerHTML=pl_type + '\n';
        if((pl_id != 1) && (playlist_info[pl_id]['type'] == 1)) {
            td4.innerHTML='<a href="javascript:pl_edit(' + pl_id + ')">Edit</a>';
            td4.innerHTML = td4.innerHTML + '&nbsp;<a href="javascript:pl_delete(' + pl_id + ')">Delete</a>';
        } else {
            td4.innerHTML="&nbsp;";
        }
        
        row.appendChild(td1);
        row.appendChild(td2);
        row.appendChild(td3);
        row.appendChild(td4);
        pl_table.appendChild(row);
    }
}


function pl_state_change() {
    if(req.readyState == 4) {
        if(req.status == 200) {
            pl_process();
        }
    }
}

function init() {
    pl_exec("/databases/1/containers?output=xml&meta=dmap.itemid,dmap.itemname,org.mt-daapd.playlist-type,org.mt-daapd.smart-playlist-spec",true);        
}

function pl_exec(url, async) {
    // branch for native XMLHttpRequest object
    if (window.XMLHttpRequest) {
        req = new XMLHttpRequest();
        req.onreadystatechange = pl_state_change;
        req.open("GET", url, async);
        return req.send(null);
    // branch for IE/Windows ActiveX version
    } else if (window.ActiveXObject) {
        req = new ActiveXObject("Microsoft.XMLHTTP");
        if (req) {
            req.onreadystatechange = pl_state_change;
            req.open("GET", url, async);
            return req.send();
        }
    }
}
