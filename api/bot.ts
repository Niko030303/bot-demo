import { Bot, Context, session, SessionFlavor } from 'grammy'
import { Menu, MenuRange } from '@grammyjs/menu'
require('dotenv').config()

// Button interface
interface IButton {
    id: string
    name: string
}

// Session data interface
interface ISessionData {
    isBuy: boolean;
    add?: boolean;
    input1?: boolean;
    first_reply?: string;
    input2?: boolean;
    second_reply?: string;
}

type MyContext = Context & SessionFlavor<ISessionData>;

const buyList: IButton[] = [
    { id: 'buy001', name: 'Buy 0.01' },
    { id: 'buy005', name: 'Buy 0.05' },
]
const sellList: IButton[] = [
    { id: 'sell001', name: 'Sell 10%' },
    { id: 'sell005', name: 'Sell 50%' },
]

const first_message = "What would you like to name this copy trade wallet? 8 letters max, only numbers and letters."
const second_message = "Reply to this message with the desired wallet address you'd like to copy trades from."

let balanceList = [...buyList]

// 初始化机器人
const bot = new Bot<MyContext>(process.env['BOT_TOKEN'] || '')

// 使用Session中间件
bot.use(
    session({
        initial(): ISessionData {
            return {
                isBuy: true,
                add: false,
                input1: false,
                first_reply: '',
                input2: false,
                second_reply: '',
            }
        },
    })
)

// 生成主列表
const mainText = 'Here is a menu!'
const mainMenu = new Menu<MyContext>('menu')
mainMenu
.text("Add", ctx => {
    ctx.reply(first_message);
    ctx.session.add = true;
})
.text("Switch", async (ctx) => {
  await ctx.reply("You clicked switch, wait...")
  // await ctx.reply(`current balanceList: ${balanceList[0].name}`)
  if (ctx.session.isBuy) {
      balanceList = [...sellList]
      ctx.session.isBuy = false
  } else {
      balanceList = [...buyList]
      ctx.session.isBuy = true
  }
  // await ctx.reply(`final balanceList: ${balanceList[0].name}`)
  await ctx.menu.update();
})
.row()
.dynamic(() => {
    const range = new MenuRange<MyContext>()
    for (const item of balanceList) {
        range
        .text(item.name, ctx => ctx.reply(`You chose ${item.name}`))
    }
    return range
}).row()

// Use main menu
bot.use(mainMenu)

// 处理 /start 命令
bot.command('start', ctx => ctx.reply(mainText, { reply_markup: mainMenu }))

// 处理消息
bot.on('message:text', async ctx => {
    // 第一次回复
    if (ctx.session.add) {
        if (ctx.message?.reply_to_message?.text === first_message) {
            const input = ctx.message.text.trim();
        if (!/^[a-zA-Z]{1,8}$/.test(input)) {
            return ctx.reply("This is not a valid wallet name. Name must be alphanumeric, 8 letters max.");
        }
        ctx.session.add = false;
        ctx.session.input1 = true;
        ctx.session.first_reply = input;
        // ctx.reply(`1::add: ${ctx.session.add} input1: ${ctx.session.first_reply} input2: ${ctx.session.second_reply}`)
        return ctx.reply(second_message);
          }

    }

    // 第二次回复
    if (ctx.session.input1) {
        if (ctx.message?.reply_to_message?.text === second_message) {
        const input = ctx.message.text.trim();
        if (!/^0x[\da-fA-F]{40}$/.test(input)) {
            return ctx.reply("This is not a valid wallet address. Please try again.");
        }
        ctx.session.input1 = false;
        ctx.session.input2 = true;
        ctx.session.second_reply = input;
        // ctx.reply(`2::add: ${ctx.session.add} input1: ${ctx.session.first_reply} input2: ${ctx.session.second_reply}`)
        ctx.session.input2 = false;
        mainMenu
        .text(`Name: ${ctx.session.first_reply}`)
        .text(`Address: ${ctx.session.second_reply}`)
        .row();
        return ctx.reply("Thank you for your input. Here's the updated menu:", { reply_markup: mainMenu });
    }}
    return
});

// 启动bot
// bot.start()
