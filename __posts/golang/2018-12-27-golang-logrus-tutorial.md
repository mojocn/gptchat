---
layout: post
title: Go进阶10:logrus日志使用教程
category: Golang
tags: Go进阶
description: logrus功能强大,性能高效,而且具有高度灵活性,提供了自定义插件的功能.很多开源项目,如docker,prometheus等,都是用了logrus来记录其日志.
keywords: golang,go语言,logrus日志使用教程,logrus hook,logrus-email,logrus-slack
date: 2018-12-27T13:19:54+08:00
score: 5.0
coverage: glang_logrus_logo.png
---

## golang日志库

`golang`标准库的日志框架非常简单,仅仅提供了`print`,`panic`和`fatal`三个函数对于更精细的日志级别,日志文件分割以及日志分发等方面并没有提供支持.
所以催生了很多第三方的日志库,但是在golang的世界里,没有一个日志库像slf4j那样在Java中具有绝对统治地位.golang中,流行的日志框架包括logrus,zap,zerolog,seelog等.

**`logrus`是目前Github上star数量最多的日志库,目前(2018.12,下同)star数量为8119,fork数为1031.**
**`logrus`
功能强大,性能高效,而且具有高度灵活性,提供了自定义插件的功能.很多开源项目,如`docker`,`prometheus`,[`dejavuzhou/ginbro`](https://github.com/libragen/ginbro/blob/master/readme_zh.md)
等,都是用了logrus来记录其日志.**

zap是Uber推出的一个快速,结构化的分级日志库.具有强大的ad-hoc分析功能,并且具有灵活的仪表盘.zap目前在GitHub上的star数量约为4.3k.
seelog提供了灵活的异步调度,格式化和过滤功能.目前在GitHub上也有约1.1k.

## logrus特性

- 完全兼容golang标准库日志模块：logrus拥有六种日志级别：`debug`,`info`,`warn`,`error`,`fatal`和`panic`,这是golang标准库日志模块的API的超集.如果您的项目使用标准库日志模块,完全可以以最低的代价迁移到logrus上.
    - `logrus.Debug("Useful debugging information.")`
    - `logrus.Info("Something noteworthy happened!")`
    - `logrus.Warn("You should probably take a look at this.")`
    - `logrus.Error("Something failed but I'm not quitting.")`
    - `logrus.Fatal("Bye.")`   //log之后会调用os.Exit(1)
    - `logrus.Panic("I'm bailing.")`   //log之后会panic()

- 可扩展的Hook机制：允许使用者通过hook的方式将日志分发到任意地方,如本地文件系统,标准输出,`logstash`,`elasticsearch`或者`mq`等,或者通过hook定义日志内容和格式等.
- 可选的日志输出格式：logrus内置了两种日志格式,`JSONFormatter`和`TextFormatter`,如果这两个格式不满足需求,可以自己动手实现接口Formatter,来定义自己的日志格式.
- `Field`机制：`logrus`鼓励通过Field机制进行精细化的,结构化的日志记录,而不是通过冗长的消息来记录日志.
- `logrus`是一个可插拔的,结构化的日志框架.
- `Entry`: `logrus.WithFields`会自动返回一个 `*Entry,Entry`里面的有些变量会被自动加上
    - `time:entry`被创建时的时间戳
    - msg:在调用`.Info()`等方法时被添加
    - level

## logrus的使用

### 1.基本用法

```go
package main

import (
  log "github.com/sirupsen/logrus"
)

func main() {
  log.WithFields(log.Fields{
    "animal": "walrus",
  }).Info("A walrus appears")
}
```

上面代码执行后,标准输出上输出如下：

```shell
time="2018-08-11T15:42:22+08:00" level=info msg="A walrus appears" animal=walrus
```

`logrus`与golang标准库日志模块完全兼容,因此您可以使用`log“github.com/sirupsen/logrus”`替换所有日志导入.
`logrus`可以通过简单的配置,来定义输出,格式或者日志级别等.

```go
package main

import (
    "os"
    log "github.com/sirupsen/logrus"
)

func init() {
    // 设置日志格式为json格式
    log.SetFormatter(&log.JSONFormatter{})

    // 设置将日志输出到标准输出（默认的输出为stderr,标准错误）
    // 日志消息输出可以是任意的io.writer类型
    log.SetOutput(os.Stdout)

    // 设置日志级别为warn以上
    log.SetLevel(log.WarnLevel)
}

func main() {
    log.WithFields(log.Fields{
        "animal": "walrus",
        "size":   10,
    }).Info("A group of walrus emerges from the ocean")

    log.WithFields(log.Fields{
        "omg":    true,
        "number": 122,
    }).Warn("The group's number increased tremendously!")

    log.WithFields(log.Fields{
        "omg":    true,
        "number": 100,
    }).Fatal("The ice breaks!")
}
```

### 2.自定义Logger

如果想在一个应用里面向多个地方`log`,可以创建Logger实例.
`logger`是一种相对高级的用法, 对于一个大型项目, 往往需要一个全局的`logrus`实例,即`logger`对象来记录项目所有的日志.如：

```go
package main

import (
    "github.com/sirupsen/logrus"
    "os"
)

// logrus提供了New()函数来创建一个logrus的实例.
// 项目中,可以创建任意数量的logrus实例.
var log = logrus.New()

func main() {
    // 为当前logrus实例设置消息的输出,同样地,
    // 可以设置logrus实例的输出到任意io.writer
    log.Out = os.Stdout

    // 为当前logrus实例设置消息输出格式为json格式.
    // 同样地,也可以单独为某个logrus实例设置日志级别和hook,这里不详细叙述.
    log.Formatter = &logrus.JSONFormatter{}

    log.WithFields(logrus.Fields{
        "animal": "walrus",
        "size":   10,
    }).Info("A group of walrus emerges from the ocean")
}
```

### 3.Fields用法

前一章提到过,`logrus`不推荐使用冗长的消息来记录运行信息,它推荐使用`Fields`来进行精细化的,结构化的信息记录.
例如下面的记录日志的方式：

```go
log.Fatalf("Failed to send event %s to topic %s with key %d", event, topic, key)
````

在`logrus`中不太提倡,`logrus`鼓励使用以下方式替代之：

```go
log.WithFields(log.Fields{
  "event": event,
  "topic": topic,
  "key": key,
}).Fatal("Failed to send event")
```

前面的WithFields API可以规范使用者按照其提倡的方式记录日志.但是WithFields依然是可选的,因为某些场景下,使用者确实只需要记录仪一条简单的消息.

通常,在一个应用中,或者应用的一部分中,都有一些固定的Field.比如在处理用户http请求时,上下文中,所有的日志都会有`request_id`和`user_ip`.为了避免每次记录日志都要使用log.WithFields(
log.Fields{"request_id": request_id, "user_ip": user_ip}),我们可以创建一个logrus.Entry实例,为这个实例设置默认Fields,在上下文中使用这个logrus.Entry实例记录日志即可.

```shell
requestLogger := log.WithFields(log.Fields{"request_id": request_id, "user_ip": user_ip})
requestLogger.Info("something happened on that request") # will log request_id and user_ip
requestLogger.Warn("something not great happened")
```

### 4.Hook接口用法

logrus最令人心动的功能就是其可扩展的HOOK机制了,通过在初始化时为logrus添加hook,logrus可以实现各种扩展功能.

logrus的hook接口定义如下,其原理是每此写入日志时拦截,修改logrus.Entry.

```go
// logrus在记录Levels()返回的日志级别的消息时会触发HOOK,
// 按照Fire方法定义的内容修改logrus.Entry.
type Hook interface {
    Levels() []Level
    Fire(*Entry) error
}
```

一个简单自定义hook如下,DefaultFieldHook定义会在所有级别的日志消息中加入默认字段appName="myAppName".

```go
type DefaultFieldHook struct {
}

func (hook *DefaultFieldHook) Fire(entry *log.Entry) error {
    entry.Data["appName"] = "MyAppName"
    return nil
}

func (hook *DefaultFieldHook) Levels() []log.Level {
    return log.AllLevels
}
```

`hook`的使用也很简单,在初始化前调用`log.AddHook(hook)`添加相应的`hook`即可.

`logrus`官方仅仅内置了`syslog`的`hook`.
此外,但Github也有很多第三方的`hook`可供使用,文末将提供一些第三方`HOOK`的连接.

### 4.1 Logrus-Hook-Email

`email`这里只需用`NewMailAuthHook`方法得到`hook`,再添加即可

```go
func Email(){
    logger:= logrus.New()
    //parameter"APPLICATION_NAME", "HOST", PORT, "FROM", "TO"
    //首先开启smtp服务,最后两个参数是smtp的用户名和密码
    hook, err := logrus_mail.NewMailAuthHook("testapp", "smtp.163.com",25,"username@163.com","username@163.com","smtp_name","smtp_password")
    if err == nil {
        logger.Hooks.Add(hook)
    }
    //生成*Entry
    var filename="123.txt"
    contextLogger :=logger.WithFields(logrus.Fields{
        "file":filename,
        "content":  "GG",
    })
    //设置时间戳和message
    contextLogger.Time=time.Now()
    contextLogger.Message="这是一个hook发来的邮件"
    //只能发送Error,Fatal,Panic级别的log
    contextLogger.Level=logrus.FatalLevel

    //使用Fire发送,包含时间戳,message
    hook.Fire(contextLogger)
}
```

### 4.2 Logrus-Hook-Slack

安装slackrus `github.com/johntdyer/slackrus`

```go
package main

import (
	logrus "github.com/sirupsen/logrus"
	"github.com/johntdyer/slackrus"
	"os"
)

func main() {

	logrus.SetFormatter(&logrus.JSONFormatter{})

	logrus.SetOutput(os.Stderr)

	logrus.SetLevel(logrus.DebugLevel)
	
	logrus.AddHook(&slackrus.SlackrusHook{
		HookURL:        "https://hooks.slack.com/services/abc123/defghijklmnopqrstuvwxyz",
		AcceptedLevels: slackrus.LevelThreshold(logrus.DebugLevel),
		Channel:        "#slack-testing",
		IconEmoji:      ":ghost:",
		Username:       "foobot",
	})

	logrus.Warn("warn")
	logrus.Info("info")
	logrus.Debug("debug")
}
```

- HookURL: 填写slack web-hook地址
- AcceptedLevels: 设置日志输出级别
- Channel: 设置日志频道
- Username: 设置需要@的用户名

### 4.3 Logrus-Hook 日志分隔

logrus本身不带日志本地文件分割功能,但是我们可以通过file-rotatelogs进行日志本地文件分割. 每次当我们写入日志的时候,logrus都会调用file-rotatelogs来判断日志是否要进行切分.关于本地日志文件分割的例子网上很多,这里不再详细介绍,奉上代码：

```go
import (
    "github.com/lestrrat-go/file-rotatelogs"
    "github.com/rifflock/lfshook"
    log "github.com/sirupsen/logrus"
    "time"
)

func newLfsHook(logLevel *string, maxRemainCnt uint) log.Hook {
    writer, err := rotatelogs.New(
        logName+".%Y%m%d%H",
        // WithLinkName为最新的日志建立软连接,以方便随着找到当前日志文件
        rotatelogs.WithLinkName(logName),

        // WithRotationTime设置日志分割的时间,这里设置为一小时分割一次
        rotatelogs.WithRotationTime(time.Hour),

        // WithMaxAge和WithRotationCount二者只能设置一个,
        // WithMaxAge设置文件清理前的最长保存时间,
        // WithRotationCount设置文件清理前最多保存的个数.
        //rotatelogs.WithMaxAge(time.Hour*24),
        rotatelogs.WithRotationCount(maxRemainCnt),
    )

    if err != nil {
        log.Errorf("config local file system for logger error: %v", err)
    }

    level, ok := logLevels[*logLevel]

    if ok {
        log.SetLevel(level)
    } else {
        log.SetLevel(log.WarnLevel)
    }

    lfsHook := lfshook.NewHook(lfshook.WriterMap{
        log.DebugLevel: writer,
        log.InfoLevel:  writer,
        log.WarnLevel:  writer,
        log.ErrorLevel: writer,
        log.FatalLevel: writer,
        log.PanicLevel: writer,
    }, &log.TextFormatter{DisableColors: true})

    return lfsHook
}
```

使用上述本地日志文件切割的效果如下：

![](/assets/image/golang_logrus_sc01.png)

### 4.4 Logrus-Dingding-Hook 阿里钉钉群机器人

#### [钉钉开发文档自定义机器人](https://open-doc.dingtalk.com/microapp/serverapi2/qf2nxq)

#### 自定义hook代码 [`utils/logrus_hook_dingding.go`](https://github.com/libragen/felix/blob/master/utils/logrus_hook_dingding.go)

可以无视的方法(异步发送http json body 到钉钉api 加快响应速度)

- `hook.jsonBodies`
- `hook.closeChan`
- `func (dh *dingHook) startDingHookQueueJob()`
- `func (dh *dingHook) Fire2(e *logrus.Entry) error`

```go
package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"github.com/sirupsen/logrus"
)

var allLvls = []logrus.Level{
	logrus.DebugLevel,
	logrus.InfoLevel,
	logrus.WarnLevel,
	logrus.ErrorLevel,
	logrus.FatalLevel,
	logrus.PanicLevel,
}

func NewDingHook(url, app string, thresholdLevel logrus.Level) *dingHook {
	temp := []logrus.Level{}
	for _, v := range allLvls {
		if v <= thresholdLevel {
			temp = append(temp, v)
		}
	}
	hook := &dingHook{apiUrl: url, levels: temp, appName: app}
	hook.jsonBodies = make(chan []byte)
	hook.closeChan = make(chan bool)
	//开启chan 队列 执行post dingding hook api
	go hook.startDingHookQueueJob()
	return hook
}

func (dh *dingHook) startDingHookQueueJob() {
	for {
		select {
		case <-dh.closeChan:
			return
		case bs := <-dh.jsonBodies:
			res, err := http.Post(dh.apiUrl, "application/json", bytes.NewBuffer(bs))
			if err != nil {
				log.Println(err)
			}
			if res != nil && res.StatusCode != 200 {
				log.Println("dingHook go chan http post error", res.StatusCode)
			}
		}
	}

}

type dingHook struct {
	apiUrl     string
	levels     []logrus.Level
	appName    string
	jsonBodies chan []byte
	closeChan  chan bool
}


// Levels sets which levels to sent to slack
func (dh *dingHook) Levels() []logrus.Level {
	return dh.levels
}

//Fire2 这个异步有可能导致 最后一条消息丢失,main goroutine 提前结束到导致 子线程http post 没有发送
func (dh *dingHook) Fire2(e *logrus.Entry) error {
	msg, err := e.String()
	if err != nil {
		return err
	}
	dm := dingMsg{Msgtype: "text"}
	dm.Text.Content = fmt.Sprintf("%s \n %s", dh.appName, msg)
	bs, err := json.Marshal(dm)
	if err != nil {
		return err
	}
	dh.jsonBodies <- bs
	return nil
}
func (dh *dingHook) Fire(e *logrus.Entry) error {
	msg, err := e.String()
	if err != nil {
		return err
	}
	dm := dingMsg{Msgtype: "text"}
	dm.Text.Content = fmt.Sprintf("%s \n %s", dh.appName, msg)
	bs, err := json.Marshal(dm)
	if err != nil {
		return err
	}
	res, err := http.Post(dh.apiUrl, "application/json", bytes.NewBuffer(bs))
	if err != nil {
		return err
	}
	if res != nil && res.StatusCode != 200 {
		return fmt.Errorf("dingHook go chan http post error %d", res.StatusCode)
	}
	return nil
}

type dingMsg struct {
	Msgtype string `json:"msgtype"`
	Text    struct {
		Content string `json:"content"`
	} `json:"text"`
}
```

#### 使用钉钉hook [`cmd/root.go`](https://github.com/libragen/felix/blob/master/cmd/root.go)

```go
func initSlackLogrus() {
	lvl := logrus.InfoLevel
	//钉钉群机器人API地址
	apiUrl := viper.GetString("logrus.dingHookUrl")
	dingHook := utils.NewDingHook(apiUrl, "Felix", lvl)

	logrus.SetLevel(lvl)
	logrus.SetFormatter(&logrus.JSONFormatter{TimestampFormat: "06-01-02T15:04:05"})
	logrus.SetReportCaller(true)
	logrus.AddHook(dingHook)
}
```

## logrus 线程安全

默认的logger在并发写的时候是被mutex保护的,比如当同时调用hook和写log时mutex就会被请求,有另外一种情况,文件是以appending mode打开的,
此时的并发操作就是安全的,可以用logger.SetNoLock()来关闭它

## 致谢

- [logrus](https://github.com/sirupsen/logrus)
- [logrus-hook-email](https://github.com/zbindenren/logrus_mail)
- [logrus-hook-slack](https://github.com/johntdyer/slackrus)
- [logrus-hook-钉钉](https://github.com/dandans-dan/dingrus)