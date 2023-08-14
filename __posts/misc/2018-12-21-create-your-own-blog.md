---
layout: post
title: 8分钟创建优雅的博客网站
category: Misc
tags: Jekyll
date: 2018-12-26T17:19:54+08:00
score: 5
coverage: jekyll_logo.png
keywords: Jekyll 博客 网站 Github 域名 HTTPS
description: 利用Jekyll使用GithubPages提供的网页托管服务,在CNAME到自己的定义的域名就可以,快速创建一个属于自己的技术分享网站,除了可选的域名服务费用之外,几乎不用花任何费用.
---

## 1. 背景

利用Jekyll使用GithubPages提供的网页托管服务,在CNAME到自己的定义的域名就可以,快速创建一个属于自己的技术分享网站,除了可选的域名服务费用之外.
几乎不用花任何费用.

### 1.3为什么要使用GithubPage?

- 不需要关系服务器依赖和配置nginx
- 帮助您快捷提供HTTPS支持,不用担心证书过期的问题
- 可以CNAME到自己的域名
- 可以自己写机器人来定时发送博客
- 在GitHub上写博客
- 可以向写代码一样写播博客
- 支持GitHub格式代码高亮
- 模板语法简单易学
- 不需要数据库支持

不好的地方

- 博客内容开源让被人快速复制您的内容
- Github屏蔽了国内的搜索引擎(可以通过CDN解决国内搜索引擎被屏蔽)

### 1.2为什么要使用jekyll?

- jekyll和GithubPages服务可以完美的结合,
- GithubPage会自动的帮助您编译jekyll代码到html代码,
- GithubPage提供web服务.
- 模板语法(Liquid)简单
- 对于博客支持代码显示非常漂亮的语法高亮.
- 也可以在自己编译jekyll语法来编程生成html网站让自己的服务托管,

缺点

- Ruby环境不是很好搭建
- 非程序员不友好

### 1.3 Jekyll原理

-
    1. 扫描全部的博客文件
-
    2. 扫描配置文件
- 使用ruby编译Jekyll代码,把整个网站都输出成html代码
- 不需要数据库,博客内容保存到_post文件夹的markdown文件中,

## 2. 准备

- Github账号 [注册]
    - 没有就 [注册](https://github.com/join?source=login)
    - [登陆](https://github.com/login)
- (非必选)域名
    - [阿里云控制台-域名解析](https://home.console.aliyun.com/new?spm=a2c1d.8251892.aliyun_topbar.2.ef335b76b9g0Br#/)
    - [腾讯云控制台-域名解析](https://cloud.tencent.com/login)

## 3. 过程

### 3.1 fork库到自己的github [代码仓库地址](https://github.com/libragen/dejavuzhou.github.io)

![Fork github.com/libragen/dejavuzhou.github.io](/assets/image/jekyll_fork01.png)

![Fork github.com/libragen/dejavuzhou.github.io](/assets/image/jekyll_fork02.png)

### 3.2 修改名字为：username.github.io

![Fork github.com/libragen/dejavuzhou.github.io](/assets/image/jekyll_fork03.png)

### 3.3 clone库到本地,参考_posts中的目录结构自己创建适合自己的文章目录结构

![Fork github.com/libragen/dejavuzhou.github.io](/assets/image/jekyll_fork04.png)

### 3.4 修改CNAME,或者删掉这个文件,使用默认域名

![Fork github.com/libragen/dejavuzhou.github.io](/assets/image/jekyll_fork09.png)

### 3.5 (可选)自定义域名

![Fork github.com/libragen/dejavuzhou.github.io](/assets/image/jekyll_fork05.png)

![Fork github.com/libragen/dejavuzhou.github.io](/assets/image/jekyll_fork06.png)

### 3.6 修改_config.yml配置项

![Fork github.com/libragen/dejavuzhou.github.io](/assets/image/jekyll_fork08.png)

#### 修改config中的`stie.url` **非常重要**

![Fork github.com/libragen/dejavuzhou.github.io](/assets/image/jekyll_fork11.png)

#### 自定义自己的[analytics.google](http://analytics.google.com) 和 [google adsense](https://www.google.com/adsense)

![Fork github.com/libragen/dejavuzhou.github.io](/assets/image/jekyll_fork12.png)

#### 自定义自己的第三方评论系统 [https://www.intensedebate.com/userDash](https://www.intensedebate.com/userDash)

![Fork github.com/libragen/dejavuzhou.github.io](/assets/image/jekyll_fork13.png)

### 3.7 访问效果

![Fork github.com/libragen/dejavuzhou.github.io](/assets/image/jekyll_fork10.png)

## 4. Youtube Video

<iframe src="https://www.youtube.com/embed/A5V9US-O63A" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## 5. Bilibil Video

<iframe src="//player.bilibili.com/player.html?aid=37191994&cid=65354973&page=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>

## 6. 网站代码会不定时更新功能

    需要使用新的功能feature把 `_post` `image` `_config.yml` 文件进行覆盖

## 7. 博客自动机器原理

这个博客机器人使用go语言实现(依赖少,可以几行代码就实现定时任务)
您也可以使用其他语言实现流程如下

-
    1. 下载html网页
-
    2. 获取有用Element
-
    3. 保存数据库(go语言 数据库是可选的)
-
    4. 输出jekyll可是博客文件
-
    5. 使用一组git命令pushd代码到GitHub
-
    6. GitPages收到Push自动编译Jekyll网站
-
    7. 网站机器人发送的博客了

## 8. 致谢

- [如果遇到问题请评论或者提ISSUE](https://github.com/libragen/dejavuzhou.github.io/issues)
- [suyan](https://github.com/suyan/suyan.github.io)
- [markdown教程](https://mojotv.cn/2018/11/21/learn-markdown.html)
- [Liquid语法教程](https://liquid.bootcss.com/basics/types/)
- [Jekyll教程](https://jekyllcn.com/)


