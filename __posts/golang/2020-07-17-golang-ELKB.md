---
layout: post
title: "Go进阶45:Golang-logrus简单的日志收集系统(替代ELKB)"
category: Golang
tags: Go进阶 
keywords: "golang 日志收集系统 elastic search"
description: "golang 日志收集系统 elastic search"
coverage: golang_es_coverage.png
permalink: /go/:title
date: 2020-07-17T17:06:00+08:00
---

## 1. 背景

不废话,
Golang 日志查看疼点

1. linux查看日志,一般开发者对linux命令不是很熟悉, 到服务上搜索日志关键词就够我们吃一壶.
2. JAVA生态 ELKB 日志收集搭建复杂,有的适合我们不需要一个很重的东西来完成一个小的项目.
3. 我正真需要的是一个带有图像界面的日志快速搜索的客户端

### 1.1 前期准备

我们可以使用logrus( logrus 是一个非常容易扩展的golang 日志库 [logrus使用教程](/2018/12/27/golang-logrus-tutorial) ) HOOK 快速的输出日志到 Elastic Search,
再使用Chrome Elastic Search 浏览器插件来做我们的日志管理搜索工具.

1. 收集日志:  https://github.com/sirupsen/logrus
2. 日志保存: docker elastic-search 数据库 : `docker run -d --name es.dev -p 9201:9200 -p 9301:9300 -e "discovery.type=single-node" elastic/elasticsearch:6.7.1`
3. ES图像管理工具客户端: chrome浏览器插件安装  [Chrome Plugin ElasticSearch Head](https://chrome.google.com/webstore/detail/elasticsearch-head/ffmkiejjmecolpfloofpjologoblkegm)

## 2. 安装ES数据库

您可以去网上搜搜索 es数据库安装教程,在本教程中我们就直接安装一个 docker 单节点ES (处理golang日志性能足够).

- Docker拉取镜像  `docker pull elasticsearch:6.7.0`
- 启动Docker 单节点ES `docker run -d --name mojocn.es -p 9201:9200 -p 9301:9300 -e "discovery.type=single-node" elastic/elasticsearch:6.7.1`

这样就您就启动了一个名字为 `mojocn.es` 暴露端口: `9201` 的单节点ES数据库.

## 3. 编写实现 logrus HOOK interface (核心代码)

main.go 完整代码: [https://github.com/mojocn/eslogrushook](https://github.com/mojocn/eslogrushook)

```go
package main

import (
	"context"
	"fmt"
	"github.com/olivere/elastic"
	"github.com/sirupsen/logrus"
	"log"
	"os"
	"strings"
	"time"
)

//cfg 配置文件
type cfg struct {
	LogLvl     string   // 日志级别
	EsAddrs    []string //ES addr
	EsUser     string   //ES user
	EsPassword string   //ES password
}

//setupLogrus 初始化logrus 同时把logrus的logger var 引用到这个common.Logger
func setupLogrus(cc cfg) error {
	//logFileName := fmt.Sprintf("%s_%s.log", os.Args[1], time.Now().Format("06_01_02T15_04_05"))
	//
	//f, err := os.Create(logFileName)
	//if err != nil {
	//	return err
	//}

	logLvl, err := logrus.ParseLevel(cc.LogLvl)
	if err != nil {
		return err
	}
	logrus.SetLevel(logLvl)
	//logrus.SetReportCaller(true)
	//logrus.SetFormatter(&logrus.JSONFormatter{})
	//使用console默认输出

	//logrus.SetOutput(f)

	logrus.SetReportCaller(true)
	//开启 logrus ES hook
	esh := newEsHook(cc)
	logrus.AddHook(esh)
	fmt.Printf(">= error 级别,查看日志 %#v  中的logrus* 索引\n", cc.EsAddrs)

	return nil
}
func main() {
	cc := cfg{
		LogLvl:     "error",
		EsAddrs:    []string{"http://es.felix.mojotv.cn:9202/"},
		EsUser:     "",
		EsPassword: "",
	}
	err := setupLogrus(cc)
	if err != nil {
		log.Fatal(err)
	}
	logrus.WithField("URI", "mojotv.cn").Error("I love my son Felix")
	//等待日志发送到ES
	time.Sleep(time.Second * 10)
}

//esHook 自定义的ES hook
type esHook struct {
	cmd    string // 记录启动的命令
	client *elastic.Client
}

//newEsHook 初始化
func newEsHook(cc cfg) *esHook {
	es, err := elastic.NewClient(
		elastic.SetURL(cc.EsAddrs...),
		elastic.SetBasicAuth(cc.EsUser, cc.EsPassword),
		elastic.SetSniff(false),
		elastic.SetHealthcheckInterval(15*time.Second),
		elastic.SetErrorLog(log.New(os.Stderr, "ES:", log.LstdFlags)),
		//elastic.SetInfoLog(log.New(os.Stdout, "ES:", log.LstdFlags)),
	)

	if err != nil {
		log.Fatal("failed to create Elastic V6 Client: ", err)
	}
	return &esHook{client: es, cmd: strings.Join(os.Args, " ")}
}

//Fire logrus hook interface 方法
func (hook *esHook) Fire(entry *logrus.Entry) error {
	doc := newEsLog(entry)
	doc["cmd"] = hook.cmd
	go hook.sendEs(doc)
	return nil
}

//Levels logrus hook interface 方法
func (hook *esHook) Levels() []logrus.Level {
	return []logrus.Level{
		logrus.PanicLevel,
		logrus.FatalLevel,
		logrus.ErrorLevel,
	}
}

//sendEs 异步发送日志到es
func (hook *esHook) sendEs(doc appLogDocModel) {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("send entry to es failed: ", r)
		}
	}()
	_, err := hook.client.Index().Index(doc.indexName()).Type("_doc").BodyJson(doc).Do(context.Background())
	if err != nil {
		log.Println(err)
	}

}

//appLogDocModel es model
type appLogDocModel map[string]interface{}

func newEsLog(e *logrus.Entry) appLogDocModel {
	ins := map[string]interface{}{}
	for kk, vv := range e.Data {
		ins[kk] = vv
	}
	ins["time"] = time.Now().Local()
	ins["lvl"] = e.Level
	ins["message"] = e.Message
	ins["caller"] = fmt.Sprintf("%s:%d  %#v", e.Caller.File, e.Caller.Line, e.Caller.Func)
	return ins
}

// indexName es index name 时间分割
func (m *appLogDocModel) indexName() string {
	return "mojocn-cn-" + time.Now().Local().Format("2006-01-02")
}

```

go run main.go 日志输出

```bash
>= error 级别,查看日志 []string{"http://i.love.mojotv.cn:9202/"}  中的logrus* 索引
time="2020-07-17T17:26:03+08:00" level=error msg=lld func=main.main file="D:/GolandProjects/logrusEsHook/main.go:59" URI=mojotv.cn
```

## 4. Chrome 插件 ElasticSearch Head 日志查看

- 第一步: 在Chrome 浏览器插件 ElasticSearch Head: 配置ES 连接地址
- 第二部: 利用chrome ES 插件图像界面 查看/搜索 您需要的logrus日志

![](/assets/image/logrus_es_hook.png)