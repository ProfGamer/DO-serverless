// index.js
import fetch from "node-fetch";

const BOT_TOKEN = process.env.BOT_TOKEN;
const TG_SECRET = process.env.TG_SECRET;

async function handleText(chat_id, text) {
    const reply = (msg) => sendMessage(chat_id, msg);
    if (text === "/start" || text === "/help") {
        return reply("你好！我是你的 Bot，请发送命令。可用：/start /help");
    } else {
        return reply("未知命令。发送 /help 获取用法。");
    }
}

async function sendMessage(chat_id, text) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const body = {
        chat_id,
        text
    };
    await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
}

export async function main(args) {
    // Telegram Webhook 发来的是 body JSON
    const secret = args.__ow_headers?.["x-telegram-bot-api-secret-token"];
    if (secret !== TG_SECRET) {
        return { statusCode: 403, body: "forbidden" };
    }

    const update = args.body ? JSON.parse(args.body) : null;
    if (!update) {
        return { statusCode: 200, body: "ok" };
    }

    const message = update.message;
    if (!message || !message.chat || !message.text) {
        return { statusCode: 200, body: "ok" };
    }

    const chat_id = message.chat.id;
    const text = message.text.trim();

    // 处理文本
    await handleText(chat_id, text);

    return { statusCode: 200, body: "ok" };
}
