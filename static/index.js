document.addEventListener("DOMContentLoaded", () => {

    var socket = io.connect(location.protocol + "//" + document.domain + ":" + location.port);
    
    socket.emit("clear name");

    if (!localStorage.getItem("name"))
        document.querySelector("#display_name").innerHTML = "Display Name";

    if (!localStorage.getItem("name") && window.location.href != location.protocol + "//" + document.domain + ":" + location.port + "/"){
        window.location.href = location.protocol + "//" + document.domain + ":" + location.port + "/";
        alert("Please provide a name.");  
    }

    if (!document.referrer && localStorage.getItem("channel")) {    
        window.location.href = localStorage.getItem("channel");
        localStorage.removeItem("channel");
    }

    else if (document.referrer && localStorage.getItem("channel")){
        localStorage.removeItem("channel");
    } 

    if (localStorage.getItem("name"))
        document.querySelector("#display_name").innerHTML = localStorage.getItem("name");

    

    if (document.title == "Home"){
        document.querySelector("#form_name").onsubmit = () => {
            name = document.querySelector("#name").value;
            socket.emit("submit name", { name: name, current_name: localStorage.getItem("name")});
        };
    };

    if (document.title == "Channels List"){ 
        document.querySelector("#form_channel").onsubmit = () => {
        channel = document.querySelector("#channel_name").value;
        socket.emit("submit channel", { channel: channel });
        };  
    }

    if (document.title == "Channel"){
        localStorage.setItem("channel", window.location.href)
        channel_index = document.querySelector("#channel_name_h1").dataset.channel_index;
        socket.emit("get channel", { channel_index: channel_index})

        document.querySelector("#form_message").onsubmit = () => {    
            name = document.querySelector("#display_name").innerHTML;
            message = document.querySelector("#message_text").value;
            document.querySelector("#message_text").value=""
            socket.emit("send message", {channel_index : channel_index, name : name, message : message });
            return false;   
        }       
    }

    socket.on("set messages", data => {
        set_messages(data, socket);
    });
    
    socket.on("add name", data => {
        localStorage.setItem("name", data.name);
        document.querySelector("#display_name").innerHTML = localStorage.getItem("name");
        window.location.href = location.protocol + "//" + document.domain + ":" + location.port + "/channels";
    });

    socket.on("error", data => {
        url = window.location.href
        alert(data["error"]);
        if (data.url)
            window.location.href = data.url;
        else
            window.location.href = url;
    });

    socket.on("remove storage name", () => {
        if (localStorage.getItem("name")){
            localStorage.removeItem("name");
            document.querySelector("#display_name").innerHTML = "Display Name";
            window.location.href = location.protocol + "//" + document.domain + ":" + location.port + "/";
        }
    });
});


function set_messages(data, socket) {
    if (data.channel_index == document.querySelector("#channel_name_h1").dataset.channel_index) {
      
        document.querySelector("#container_messages").innerHTML = ""
        data.messages_list.forEach(message => {
            div = `<p class="name"> ${message.name}:</p><p>${message.message}</p><div><p class="date-time">${message.date_time}</p>`;

            if (localStorage.getItem("name") == message.name)
                
                div = div + `<button type="submit"  class="btn btn-primary delete">Delete</button>`

            
            document.querySelector("#container_messages").innerHTML = document.querySelector("#container_messages").innerHTML +
                `<div class="card container-review" data-message_index="${message.message_index}">` + div + `</div></div>`;
        });

        document.querySelectorAll(".delete").forEach(button => {
            button.onclick = () => {
                container = button.parentElement.parentElement;
                channel_index = document.querySelector("#channel_name_h1").dataset.channel_index;
                message_index = container.dataset.message_index;
                if (message_index)
                    socket.emit("delete message", { channel_index: channel_index, message_index: message_index });        
            }
        });
    }
}







