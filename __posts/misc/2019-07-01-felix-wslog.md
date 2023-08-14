---
layout: post
title: 一个轻便的实时日志收集平台wslog
category: Misc
tags: shell
description: 一个轻便的实时日志收集平台wslog(websocket-log-platform)
keywords: websocket,log,hook,api
score: 5.0
coverage: ws_log_logo.png
published: true
---

## wslog原理

1. 利用github.com上无数的slack hook 日志工具sdk
2. 遵循 slack hook API 规范 https://api.slack.com/incoming-webhooks
3. wslog暴露Http API来收集slack hook api 规范的json日志
4. wslog提供websocket API像前端实时展示收集的日志,提供http api 展示搜索历史日志

### 视频DEMO

<iframe src="//player.bilibili.com/player.html?aid=57474467&cid=100338485&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

## 1. 为什么要开发这个应用

我们程序员再开发中需要不停的查看日志来解决bug,我在google上一直都没有找到一款轻便简洁有效的日志收集应用.
而这款应用可以结局一下疼点:

-
    1. linux下查看日志学习曲线较陡, tail/cat/grep/sed 命令眼花缭乱
-
    2. ELK日志服务器部署困难繁琐,其次对机器的性能内存要求很高,ELK基于elasticSearch/java内存无底洞.
-
    3. 使用Slack Hook收集日志: 国内网络加载slack界面非常吃力,各种js/css下载失败,更甚对于免费用户日志数量还有数量条数限制(<10000条).
-
    4. 钉钉Bot Hooks收集日志: 钉钉办公工具是大资本加剥削工薪阶级的工具(哈哈),您怎么能使用钉钉来解析日志的收集展示呢?

## 2. wslog的优势

### 2.1 部署简单

- wslog 后端基于golang开发,一次编译多平台可执行文件.
- wslog UI基于浏览器,支持任意平台.
- wslog 数据库使用SQLite3和go语言内存数据库,没有任何数据库运维工作和数据库限制.

前端代码和后端代码都编译到一个可执行二进制文件中,双击二进制文件就可以执行.

### 2.2 多平台支持

wslog 支持单机运行,可以支持windows/linux服务器运行.
支持各种主流操作系统windows/linux/mac/中标麒麟/国产linux操作系统.
支持任意架构arm/x86,支持树莓派系统...

### 2.3 实时日志输出

wslog采用websocket通讯,像聊天工具那样实时输出日志,
也可以在日志历史列表中快捷查看日志

### 2.4 日志分类

日志从功能来说,可分为诊断日志,统计日志,审计日志. wslog日志支持debug/info/warning/error/fatal等日志级别

### 2.5 日志全文检索

wslog 可以轻松的在数百万条日志中快速的定位您的日志

### 2.6 全面兼容支持slack-hook日志sdk

进入wslog->hook 创建hook,复制hook_url,把hook_url粘贴替换之前slack_hook sdk 配置.

### 2.7 全面兼容支持slack_hook API的第三方日志收集SDK

- go: logrus [slackrus](https://github.com/johntdyer/slackrus)
- python: [slack-logger](https://pypi.org/project/slack-logger/)
- java: [slack appender for Log4j](https://github.com/tobias-/slack-appender)
- C#: [Microsoft.Extensions.Logging.Slack](https://github.com/imperugo/Microsoft.Extensions.Logging.Slack)
- php: [laravel/lumen slack日志](https://segmentfault.com/a/1190000010328771)
- javascript: [Slack logger nodejs library](https://www.npmjs.com/package/slack-logger)
- swift: [SwiftyBeaver slack](https://github.com/SwiftyBeaver/SwiftyBeaver)

## 3. 编译/安装

可以访问在线demo网站 [http://felix.mojotv.cn](http://felix.mojotv.cn)

### 3.1 go语言编译安装

设置环境变量

- 设置GOBIN
- 添加GOBIN到PATH环境变量

```bash
go get github.com/libragen/felix
felix ssh -h
felix sshw
```

### 3.2 mac 系统安装运行

```bash
curl https://github.com/libragen/felix/releases/download/0.3/felix-amd64-darwin -o felix
sudo chmod +x felix
./felix sshw
```

### 3.3 linux 系统安装运行

```bash
curl https://github.com/libragen/felix/releases/download/0.3/felix-amd64-linux -o felix
sudo chmod +x felix
./felix sshw
```

### 3.4 linux-arm(树莓派) 系统安装运行

```bash
curl https://github.com/libragen/felix/releases/download/0.3/felix-amd64-linux-arm -o felix
sudo chmod +x felix
./felix sshw
```

### 3.5 window 系统安装运行

```bash
curl https://github.com/libragen/felix/releases/download/0.3/felix-amd64-win.exe -o felix
./felix sshw
```

## 4. wslog 使用教程

这里就以golang的logrus包为例子,包日志介入wslog WebUI 实时显示

### 4.1 启动ws_log 服务

- 创建wslog 频道 `http://localhost:2222/#/wslog/channel`
- 创建wslog hook 同时关联到频道 `http://localhost:2222/#/wslog/hook`
- 复制hook url 地址

### 4.2 配置logrus slack

`slackHook := "http://localhost:2222/api/wslog/hook-api?_t=B5tCwWtHKgHdhYQ4cmr5JQ"`

```go
func initSlackLogrus() {
	slackHook := "http://localhost:2222/api/wslog/hook-api?_t=B5tCwWtHKgHdhYQ4cmr5JQ"

	lvl := logrus.DebugLevel

	//logrus.SetFormatter(&logrus.JSONFormatter{})
	//file, _ := os.Create(time.Now().Format("2006_01_02.log"))
	//logrus.SetOutput(file)
	logrus.SetLevel(lvl)
	//给logrus添加SlackrusHook
	logrus.AddHook(&slackrus.SlackrusHook{
		HookURL:        slackHook,
		AcceptedLevels: slackrus.LevelThreshold(lvl),
		Channel:        "#felix",
		IconEmoji:      ":shark:",
		Username:       "felixAPP",
	})
}
```

### 4.3 在go中输出日志

```go
    //使用logrus 包方法打印日志
    title := utils.RandomString(34)
    logrus.WithField("time", time.Now()).WithField("fint", 1).WithField("fBool", false).WithField("fstring", "awesome").WithField("fFloat", 0.45).WithError(fmt.Errorf("error fmt format: %s", "felix is awesome")).Error("this mgs ", "error ", title)
```

### 4.4 在网页中查看实时日志,或者查看检索历史日志

- `http://localhost:2222/#/wslog-msg-rt` 查看websocket 实时日志
- `http://localhost:2222/#/wslog-msg-hi` 查看历史日志

### 4.1 WebUI简介

#### websocket-vuejs-table展示实时日志(本来打算做一个聊天窗口界面的,发现css比较复杂,前端知识比较平庸,所以就是elementUI的table实时展示日志)

![](/assets/image/ws_log_realtime_msg.png)

#### API Hook

![](/assets/image/ws_log_hook_api.png)

#### 历史日志

![](/assets/image/ws_log_history_log.png)

### 4.2 PHP laravel/lumen 教程

编辑laravel/lumen `.env` 配置文件
设置 `LOG_SLACK_WEBHOOK_URL`
`LOG_SLACK_WEBHOOK_URL=http://localhost:2222/api/wslog/hook-api?_t=B5tCwWtHKgHdhYQ4cmr5JQ`

## 5. 未来展望

更具系统复杂程度错容易到难排序

1. 演变成一个安装配置简洁实时日志展示工具
2. 接入公司账号做一个公司内部的日志收集平台
3. 2C:做一个免费的网页版聊天工具,同时也可以做日志收集平台
4. 2C:做一个国内版的slack聊天工具,不同于钉钉/微信, 可以像slack那样利用API-HOOK开发各种各样的小应用

代码地址[dejavuzhou/felix](https://github.com/libragen/felix) 欢迎提出issue 或者 PR 其他更多功能详解我的其他博客

原文来自我的博客网站[tech.mojotv.cn](http://tech.mojotv.cn/2019/07/01/felix-wslog)


