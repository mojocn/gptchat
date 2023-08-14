---
layout: post
title: "Go进阶42:App SQL偶尔出现的bug猜想和解决"
category: Golang
tags: Go进阶 
keywords: "mysql,pprof"
description: "定位一个偶尔出现的bug,代码检查和pprof"
coverage: accasionally_bug.jpg
permalink: /go/:title
date: 2020-06-15T15:06:00+08:00
---

## 1. 背景

我们项目中出现一个偶然性的bug,项目后端api-app运行一段时间之后,出现sql语句执行return 0 rows,而gorm打印出来的sql语句是正确的,但是在golang runtime里面执行的结果是空(select 数据 0
rows),
sql语句paste到终端中执行是可以得到正确的结果.
如果重新启动golang app,这个bug就消失了.

环境:

- go version go1.13.1 linux/amd64
- docker mysql:5.7
- golang后端多人开发

如果任意API查询不到数据就会导致,用户401,用户需要重新登陆用户,
就导致登陆接口提供用户名和密码错误.最终这个bug被指向用户登陆接口.

## 3. 猜想

对于这个bug出现的原因,我咨询其他项目的同事,综合起来根据可能性由小到大的顺序:

1. xhr过来的数据包含特殊的字符或者看不见的其他语言的空格或者其他拉丁体系字母(这个问题是可以排除因为是偶然和后端app重启就修复)
2. docker数据库不稳定导致,这个问题可以被排除,原因同上
3. gorm 这个golang package 设计又问题,这个问题也可以排除,我到他的issue 库中搜索没有出项这样的问题. https://github.com/go-gorm/gorm/issues/3034 这个一个类似的问题
4. 定时任务和etl导致数据表被锁定使查询结果为空,理论上数据表锁定一般使针对update/insert/delete不会针对select
5. golang goroutine 管理导致 msyql 连接池消耗尽, 这个问题我在后面的 pprof进行排除
6. 代码中使用 db.Begin() 不规范导致 开启事务时导致 db.Commit/db.Rollback被遗忘,导致大量msqyl链接不占用,得不到回收
7. 代码中使用 db.Rows() 不规范导致 没有调用defer rows.Close,导致mysql一直deadlock

我们重点关注5,6,7这三条原因,

## 4. 解决

### 4.1 解决golang transaction不规范的问题

transaction 不规范体现在这个项目中主要有两点:

- 把没有必要的select语言放在transaction中导致,transaction时间过长
- 遗忘`.Rollback()` `.Commit()`

在这里我更推荐使用 `tx.Transaction(func(tx *gorm.DB) (err error) {...}` 这中写法更佳直观简洁,不容易遗忘rollback,commit.
***同时不要无脑的向transation中添加select语句,尽最大可能使transaction中只包含 update/create/delete***
我采取的行动是全局搜索关键词 `.Begin()` 把他们全部替换成 `tx.Transaction(func(tx *gorm.DB) (err error) {...}` 这个种写法,同时把一些不必要的select 语句在transaction之前执行.

### 4.2 解决.Rows() 遗忘执行 `defer rows.Close()`

遗忘执行`defer rows.Close()`的危害 https://github.com/golang/go/issues/24329
同样全局搜索 `.Rows()` 检查和添加遗漏的 `defer rows.Close()`

### 4.3 使用 `net/http/pprof/` 定位异常goroutine

直接上代码

```go
import "net/http/pprof"

func pprofHandler(h http.HandlerFunc) gin.HandlerFunc {
	handler := http.HandlerFunc(h)
	return func(c *gin.Context) {
		handler.ServeHTTP(c.Writer, c.Request)
	}
}

....
	
	ginRootPath := gin.New()
	if common.Cfg.Env != "prod" {
		prefixRouter := ginRootPath.Group("debug/pprof")
		prefixRouter.GET("/", pprofHandler(pprof.Index))
		prefixRouter.GET("/cmdline", pprofHandler(pprof.Cmdline))
		prefixRouter.GET("/profile", pprofHandler(pprof.Profile))
		prefixRouter.POST("/symbol", pprofHandler(pprof.Symbol))
		prefixRouter.GET("/symbol", pprofHandler(pprof.Symbol))
		prefixRouter.GET("/trace", pprofHandler(pprof.Trace))
		prefixRouter.GET("/allocs", pprofHandler(pprof.Handler("allocs").ServeHTTP))
		prefixRouter.GET("/block", pprofHandler(pprof.Handler("block").ServeHTTP))
		prefixRouter.GET("/goroutine", pprofHandler(pprof.Handler("goroutine").ServeHTTP))
		prefixRouter.GET("/heap", pprofHandler(pprof.Handler("heap").ServeHTTP))
		prefixRouter.GET("/mutex", pprofHandler(pprof.Handler("mutex").ServeHTTP))
		prefixRouter.GET("/threadcreate", pprofHandler(pprof.Handler("threadcreate").ServeHTTP))
	}
```

当app出现相同的错误的时候您查看 `http://*:5050/debug/pprof/` 关注一下goroutine的数量和关键字sql相关的项目就可以进行快捷排查

### 4.4 在数据初始化连接的时候进行一些限制

- db.DB().SetConnMaxLifetime(10 * time.Minute)
- db.DB().SetMaxIdleConns(10)
- db.DB().SetMaxOpenConns(50)

```go
//NewSql 创建GORM连接
func NewSql(user, password, addr, database, logFileName string, verbose bool) (db *DB, err error) {
	conn := fmt.Sprintf("%s:%s@(%s)/%s?charset=utf8&parseTime=True&loc=Local", user, password, addr, database)
	db, err = gorm.Open("mysql", conn)
	if err != nil {
		return
	}
	db.DB().SetConnMaxLifetime(10 * time.Minute)
	db.DB().SetMaxIdleConns(10)
	db.DB().SetMaxOpenConns(50)
	db.LogMode(verbose)
	if verbose && logFileName != "" {
		f, _ := os.Create(fmt.Sprintf("%s.%s.log", logFileName, database))
		db.SetLogger(log.New(f, "\r\n", log.LstdFlags|log.Llongfile))
	}
	return
}
```

## 5. 结论

- 偶尔出现的bug一般是内存或者goroutine长时间没有释放导致的
- 如果出现偶然随机性的bug优先使用pprof进行bug定位
- 不追求过分的设计,但是要简洁易懂易维护的代码
- 良好的编程习惯,熟悉各种golang closer
