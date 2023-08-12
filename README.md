# GPTchat

[![demo][live-demo]][live-demo-url]
[![author][author-image]][author-url]
[![license][license-image]][license-url]
[![release][release-image]][release-url]
[![last commit][last-commit-image]][last-commit-url]

[live-demo]: https://img.shields.io/badge/Live-Demo-green.svg

[live-demo-url]: https://ai.mojotv.cn/

[author-image]: https://img.shields.io/badge/Eric-Zhou-blue.svg

[author-url]: https://github.com/mojocn

[license-image]: https://img.shields.io/badge/license-GNU-blue.svg

[license-url]: https://github.com/mojocn/gptchat/blob/run_migrate/LICENSE

[release-image]: https://img.shields.io/github/v/release/mojocn/gptchat?color=blue

[release-url]: https://github.com/mojocn/gptchat/releases/latest

[last-commit-image]: https://img.shields.io/github/last-commit/mojocn/gptchat?label=last%20commit

[last-commit-url]: https://github.com/mojocn/gptchat/commits

## ✨ Features

* 🤖 Support Open AI and Azure Open AI
* 💬 Chat with session and context
* 🚀 Support Open AI and azure API
* 🔍 Shortcut to quickly activate the app anywhere in the browser
* 🎨 Markdown and code highlight support
* 📚 Prompt Library for custom prompts and community prompts
* 💾 Conversation history saved in localstorage
* 📥 Export and Import all your data
* 🔗 User Auth
* 💰 Make revenue with your own Open AI key
* 🌙 Dark mode

## 🔧 Manual Installation

- Fork this repo
- New vercel.com Project [Vercel](https://vercel.com/)
- Connect your repo
- Create postgresSQL database in Vercel storage
- Set env variables in Vercel
- Deploy your app

## 💰 Cha-Ching

- [Lemonsqueezy Webhook code](https://github.com/mojocn/gptchat/blob/run_migrate/app/api/webhook/lemon/route.tsx)
- [Lemonsqueezy Product](https://mojoai.lemonsqueezy.com/checkout?cart=a34be65a-10d2-48dc-b1e7-6ed70d7bacc4)

## 🔨 Build from Source

- Clone the source code
- `npm install`
- `cp .env.example .env`  [.env.example](https://github.com/mojocn/gptchat/blob/run_migrate/.env.example)
- create postgresSQL database in vercel storage
- update .env file
- `npm dev`


## 📜 Changelog

### v0.0.1

- Support copy message text
- Improve setting page form element style

## development plan

- [ ] email verify
- [ ] usage limit
- [ ] user profile
- [ ] custom service
- [ ] ai blog
- [ ] free music
- [ ] paid faq
- [ ] mobile ui
- [ ] usage paid alert
- [ ] user management
- [ ] langchain of javascript