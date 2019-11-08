import os
from flask import Flask, render_template, url_for, redirect, request
from flask_socketio import SocketIO, emit
from datetime import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

channels_list = []
names_list = []
max_messages=100


@app.route("/", methods=["GET", "POST"])
def home():
    return render_template("home.html")


@app.route("/channel/<string:channel>", methods=["GET", "POST"])
def channel(channel):

    if len(channels_list) == 0:
        return redirect("/")
        
    else:
        channel_index = list(filter(lambda x: channels_list[x]["name"] == channel, range(len(channels_list))))[0]
        return render_template("channel.html", channel=channel, channel_index=channel_index)
      
       
       
@app.route("/channels", methods=["GET", "POST"])
def channels():
    return render_template("channel_list.html", channels_list=channels_list)


@socketio.on("get channel")
def get_channel(data):
    channel_index = int(data["channel_index"])
    emit("set messages", {"channel_index": channel_index,
                          "messages_list": channels_list[channel_index]["messages"][-max_messages:]}, broadcast=True)

@socketio.on("submit channel")
def create_channel(data):

    if not data["channel"]:
        emit(
            "error", {"error": "The channel name can't be empty."})

    elif list(filter(lambda x: channels_list[x]["name"] == data["channel"], range(len(channels_list)))):
        emit("error", {"error": "The channel name already exists. Please choose another name."})

    else:
        channels_list.append({"name":data["channel"], "messages":[]})
       

@socketio.on("send message")
def send_message(data):
    if len(channels_list) == 0:
        socketio.emit("error", {
                      "error": "The channel  no longer exists.", "url": "/"})
        

    elif not data["message"]:
        emit("error", {
             "error": "The message can't be empty "})

    else:
        date_time = str(datetime.now().replace(microsecond=0))
        channel_index = int(data["channel_index"])
        message_index = len(channels_list[channel_index]["messages"])
        channels_list[channel_index]["messages"].append({"message_index": message_index, "name": data["name"], "message": data["message"], "date_time": date_time})
        emit("set messages", {"channel_index": channel_index,
                              "messages_list": channels_list[channel_index]["messages"][-max_messages:]}, broadcast = True)

       

@socketio.on("submit name")
def submit_name(data):
    global names_list
    
    if not data["name"]:
        emit("error", {
             "error": "Please provide a name."})

    elif data["name"] in names_list:
        emit("error", {
             "error": "The name already exists. Please choose another name."})

    elif data["current_name"]:
      
        names_list = [name.replace(data["current_name"], data["name"]) for name in names_list]
        
        for channel in channels_list:
            for message in channel["messages"]:
                message["name"] = message["name"].replace(data["current_name"], data["name"])
        emit("add name", {"name": data["name"]})

    else:
        names_list.append(data["name"])
        emit("add name", {"name": data["name"]})
  

@socketio.on("delete message")
def delete_message(data):
    if len(channels_list) == 0:
        socketio.emit(
            "error", {"error": "The channel  no longer exists.", "url": "/"})

    else:
        message_index=int(data["message_index"])
        channel_index=int(data["channel_index"])
        channels_list[channel_index]["messages"].pop(message_index)
        messages = channels_list[channel_index]["messages"]
        i=0
        for message in  messages:
            message["message_index"] = i
            i +=1
        emit("set messages", {"channel_index": channel_index,
                            "messages_list": channels_list[channel_index]["messages"][-max_messages:]}, broadcast=True)
   

@socketio.on("clear name")
def clear_name():
    if len(names_list) == 0:
        emit("remove storage name")
    

if __name__ == "__main__":
    socketio.run(app)
