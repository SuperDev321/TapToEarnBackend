import { Context } from "telegraf";

export const startBot = (ctx: Context) => {
    const inlineKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: startMenuText['en'],
                        web_app: {
                            url: 'https://sacred-divine-baboon.ngrok-free.app' // Your frontend URL
                        }
                    }
                ]
            ]
        }
    };

    // Send the message with the inline button
    ctx.sendMessage('Tap to start playing the game!', inlineKeyboard);
};