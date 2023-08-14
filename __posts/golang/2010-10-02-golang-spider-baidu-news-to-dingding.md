---
layout: post
title: 钉钉机器人订阅百度新闻
category: Golang
tags: 
    - golang
    - Spider
    - 钉钉
description: golang 钉钉机器人
date: 2018-12-26T13:19:54+08:00

---

## 1. 资料

##### 1.1.第三方包

* [github.com/PuerkitoBio/goquery](https://godoc.org/github.com/PuerkitoBio/goquery)
* [github.com/go-redis/redis](https://godoc.org/github.com/PuerkitoBio/goquery)
* [beego框架定时任务包](https://beego.me/docs/module/toolbox.md#task)

##### 1.2.接口

* [百度新闻:美剧关键字](http://news.baidu.com/ns?cl=2&rn=20&tn=news&word=%E7%BE%8E%E5%89%A7)
* [钉钉群BOT文档](https://open-doc.dingtalk.com/docs/doc.htm?spm=a219a.7629140.0.0.t8inXi&treeId=257&articleId=105735&docType=1#s6)

## 2. 初始化项目变量

```
package main

import (
	"fmt"
	"log"
	"github.com/PuerkitoBio/goquery"
	"github.com/go-redis/redis"
	"net/http"
	"bytes"
	"github.com/astaxie/beego/toolbox"
)

var (
	redisClient *redis.Client //redis 缓存
        //钉钉群机器人webhook地址
	dingdingURL = "https://oapi.dingtalk.com/robot/send?access_token=dingding_talk_group_bot_webhook_token"
        //百度新闻搜索关键字URL
	baiduNewsUrlWithSearchKeyword = "http://news.baidu.com/ns?cl=2&rn=20&tn=news&word=%E7%89%A9%E8%81%94%E7%BD%91"
)

const (
	newsFeed = "news_feed"//爬取到的百度新闻redis key
	newsPost = "news_post"//已发送的百度新闻redis key
	newsList = "iot_news" //储存了的百度新闻redis key
)
//实例化redis缓存
func init() {
	redisClient = redis.NewClient(&redis.Options{
		Addr:     "127.0.0.1:6379",
		Password: "ddfrfgtre4353252", // redis password
		DB:       0,                            // redis 数据库ID
	})
}
```

在机器人管理页面选择“自定义”机器人,输入机器人名字并选择要发送消息的群.如果需要的话,可以为机器人设置一个头像.点击“完成添加”.
![](https://img.alicdn.com/top/i1/LB1uXZyPFXXXXXoXpXXXXXXXXXX)
![](https://img.alicdn.com/top/i1/LB1lIUlPFXXXXbGXFXXXXXXXXXX)

点击“复制”按钮,即可获得这个机器人对应的Webhook地址,赋值给 `dingdingURl`

## 3 `func newsBot`

##### 3.1 使用goquery和网页元素选择器语法提取有用信息

```
func newsBot() error {
	// 获取html doc
	doc, err := goquery.NewDocument(baiduNewsUrlWithSearchKeyword)
	if err != nil {
		return nil
	}
        //使用redis pipeline 减少redis连接数
	pipe := redisClient.Pipeline()
	// 使用selector xpath 语法获取有用信息
        // 储存新闻到redis中 newsList
        // 储存新闻ur到redis-set 建newfeed 为以后是用sdiff 找出没有发送的新闻


	doc.Find("div.result").Each(func(i int, s *goquery.Selection) {
		// For each item found, get the band and title
		URL, _ := s.Find("h3 > a").Attr("href")
		Source := s.Find("p.c-author").Text()
		Title := s.Find("h3 > a").Text()
		markdown := fmt.Sprintf("- [%s](%s) _%s_", Title, URL, Source)
		pipe.HSet(newsList, URL, markdown)
		pipe.SAdd(newsFeed, URL)
	})
        //执行redis pipeline
	pipe.Exec()
```

##### 3.2 排除以发送的新闻,拼接markdown字符串

```
        //使用redis sdiff找出没有发送的新闻url
	unSendNewsUrls := redisClient.SDiff(newsFeed, newsPost).Val()
        //新闻按dingding文档markdonw 规范拼接
        
	content := ""
	for _, url := range unSendNewsUrls {
		md := redisClient.HGet(newsList, url).Val()
		content = content + " \n " + md
                //记录已发送新闻的url地址
		pipe.SAdd(newsPost, url)
	}
	pipe.Exec()
```

##### 3.3 调用钉钉群机器人接口

```
        //如果有未发送新闻 请求钉钉webhook
	if content != "" {
		formt := `
		{
			"msgtype": "markdown",
			"markdown": {
				"title":"IOT每日新闻",
				"text": "%s"
			}
		}`
		body := fmt.Sprintf(formt, content)
		jsonValue := []byte(body)
                //发送消息到钉钉群使用webhook
                //钉钉文档 https://open-doc.dingtalk.com/docs/doc.htm?spm=a219a.7629140.0.0.karFPe&treeId=257&articleId=105735&docType=1
		resp, err := http.Post(dingdingURL, "application/json", bytes.NewBuffer(jsonValue))
		if (err != nil) {
			return err
		}
		log.Println(resp)
	}
	return nil
}
```

`func newsBot`函数完成

## 4. 设置定时任务

```
func main() {
        //销毁redisClient
	defer redisClient.Close()

	//创建定时任务
        //每天 8点 13点 18点 自动执行爬虫和机器人
        // 
	dingdingNewsBot := toolbox.NewTask("dingding-news-bot", "0 0 8,13,18 * * *", newsBot)
	//dingdingNewsBot := toolbox.NewTask("dingding-news-bot", "0 40 */1 * * *", newsBot)
	//err := dingdingNewsBot.Run()
	//检测定时任务
	// if err != nil {
	// 	log.Fatal(err)
	// }
	//添加定时任务
	toolbox.AddTask("dingding-news-bot", dingdingNewsBot)
	//启动定时任务
	toolbox.StartTask()
	defer toolbox.StopTask()
	select {}
}
```

> [spec 格式是参照](https://beego.me/docs/module/toolbox.md#task)

## 5 最终代码

- [v1 最终完整代码`main.go`](https://gist.github.com/mojocn/43b47e8d97abb1e00fd19b2864f053c1)
- [v2 版本支持多关键字,分批发送`main.go`](https://gist.github.com/mojocn/9b18db2c99b01e49ce6afbbb2322e07a)

## 5 编译运行

```bash
go build main.go
nohup ./main &
```

最终效果
![dingding-webhook-bot](http://img.trytv.org/bot.png)

## 7 最后

* 欢迎star我的[golang-base64captcha开源项目](https://github.com/mojocn/base64Captcha)
* 如有疑问欢迎email: neochau@gmail.com
* 或者 comment [github gist](https://gist.github.com/mojocn/43b47e8d97abb1e00fd19b2864f053c1)