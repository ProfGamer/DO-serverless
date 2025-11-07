// 防呆版：永远 200，安全校验可选开关
exports.main = async (args) => {
    try {
        // 1) 可选校验：Telegram webhook secret
        const secretFromHeader =
            args.__ow_headers && (args.__ow_headers["x-telegram-bot-api-secret-token"] || args.__ow_headers["X-Telegram-Bot-Api-Secret-Token"]);
        const expected = process.env.TG_SECRET;
        console.log(args.__ow_headers);
        // 如果你还不确定是否配置正确，先注释掉下面两行，确保不因 secret 拦截
        if (expected && secretFromHeader && secretFromHeader !== expected) {
            // 不要 403，仍然 200，避免 TG 反复重试造成 pending 堆积
            return { statusCode: 200, body: "ignored (secret mismatch)" };
        }

        // 2) 获取 update
        // DO Functions（OpenWhisk）在非 raw 模式下会把 JSON 展开到 args 里
        // 有些情况下你也可能看到 args.body 是字符串；都兼容一下
        let update = null;
        if (typeof args === "object" && args.update_id) {
            update = args;
        } else if (args && typeof args.body === "string") {
            try { update = JSON.parse(args.body); } catch (_) {}
        } else if (args && typeof args.__ow_body === "string") {
            try { update = JSON.parse(Buffer.from(args.__ow_body, "base64").toString("utf8")); } catch (_) {}
        }
        console.log(update);
        if (!update) {
            // 打点观察：请求进来了但不是 TG 的标准 payload
            return { statusCode: 200, body: "ok (no update)" };
        }

        const msg = update.message || update.edited_message || update.channel_post;
        if (!msg || !msg.chat) {
            return { statusCode: 200, body: "ok (no message)" };
        }

        const text = (msg.text || "").trim();
        const help = "你好！可用命令：/start /help";

        let reply = "未知命令。发送 /help 获取用法。";
        if (text === "/start" || text === "/help") reply = help;

        // 3) Webhook 直返（一定要 Content-Type + 字符串化 body）
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                method: "sendMessage",
                chat_id: msg.chat.id,
                text: reply
            })
        };
    } catch (e) {
        // 避免抛错导致 400/5xx，兜底也返回 200
        return { statusCode: 200, body: "ok (caught)" };
    }
};
