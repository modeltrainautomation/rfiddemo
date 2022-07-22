
// https://www.emqx.com/en/blog/mqtt-js-tutorial


var MQTTServer = '';
var MQTTPort = 0;
var StockItemId = "xxxx";

const clientId = "MKR-RFIDDemoLayout-" + parseInt(Math.random() * 100, 10)
var client = null;

function OnPageLoad() {

    // $('#MQTTServer').append($('<option>', { value: "10.100.1.1", text: "10.100.1.1" }));
    $('#MQTTServer').append($('<option>', { value: location.hostname, text: location.hostname }));

    $('#MQTTPort').append($('<option>', { value: 1884, text: 1884 }));

    MQTTServer = $('#MQTTServer option:selected').val();
    MQTTPort = parseInt($('#MQTTPort option:selected').val(), 10);

    MQTTconnect();
}

function MQTTChangeServer() {
    client.end();
    MQTTconnect();
}

function MQTTconnect() {

    var options = {
        keepalive: 60,
        clientId: clientId,
        protocolId: 'MQTT',
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        will: {
            topic: 'WillMsg',
            payload: 'Connection Closed abnormally ' + clientId + '..!',
            qos: 0,
            retain: false
        },
    };

    var strHost = 'ws://' + MQTTServer + ':' + MQTTPort + '/mqtt'

    client = mqtt.connect(strHost, options)

    client.subscribe("transponder/#", { qos: 0 }, SubscribeResult);
    client.subscribe("stockdetails", { qos: 0 }, SubscribeResult);

    client.on('connect', onConnect);
    client.on('reconnect', onReconnect);
    client.on('error', onError);
    client.on('offline', onOffLine);
    client.on('disconnect', onDisconnect);
    client.on('message', onMessage);
    client.on('close', onClose);

    console.log("MQTT connect to Host: " + MQTTServer + ", Port: " + MQTTPort + ' Clinet Id ' + clientId);
}

function SubscribeResult(error, granted) {
    if (error) {
        console.log(error)
    } else {
        console.log(`${granted[0].topic} was subscribed`)
    }
}

function onConnect() {
    console.log("MQTT onConnect");
    $('#status').html('Connected to ' + MQTTServer + ':' + MQTTPort);
}

function onUnsubscribe(topic) {
    client.subscribe(topic, () => {
        console.log('MQTT onUnsubscribe: ' + topic + ' unsubscribed')
    })
}

function onClose() {
    console.log('MQTT onClose: ' + clientId + ' disconnected')
}

function onReconnect() {
    console.log('MQTT onReonnect...');
    $('#status').html('Reconnected to ' + MQTTServer + ':' + MQTTPort);
}

function onOffLine() {
    console.log('MQTT onOffLine...');
    $('#status').html('MQTT Offline');
}

function onError(message) {
    console.log('MQTT onError...');
    $('#status').html("Connection failed: " + message + ". Reconnecting...");
    client.end()
}

function onDisconnect(response) {
    console.log('MQTT onDisconnect...');
    $('#status').html("Connection lost: " + response.errorMessage + ". Reconnecting...");
}

function MQTTSend(topic, msg) {
    console.log("MQTT Send");
    client.publish(topic, msg, { qos: 0, retain: false }, function (error) {
        if (error) {
            console.log(error)
        } else {
            console.log('Published')
        }
    });
}

function onMessage(topic, message) {
    var topic = topic;
    var payload = message.payloadString;

    console.log("MQTT onMessage: " + topic + " " + message);
    $('#messagetopic').html(topic);
    $('#messagepayload').html(payload);

    var payload = JSON.parse(message);

    var topicpath = topic.split('/');

    if (topicpath[0] == "transponder") {

        var msg = "BlockId: " + payload.blockid + " StockItems: " + payload.StockItems;
        console.log(msg);
        if (!payload.blockid) {
            console.log(topic + " " + payload);
        }

        var block = getElement('NewBlock-' + payload.blockid);
        console.log(block);

        if (payload.StockItems.length > 0) {

            if (payload.blockid == 0) {

                console.log('Block 0: Special Requirements');

                $("#OffTrackTableBody").empty();

                payload.StockItems.forEach(element => {
                    var img = getElement(element, 'stockitem');
                    // console.log(img);

                    var row = document.createElement("tr");
                    var cell1 = document.createElement("td");
                    var cell2 = document.createElement("td");

                    cell1.innerText = element;
                    cell2.append(img);

                    row.appendChild(cell1);
                    row.appendChild(cell2);

                    $("#OffTrackTableBody").append(row);
                }
                );
            }
            else {
                block.innerHTML = "";
                payload.StockItems.forEach(element => {

                    var StockItem = getElement(element, 'stockitem');

                    console.log(StockItem);

                    block.appendChild(StockItem);

                    // var item = getElement(element,'img');
                    // if (item.getAttribute("block") == payload.blockid)
                    // {

                    // }
                    // Bug it redraws the order of the stock items due to this - the removed one gets moved about
                    // block.appendChild(item);
                });

            }
        }
        else {
            console.log('Empty block ' + payload.blockid);
            block.innerHTML = "";
        }
    } else

        if (topicpath[0] == "stockdetails") {

            if (payload.action == "Show") {
                var block = '#StockItemDetails';

                if (payload.StockItem.length > 0) {

                    StockItemId = payload.StockItem
                    AjaxGetPage("/StockItemDetails/" + payload.StockItem + ".json", ParseStockItemDetails);
                }
                else {
                    $(block).text("");
                }
            }
        }
}

function ParseStockItemDetails(data) {
    // console.log("Date recived!");
    // console.log(data);

    var block = '#StockItemDetails';

    let DetailsTable = "<br/><table class=\"styled-table\"> <thead><th style=\"width: 30%\">Name</th><th>Value</th> </thead> <tbody>"

    DetailsTable += "<tr><td>Picture</td><td><img class=\"details\" src=\"StockItemImages/" + StockItemId + "-sm.gif\"></td></tr>"

    Object.keys(data.details).forEach(element => {

        DetailsTable += "<tr><td>" + element + "</td><td>" + data.details[element] + "</td></tr>"
    }
    )

    DetailsTable += "</tbody></table>"
    $(block).html(DetailsTable);
}

function AjaxGetPage(url, resultfunction) {
    console.log("Calling AjaxGetPage: " + url);
    $.ajaxSetup({ cache: false });
    $.ajax(
        {
            url: url,
            success: resultfunction
        }
    );
} 