---
layout: post
title: Go进阶11:真的需要第三方go-web框架
category: Golang
tags: Go进阶
description: Go的官方标准库为不使用web框架提供了一个强有力的理由.在Go中,仅使用官方标准库就可以创建复杂的web应用程序
keywords: golang,web框架,RESTful APIs,router mux
date: 2019-01-02T13:19:54+08:00
score: 5.0
coverage: logo_go_web.png
---

## 1.前言

**Go的官方标准库为不使用web框架提供了一个强有力的理由.**

您是否需要web框架的问题在Go中比在任何其他语言中更常见.

- 您会在没有Ruby on Rails的情况下用原生Ruby创建web应用程序吗?
- Python没有Django,您能够使用python创建web应用吗?
- PHP没有Laravel,您能够创建应用吗?

在Go中,仅使用官方标准库就可以创建复杂的web应用程序.它提供了您需要的所有内容,包括管理`http请求/响应` `生命周期`,`设置http服务器`,`encode/decode json`等等.

让我们看看现在需要什么来创建一个简单的后端API,它可以被iOS/Android应用程序,前端SPA或第三方使用.
然后,我们将使用官方标准库提出这些问题的最简单解决方案.

**剧透警告:我们可能会遇到一些颠簸.**

## 2.路由

任何重要的应用程序都可以有数十或数百条`路由`.
您需要一种可伸缩的方式来管理这些路由.您需要遵守`RESTfl APIs`的设计规范,这样可以方便地在URL中嵌入变量,并将它们与控制器进行模式匹配.
那么,将`/item/{id}`匹配到`Go`中的控制器有多难呢?
快速搜索谷歌会出现StackOverflow答案.最受欢迎的回答是“创建自己的`handler方法`,可以使用正则表达式或任何其他模式,这并不太难”.它接着给出了25行编译(但未测试)的问题解决方案.
很容易.复制粘贴就完成了.还是您是?您意识到您的需求可能比这更广泛,您回到谷歌寻找一个更“完整”的解决方案.
您无意中发现了一个很受欢迎的围棋图书馆,名叫[`Gorilla Mux`](http://www.gorillatoolkit.org/pkg/mux).
同样,很容易.添加一个小的依赖项,您就可以开始了.
虽然它是一个完全有效的解决方案,但是您现在已经承认,尽管官方标准库非常强大,但是它可能有点太原始了.它不时需要一个图层,以便于使用.

附注:IMHO,对于很多人来说,使用`Gorilla Mux`是一个非常好的选择,因为它在不采用超重框架和获得更多灵活性方面达到了非常好的平衡.
一旦确定了路由,就需要开始`read request`和写入`read response`.

对于本文,我们假设您只处理`JSON`.

## 3.write-response(返回响应)

Go的官方标准库通过`encoding/json`包提供了出色的JSON支持.假设您有一个用户对象,您想用`JSON`格式的用户对象写一个200 OK的响应.

```go
func (h *Handlers) GetUserProfile(w http.ResponseWriter, r *http.Request) {
	user := // ...
	userJSON, _ := json.Marshal(user)
	w.Write(userJSON)
}
```

哎,您想把它投入生产吗?我知道您从椅子上跳起来,把早上的咖啡洒了,还大叫“不!”或者,也许不是.无论如何,让我们做得更好一点:

```go
func (h *Handlers) GetUserProfile(w http.ResponseWriter, r *http.Request) {
	user := // ...
	
	userJSON, err := json.Marshal(user)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	_, err = w.Write(userJSON)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

```

如果我用那个处理程序卷起端点并检查标题,我得到:

```go
Content-Type: text/plain; charset=utf-8
```

不,我不想那样.回到代码!

```go
// ...

w.Header().Set("content-type", "application/json")
_, err = w.Write(userJSON)
if err != nil {
	w.WriteHeader(http.StatusInternalServerError)
	return
}
```

虽然不是最好的代码片段,但它在这一点上完成了工作.还记得您在开发一个有几十条甚至上百条路线的应用程序吗?
**显然,这段代码会被重复很多次.让我们把它放到一个函数中,因为您不想重复.**

唉,那…容易吗?确定.

## 4.read-request(读取响应)

就像在Go中编组JSON一样,`encode/JSON`包支持`encode/decode JSON`.但是,显然还有更多的原因.web开发的十诫之一是“不要相信用户的输入”(我可能是编造的,但这很重要).
不相信输入的一个方面是验证.您希望确保得到的输入在应用程序能够处理的范围内.
因为我没有心情编写可以执行各种验证的包(谁还记得验证电子邮件的正则表达式?),所以我快速地在谷歌中搜索并找到[`Go Validator`](https://github.com/asaskevich/govalidator)包来做参数校验.
下面的代码从请求体读取,将其解包到一个结构体中,并使用`GoValidator`对其进行验证.在任何时候,如果失败,我们将发送回一个400错误的请求状态.

```go
var user User

err := json.NewDecoder(r.Body).Decode(&user)
if err != nil {
	// having learned our lesson from the previous section, we've refactored this code into its own function
	RespondBadRequest(w, err)
	return
}

ok, err := govalidator.ValidateStruct(body)
if !ok {
	RespondBadRequest(w, err)
	return
}

// user is valid and hydrated!
```

您知道这个练习—将其放入函数中,并在所有路由中重用它.
现在,您已经编写了一些函数来简化应用程序的开发.
如果您对您的函数很好,您甚至可以把它们放到自己的包中,添加一些测试和文档.下次编写新应用程序时,您可以重用这些代码!
如果您觉得慷慨,您可以把它开源,让别人使用.
现在,每个人都可以通过这个舞蹈或者他们可以使用您的解决方案.
您认为您的包符合web框架的条件吗?
我不.它更像是一个工具箱,可以帮助开发Go中的web应用程序.
然而,有一件事是缺失的:把所有东西组合在一起——“粘合代码”.它可以建立模式(希望是好的模式),使您的代码更加模块化,可重用和可测试.
在此之前,让我们先来看看围棋应用程序的另一个重要方面.

## 5.数据库和app设置

现在已经是2019年了,`SQ`L已经卷土重来.假设这是您的选择,您可以利用Go的`database/sql`包来查询数据库.它只需要一些样板:
读取您的配置文件
打开数据库连接
应用程序退出时关闭数据库连接
这很容易做到.但不是微不足道的.即使使用流行的Go ORM(如GORM),仍然需要将数据库连接的生命周期与应用程序的生命周期同步.
此外,如果需要某些特性,比如每个请求事务,则需要手动添加这些特性.
我并不怀疑您高超的编程技能,也完全相信您能够完美地实现这一点,但是像我这样的人往往会忘记这些代码片段,希望它们是可重用的.特别是,因为我想在我开发的每个应用程序中都使用它.
读取配置和设置数据库连接属于应用程序的“设置”阶段.您可能希望在启动`HTTP`服务器之前这样做.
主要功能似乎是合理的.让我们来看看这个主要功能可以变成什么:

```go
// main.go
package main

func main() {
	rand.Seed(time.Now().UnixNano())

	globals.cookies = gorillaSessions.NewCookieStore([]byte("Very Secret"))
	globals.cookies.MaxAge(int((24 * time.Hour).Seconds()))

	dbsetup()
	defer globals.db.Close()

	configsetup()
	awssetup()
	jobssetup()
	redissetup()
	servicesSetup()

	router := makeRouter()

	server := &graceful.Server{
		Timeout: 10 * time.Second,
		Server: &http.Server{
			Handler:      router,
			Addr:         fmt.Sprintf("%s:%d", globals.config.HTTPHost, globals.config.HTTPPort),
			WriteTimeout: 15 * time.Second,
			ReadTimeout:  15 * time.Second,
		},
	}

	log.Printf("Listening on http://%s:%d", globals.config.HTTPHost, globals.config.HTTPPort)

	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
```

全局,无优雅关机,不可高的`main`函数.您不想这样.您想要这样的:

```go
// cmd/web/main.go
package main

func main() {
	myapp.Web.Run()
}
```

相信我,我并没有在Run方法后面隐藏所有内容.这两个都是我编写的应用程序,我对其中一个(您的猜测)很满意.
鉴于我对GO的热爱,我不会只给您留下问题而没有解决办法.
我提出的解决方案是一个轻量级的基于依赖注入的web框架,它可以模块化您的应用程序.

## 6.致谢

- [asaskevich/govalidator](https://github.com/asaskevich/govalidator)
- [Gorilla Mux](http://www.gorillatoolkit.org/pkg/mux)
