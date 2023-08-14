---
layout: post
title: 使用golang Lora开发一个图像界面GUI应用
category: Golang
tags: golang GUI
date: 2018-12-26T13:19:54+08:00
description: 个非常小的库,用于在Go中构建现代HTML5桌面应用程序. 它使用Chrome浏览器作为UI层. 与Electron不同,它不会将Chrome捆绑到应用程序包中,而是重用已安装的那个. Lorca建立了与浏览器窗口的连接,允许从UI调用Go代码并以无缝方式从Go操作UI.
---

## 1.简介

[zserge/lorca](https://github.com/zserge/lorca)一个非常小的库,用于在Go中构建现代HTML5桌面应用程序. 它使用Chrome浏览器作为UI层. 与Electron不同,它不会将Chrome捆绑到应用程序包中,而是重用已安装的那个.
Lorca建立了与浏览器窗口的连接,允许从UI调用Go代码并以无缝方式从Go操作UI.

### 1.1原理

Lorca使用Chrome DevTools协议来检测Chrome实例.
首先,Lorca尝试找到已安装的Chrome,启动绑定到临时端口的远程调试实例,并从stderr读取实际的WebSocket端点. 然后Lorca打开与WebSocket服务器的新客户端连接,并通过WebSocket发送Chrome
DevTools协议方法的JSON消息来监控Chrome.
JavaScript函数在Chrome中进行评估,而Go函数实际上在Go运行时运行,返回的值将发送到Chrome.

## 2.代码实例

[Examples/counter](https://github.com/zserge/lorca/tree/master/examples/counter)代码分析

这是一个简单的计数器demo

### 2.1[Examples/counter](https://github.com/zserge/lorca/tree/master/examples/counter)代码文件结构功能说明

- `./icons` 图标文件夹
- `./www` html GUI目录
- `./assets.go` www目录的代码被`gen.go`文件转化生成 go文件.这样就可以html的内容可以打包到编译之后的二进制文件了
- `build_linux.sh` linux编译脚本
- `build_macos.sh` macos编译脚本
- `build_windows.bat` windows编译脚本
- `counter.gif` 可执行文件的运行效果图片
- `gen.go` 定义了 [go generate 命令(教程)](https://mojotv.cn/2018/11/30/golang-generate.html),包www中静态资源生成成`assets.go`代码
- `main.go` 计时器的主要逻辑代码

#### 重点解析一下`main.go`代码

```go
//go:generate go run -tags generate gen.go

package main

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"sync"

	"github.com/zserge/lorca"
)

// Go types that are bound to the UI must be thread-safe, because each binding
// is executed in its own goroutine. In this simple case we may use atomic
// operations, but for more complex cases one should use proper synchronization.
type counter struct {
	sync.Mutex
	count int
}

func (c *counter) Add(n int) {
	c.Lock()
	defer c.Unlock()
	c.count = c.count + n
}

func (c *counter) Value() int {
	c.Lock()
	defer c.Unlock()
	return c.count
}

func main() {
	ui, err := lorca.New("", "", 480, 320)
	if err != nil {
		log.Fatal(err)
	}
	defer ui.Close()

	// A simple way to know when UI is ready (uses body.onload event in JS)
	ui.Bind("start", func() {
		log.Println("UI is ready")
	})

	// Create and bind Go object to the UI
	c := &counter{}
	ui.Bind("counterAdd", c.Add)
	ui.Bind("counterValue", c.Value)

	// Load HTML.
	// You may also use `data:text/html,<base64>` approach to load initial HTML,
	// e.g: ui.Load("data:text/html," + url.PathEscape(html))

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	defer ln.Close()
	go http.Serve(ln, http.FileServer(FS))
	ui.Load(fmt.Sprintf("http://%s", ln.Addr()))

	// You may use console.log to debug your JS code, it will be printed via
	// log.Println(). Also exceptions are printed in a similar manner.
	ui.Eval(`
		console.log("Hello, world!");
		console.log('Multiple values:', [1, false, {"x":5}]);
	`)

	// Wait until the interrupt signal arrives or browser window is closed
	sigc := make(chan os.Signal)
	signal.Notify(sigc, os.Interrupt)
	select {
	case <-sigc:
	case <-ui.Done():
	}

	log.Println("exiting...")
}
```

- `go:generate go run -tags generate gen.go` 调用gen.go的方法打包www的资源
- `type counter struct` 必须继承`sync.Mutex`,定义`Add`方法和`Value`取值方法
- `locar.New` 定义windows大小
- `ui.Bind` 绑定golang方法到事件,让浏览器js代码调用
- `ln, err := net.Listen("tcp", "127.0.0.1:0")` 监听本机为占用的端口
- `go http.Serve(ln, http.FileServer(FS))` 把被gen.go 生成asset.go中的www内容通过本地为占用的端口,传输给浏览器
- `ui.Eval` 执行js代码
- `signal.Notify(sigc, os.Interrupt)` 监听打断等信号(control+c ...等关闭信号)

## 3.实例教程

接下来我们就使用vuejs+elementUI来创建一个简单的GUI程序

### 3.1创建vuejs-spa

[前端代码结构](https://github.com/libragen/ginbro/tree/master/gui/ginbro-spa)
vuejs第一个页面就是执行`Home.vue`

`ginbro/gui/ginbro-spa/src/views/Home.vue`代码内容

```html
<template>
    <el-form ref="form" :model="form" label-width="160px">
        <el-form-item label="address">
            <el-input v-model="form.mysqlAddr" placeholder="1270.0.0.1:3306"></el-input>
        </el-form-item>
        <el-form-item label="user">
            <el-input v-model="form.mysqlUser"></el-input>
        </el-form-item>
        <el-form-item label="password">
            <el-input v-model="form.mysqlPassword"></el-input>
        </el-form-item>
        <el-form-item label="database">
            <el-input v-model="form.mysqlDatabase" placeholder="the database to create RESTful app"></el-input>
        </el-form-item>
        <el-form-item label="database">
            <el-radio v-model="form.mysqlCharset" label="utf8">utf8</el-radio>
            <el-radio v-model="form.mysqlCharset" label="utf8mb4">utf8mb4</el-radio>
        </el-form-item>
        <el-form-item label="login table">
            <el-input v-model="form.authTable" placeholder="the table for login auth"></el-input>
        </el-form-item>
        <el-form-item label="password column">
            <el-input v-model="form.authPassword" placeholder="the column for password verification"></el-input>
        </el-form-item>
        <el-form-item label="app listen">
            <el-input v-model="form.appListen" placeholder="app listening address"></el-input>
        </el-form-item>
        <el-form-item label="package">
            <el-input v-model="form.outPackage" placeholder="the path relative to $GOPATH/src"></el-input>
        </el-form-item>

        <el-form-item>
            <el-button type="primary" @click="onSubmit">Generate</el-button>
            <el-button>Cancel</el-button>
        </el-form-item>
    </el-form>
</template>

<script>
    // @ is an alias to /src
    import HelloWorld from '@/components/HelloWorld.vue'
    export default {
        data() {
            return {
                form: {
                    mysqlAddr: '127.0.0.1:3306',
                    mysqlUser: 'root',
                    mysqlPassword: 'password',
                    mysqlDatabase: 'dbname',
                    mysqlCharset: 'utf8',
                    appListen: '127.0.0.1:5555',
                    authTable: 'users',
                    authPassword: 'password',
                    outPackage: 'ginbro-demo'
                },
                msg:""
            }
        },
        methods: {
            onSubmit() {
                mysqlGen(this.form).then(rsp => {
                    console.log(rsp)
                    this.$message({
                        message:rsp,
                        type: 'success'
                    });
                }).catch( err =>{
                    console.log(rsp)
                    this.$message({
                        message: err,
                        type: 'error'
                    });
                })
              
            }
        }
    }
</script>
```

#### `mysqlGen` vuejs中调用locra绑定的go语言方法:[`ui.Bind("mysqlGen", c.MysqlGen)`](https://github.com/libragen/ginbro/blob/master/gui/main.go)

mysqlGen 发送json参数到go服务,go通过unmarshal 得到放回的struct 参数执行逻辑
通过通过promise得到go绑定方法的返回结果

### 3.2详解`function.go`文件

```go
package main

import (
	"github.com/libragen/ginbro/parser"
	"sync"
)

// Go types that are bound to the UI must be thread-safe, because each binding
// is executed in its own goroutine. In this simple case we may use atomic
// operations, but for more complex cases one should use proper synchronization.
type guiFunction struct {
	sync.Mutex
	result string
}

type args struct {
	MysqlUser     string `json:"mysqlUser"`
	MysqlPassword string `json:"mysqlPassword"`
	MysqlAddr     string `json:"mysqlAddr"`
	MysqlDatabase string `json:"mysqlDatabase"`
	MysqlCharset  string `json:"mysqlCharset"`
	OutPackage    string `json:"outPackage"`
	AppListen     string `json:"appListen"`
	AuthTable     string `json:"authTable"`
	AuthPassword  string `json:"authPassword"`
}

package main

import (
	"github.com/libragen/ginbro/parser"
	"sync"
)

// Go types that are bound to the UI must be thread-safe, because each binding
// is executed in its own goroutine. In this simple case we may use atomic
// operations, but for more complex cases one should use proper synchronization.
type guiFunction struct {
	sync.Mutex
	result string
}

type args struct {
	MysqlUser     string `json:"mysqlUser"`
	MysqlPassword string `json:"mysqlPassword"`
	MysqlAddr     string `json:"mysqlAddr"`
	MysqlDatabase string `json:"mysqlDatabase"`
	MysqlCharset  string `json:"mysqlCharset"`
	OutPackage    string `json:"outPackage"`
	AppListen     string `json:"appListen"`
	AuthTable     string `json:"authTable"`
	AuthPassword  string `json:"authPassword"`
}

func (c *guiFunction) MysqlGen(arg args) string {
	c.Lock()
	defer c.Unlock()
	ng, err := parser.NewGuiParseEngine(arg.MysqlUser, arg.MysqlPassword, arg.MysqlAddr, arg.MysqlDatabase, arg.MysqlCharset, arg.OutPackage, arg.AppListen, arg.AuthTable, arg.AuthPassword)
	if err != nil {
		return err.Error()
	}
	if err := ng.ParseDatabaseSchema(); err != nil {
		return err.Error()
	}
	ng.GenerateProjectCode()
	ng.GoFmt()
	return "your ginbro project is created at " + ng.OutPath
} {
	c.Lock()
	defer c.Unlock()
	ng, err := parser.NewGuiParseEngine(arg.MysqlUser, arg.MysqlPassword, arg.MysqlAddr, arg.MysqlDatabase, arg.MysqlCharset, arg.OutPackage, arg.AppListen, arg.AuthTable, arg.AuthPassword)
	if err != nil {
		return err.Error()
	}
	if err := ng.ParseDatabaseSchema(); err != nil {
		return err.Error()
	}
	ng.GenerateProjectCode()
	ng.GoFmt()
	return "your ginbro project is created at " + ng.OutPath
}
```

#### `type args struct` 用来序列号vuejs发送来的参数

#### `func (c *guiFunction) MysqlGen(arg args) string` 来执行go的逻辑 放回string, js 代码自己把返回的结构展示在GUI上面

#### `type guiFunction struct ` 必须继承 `sync.Mutex` ,解决线程不安全问题

### 3.3详解`main.go`文件

```go
//go:generate go run -tags generate gen.go

package main

import (
	"fmt"
	"github.com/zserge/lorca"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
)

func main() {
	ui, err := lorca.New("", "", 480, 600)
	if err != nil {
		log.Fatal(err)
	}
	defer ui.Close()

	// A simple way to know when UI is ready (uses body.onload event in JS)
	ui.Bind("start", func() {
		log.Println("UI is ready")
	})

	// Create and bind Go object to the UI
	c := &guiFunction{}
	ui.Bind("mysqlGen", c.MysqlGen)


	// Load HTML.
	// You may also use `data:text/html,<base64>` approach to load initial HTML,
	// e.g: ui.Load("data:text/html," + url.PathEscape(html))

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	defer ln.Close()
	go http.Serve(ln, http.FileServer(FS))
	ui.Load(fmt.Sprintf("http://%s", ln.Addr()))

	// You may use console.log to debug your JS code, it will be printed via
	// log.Println(). Also exceptions are printed in a similar manner.
	ui.Eval(`

	`)

	// Wait until the interrupt signal arrives or browser window is closed
	sigc := make(chan os.Signal)
	signal.Notify(sigc, os.Interrupt)
	select {
	case <-sigc:
	case <-ui.Done():
	}

	log.Println("exiting...")
}
```

#### `ui.Bind("mysqlGen", c.MysqlGen)`绑定html按钮点击事件

### 3.4[完整代码详解](https://github.com/libragen/ginbro/tree/master/gui)

运行效果图

![](/assets/image/locra_gui_app.png)

## 总结

一个非常小的库,用于在Go中构建现代HTML5桌面应用程序. 它使用Chrome浏览器作为UI层.
与Electron不同,它不会将Chrome捆绑到应用程序包中,而是重用已安装的那个. Lorca建立了与浏览器窗口的连接,允许从UI调用Go代码并以无缝方式从Go操作UI.

- [HTTP-Reverse-Proxy反向代理nginx硬件指纹校验](/go/hardware-footprint-gui-proxy)
- [zserge/lorca](https://github.com/zserge/lorca)框架实现功能非常简单快捷,但是浏览器的右键插件的痕迹伪装的不好,如果对GUI要求不高建议hi用
- [dejavuzhou/Ginbro 一行命令生成golang RESTful API](https://github.com/libragen/ginbro)是一个非常好用的工具,让您初始化gin+mysql+jwt更加容易快捷