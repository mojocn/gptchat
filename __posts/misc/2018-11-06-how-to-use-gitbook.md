---
layout: post
title: gitbook安装使用教程
category: Misc
tags: Nginx gitbook node npm github pages
keywords: gitbook 安装使用教程,node,npm
date: 2018-12-26T13:19:54+08:00
---

## GitBook 简介

* [GitBook 官网](https://www.gitbook.com)
* [GitBook 文档](http://www.chengweiyang.cn/gitbook/basic-usage/README.html)

## GitBook 准备工作

### 熟悉[`markdown`语法教程](http://www.markdown.cn/)

### 安装 Node.js

GitBook 是一个基于 Node.js 的命令行工具,下载安装 [Node.js](https://nodejs.org/en),安装完成之后,您可以使用下面的命令来检验是否安装成功.

- `node -v`
- ![](/assets/image/gitbook01.jpg)

### 安装 GitBook

输入下面命令安装`gitbook`(二选一)

- 使用原始npm全局安装`npm install gitbook-cli -g`, `-g`参数代表全局安装
- 使用淘宝源安装`gitbook`(针对墙内用户)
    1. [快速安装淘宝源npm](https://npm.taobao.org/),`npm install -g cnpm --registry=https://registry.npm.taobao.org`
    2. `cnpm install gitbook-cli -g`,淘宝npm源在墙内安装速度会更快.
       安装完成之后,使用`gitbook -V`来检测gitbook安装是否成功.

![](/assets/image/gitbook02.jpg)

更多详情请参照 [GitBook 安装文档](http://www.chengweiyang.cn/gitbook/installation/README.html)

## 先睹为快

GitBook 准备工作做好之后,我们进入一个您要写书的目录,输入如下命令.

```shell
mkdir your_new_book
gitbook init
```

![](/assets/image/gitbook03.jpg)

可以看到他会创建 README.md 和 SUMMARY.md 这两个文件,README.md 应该不陌生,就是说明文档,而 SUMMARY.md 其实就是书的章节目录,其默认内容如下所示：

接下来,我们输入 `$ gitbook serve` 命令,然后在浏览器地址栏中输入 `http://localhost:4000` 便可预览书籍.

效果如下所示：
![](/assets/image/gitbook04.jpg)

运行该命令后会在书籍的文件夹中生成一个 `_book` 文件夹, 里面的内容即为生成的 html 文件.
我们可以使用下面命令来生成网页而不开启服务器.`gitbook build`
下面我们来详细介绍下 GitBook 目录结构及相关文件.

## 下面我们主要来讲讲 book.json 和 SUMMARY.md 文件.

### book.json

该文件主要用来存放配置信息,我先放出我的配置文件.

```javascript
    {
        "title": "标题",
        "author": "作者",
        "description": "描述简介",
        "language": "zh-hans",
        "gitbook": "3.2.3",
        "styles": {
            "website": "./styles/website.css"
        },
        "structure": {
            "readme": "README.md"
        },
        "links": {
            "sidebar": {
                "我的狗窝": "https://blankj.com"
            }
        },
        "plugins": [
            "-sharing",
            "splitter",
            "expandable-chapters-small",
            "anchors",

            "github",
            "github-buttons",
            "donate",
            "sharing-plus",
            "anchor-navigation-ex",
            "favicon"
        ],
        "pluginsConfig": {
            "github": {
                "url": "https://github.com/Blankj"
            },
            "github-buttons": {
                "buttons": [{
                    "user": "Blankj",
                    "repo": "glory",
                    "type": "star",
                    "size": "small",
                    "count": true
                    }
                ]
            },
            "donate": {
                "alipay": "./source/images/donate.png",
                "title": "",
                "button": "赞赏",
                "alipayText": " "
            },
            "sharing": {
                "douban": false,
                "facebook": false,
                "google": false,
                "hatenaBookmark": false,
                "instapaper": false,
                "line": false,
                "linkedin": false,
                "messenger": false,
                "pocket": false,
                "qq": false,
                "qzone": false,
                "stumbleupon": false,
                "twitter": false,
                "viber": false,
                "vk": false,
                "weibo": false,
                "whatsapp": false,
                "all": [
                    "google", "facebook", "weibo", "twitter",
                    "qq", "qzone", "linkedin", "pocket"
                ]
            },
            "anchor-navigation-ex": {
                "showLevel": false
            },
            "favicon":{
                "shortcut": "./source/images/favicon.jpg",
                "bookmark": "./source/images/favicon.jpg",
                "appleTouch": "./source/images/apple-touch-icon.jpg",
                "appleTouchMore": {
                    "120x120": "./source/images/apple-touch-icon.jpg",
                    "180x180": "./source/images/apple-touch-icon.jpg"
                }
            }
        }
    }
```

这个文件主要决定 GitBook 的章节目录,它通过 markdown 中的列表语法来表示文件的父子关系,下面是一个简单的示例：

```
    # Summary
    
    * [摘要](README.md)
    
    * [1. CMDB](chapter1/README.md)
      * [1.1 设备管理](chapter1/section1.1.md)
      * [1.2 业务管理](chapter1/section1.2.md)
    * [2. 软件管理](chapter2/README.md)
      * [2.1 软件仓库](chapter2/section2.1.md)
      * [2.3 自定义模板](chapter2/section2.2.md)
    * [3. 用户管理](chapter1/README.md)
      * [3.1 管理员](chapter3/section3.1.md)
      * [3.2 权限管理](chapter3/section3.2.md)
    * [4 .操作记录](chapter4/README.md)
      * [4.1 任务管理](chapter4/section4.1.md)
```

我们通过使用 `标题` 或者 `水平分割线` 将 GitBook 分为几个不同的部分,如下所示：

    # Summary

    ### Part I

    * [Introduction](README.md)
    * [Writing is nice](part1/writing.md)
    * [GitBook is nice](part1/gitbook.md)

    ### Part II

    * [We love feedback](part2/feedback_please.md)
    * [Better tools for authors](part2/better_tools.md)

    ---

    * [Last part without title](part3/title.md)

## 插件

gitbook 还支持许多插件,用户可以从 NPM 上搜索 gitbook 的插件,gitbook 文档 推荐插件的命名方式为：
`gitbook-plugin-X`: 插件
`gitbook-theme-X`: 主题

GitBook 有 [插件官网](https://plugins.gitbook.com/),默认带有 5 个插件,highlight,search,sharing,font-settings,livereload,如果要去除自带的插件, 可以在插件名称前面加 `-`,比如：

    "plugins": [
        "-search"
    ]

如果要配置使用的插件可以在 book.json 文件中加入即可,比如我们添加 [plugin-github](https://plugins.gitbook.com/),我们在 book.json
中加入配置如下即可：

    {
        "plugins": [ "github" ],
        "pluginsConfig": {
            "github": {
                "url": "https://github.com/your/repo"
            }
        }
    }

然后在终端输入 `gitbook install ./` 即可.

如果要指定插件的版本可以使用 plugin@0.3.1,因为一些插件可能不会随着 GitBook 版本的升级而升级.


