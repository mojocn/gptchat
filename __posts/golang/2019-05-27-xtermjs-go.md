---
layout: post
title: xterm.js-websocket Web终端堡垒机Go实现
category: Golang
tags: ssh Go进阶 xtermjs
description: 
keywords: ssh,golang,crypto/ssh,xtermjs,websocket,terminal,web终端,堡垒机
date: 2019-05-27T13:19:54+08:00
score: 5.0
published: true
--- 
[![](https://tech.mojotv.cn/assets/image/ginbro_coverage.jpg)](https://github.com/libragen/felix)



## 1.前言
因为公司业务需要在自己的私有云服务器上添加添加WebSsh终端,同时提供输入命令审计功能.

从google上可以了解到[xterm.js](https://xtermjs.org/)是一个非常出色的web终端库,包括VSCode很多成熟的产品都使用这个前端库.使用起来也比较简单.

难点是怎么把ssh命令行转换成websocket通讯,来提供Stdin,stdout输出到xterm.js中,接下来就详解技术细节.

全部代码都可以在我的[github.com/libragen/felix](https://github.com/mojocn)中可以查阅到.

## 2.知识储备

- [linux下载stdin,stdou和stderr简单概念](https://my.oschina.net/qihh/blog/55308)
- [熟悉Golang官方库golang.org/x/crypto/ssh](https://tech.mojotv.cn/2019/05/22/golang-ssh-session)
- [了解gorilla/websocket的基本用法](http://arlimus.github.io/articles/gin.and.gorilla/)
- [gin-gonic/gin](https://github.com/gin-gonic/gin),当然您也可以使用其他的路由包替代,或者直接使用标准库
- [(前端)websocket](https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket)
- [(前端)xterm.js](https://github.com/xtermjs/xterm.js)

## 3.数据逻辑图

Golang堡垒机主要功能就是把SSH协议数据使用websocket协议转发给xterm.js浏览器.

![](https://tech.mojotv.cn/assets/image/ssh2ws01.png)

### 堡垒机Golang服务UML

![](https://tech.mojotv.cn/assets/image/ssh2ws02.png)


## 4.代码实现

### 4.1创建gin Handler func
注册gin路由 `api.GET("ws/:id", internal.WsSsh)`

[ssh2ws/internal/ws_ssh.go](https://github.com/libragen/felix/blob/master/ssh2ws/internal/ws_ssh.go)

```go
package internal

import (
	"bytes"
	"github.com/libragen/felix/flx"
	"github.com/libragen/felix/models"
	"github.com/libragen/felix/utils"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"
	"net/http"
	"strconv"
	"time"
)

var upGrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024 * 1024 * 10,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// handle webSocket connection.
// first,we establish a ssh connection to ssh server when a webSocket comes;
// then we deliver ssh data via ssh connection between browser and ssh server.
// That is, read webSocket data from browser (e.g. 'ls' command) and send data to ssh server via ssh connection;
// the other hand, read returned ssh data from ssh server and write back to browser via webSocket API.
func WsSsh(c *gin.Context) {

	v, ok := c.Get("user")
	if !ok {
		logrus.Error("jwt token can't find auth user")
		return
	}
	userM, ok := v.(*models.User)
	if !ok {
		logrus.Error("context user is not a models.User type obj")
		return
	}
	cols, err := strconv.Atoi(c.DefaultQuery("cols", "120"))
	if wshandleError(c, err) {
		return
	}
	rows, err := strconv.Atoi(c.DefaultQuery("rows", "32"))
	if wshandleError(c, err) {
		return
	}
	idx, err := parseParamID(c)
	if wshandleError(c, err) {
		return
	}
	mc, err := models.MachineFind(idx)
	if wshandleError(c, err) {
		return
	}

	client, err := flx.NewSshClient(mc)
	if wshandleError(c, err) {
		return
	}
	defer client.Close()
	startTime := time.Now()
	ssConn, err := utils.NewSshConn(cols, rows, client)
	if wshandleError(c, err) {
		return
	}
	defer ssConn.Close()
	// after configure, the WebSocket is ok.
	wsConn, err := upGrader.Upgrade(c.Writer, c.Request, nil)
	if wshandleError(c, err) {
		return
	}
	defer wsConn.Close()

	quitChan := make(chan bool, 3)

	var logBuff = new(bytes.Buffer)

	// most messages are ssh output, not webSocket input
	go ssConn.ReceiveWsMsg(wsConn, logBuff, quitChan)
	go ssConn.SendComboOutput(wsConn, quitChan)
	go ssConn.SessionWait(quitChan)

	<-quitChan
	//write logs
	xtermLog := models.TermLog{
		EndTime:     time.Now(),
		StartTime:   startTime,
		UserId:      userM.ID,
		Log:         logBuff.String(),
		MachineId:   idx,
		MachineName: mc.Name,
		MachineIp:   mc.Ip,
		MachineHost: mc.Host,
		UserName:    userM.Username,
	}

	err = xtermLog.Create()
	if wshandleError(c, err) {
		return
	}
	logrus.Info("websocket finished")
}
```

代码详解

- 31~52行使用gin来获取url中的参数(js websocket库)只可以把参数定义到cookie和和url-query中,所以这里包括token(不是在header-Authorization中)在内的参数全部在url中获取
- 53~56行到数据库中获取保存的ssh连接信息
- 57~68行创建ssh-session
- 69~74行升级得到websocketConn(Reader/Writer)
- 75~85行(**核心代码**)ssh Session 和 websocket 信息进行交换和处理,同时处理好线程退出
- 86~104行处理ssh输入命令(logBuff),当session结束的时候技术输入的命令到数据库中,提供日后审计只用

#### 4.1.1 `func NewSshConn(cols, rows int, sshClient *ssh.Client) (*SshConn, error)`创建ssh-session-pty

##### I 获取stdin pipline `stdinP, err := sshSession.StdinPipe()`

##### II 初始化wsBufferWriter,赋值给ssh-session.Stdout和ssh-session.Stderr
```go
type wsBufferWriter struct {
	buffer bytes.Buffer
	mu     sync.Mutex
}

...

...
...
comboWriter := new(wsBufferWriter)
//ssh.stdout and stderr will write output into comboWriter
sshSession.Stdout = comboWriter
sshSession.Stderr = comboWriter

```
现在comboWriter就是sshSession的stdout和stderr,可以通过comboWriter获取ssh输出

### 4.2 第75~85行核心代码解析

#### 4.2.1 quitChan 用来处理 for select loop退出,代码示例

```go
	for {
		select {
		case <-quitChan:
			//exit loop
			return
		default:
			fmt.Println("do some stuff")
		}
	}
```

#### 4.2.2 `var logBuff = new(bytes.Buffer)` 暂存session中的stdin命令,websocket session 结束之后,获取`logBuff.String()`,写入数据库

**`Log:         logBuff.String(),`**

```go
...
	<-quitChan
	//write logs
	xtermLog := models.TermLog{
		EndTime:     time.Now(),
		StartTime:   startTime,
		UserId:      userM.ID,
		Log:         logBuff.String(),
		MachineId:   idx,
		MachineName: mc.Name,
		MachineIp:   mc.Ip,
		MachineHost: mc.Host,
		UserName:    userM.Username,
	}

	err = xtermLog.Create()
	if wshandleError(c, err) {
		return
	}
...
```

#### 4.2.3 `go ssConn.ReceiveWsMsg(wsConn, logBuff, quitChan)`

处理ws消息并转发给ssh-Session stdinPipe,同时暂存消息到logBuff

```go

//ReceiveWsMsg  receive websocket msg do some handling then write into ssh.session.stdin
func (ssConn *SshConn) ReceiveWsMsg(wsConn *websocket.Conn, logBuff *bytes.Buffer, exitCh chan bool) {
	//tells other go routine quit
	defer setQuit(exitCh)
	for {
		select {
		case <-exitCh:
			return
		default:
			//read websocket msg
			_, wsData, err := wsConn.ReadMessage()
			if err != nil {
				logrus.WithError(err).Error("reading webSocket message failed")
				return
			}
			//unmashal bytes into struct
			msgObj := wsMsg{}
			if err := json.Unmarshal(wsData, &msgObj); err != nil {
				logrus.WithError(err).WithField("wsData", string(wsData)).Error("unmarshal websocket message failed")
			}
			switch msgObj.Type {
			case wsMsgResize:
				//handle xterm.js size change
				if msgObj.Cols > 0 && msgObj.Rows > 0 {
					if err := ssConn.Session.WindowChange(msgObj.Rows, msgObj.Cols); err != nil {
						logrus.WithError(err).Error("ssh pty change windows size failed")
					}
				}
			case wsMsgCmd:
				//handle xterm.js stdin
				decodeBytes, err := base64.StdEncoding.DecodeString(msgObj.Cmd)
				if err != nil {
					logrus.WithError(err).Error("websock cmd string base64 decoding failed")
				}
				if _, err := ssConn.StdinPipe.Write(decodeBytes); err != nil {
					logrus.WithError(err).Error("ws cmd bytes write to ssh.stdin pipe failed")
				}
				//write input cmd to log buffer
				if _, err := logBuff.Write(decodeBytes); err != nil {
					logrus.WithError(err).Error("write received cmd into log buffer failed")
				}
			}
		}
	}
}

```

- `_, wsData, err := wsConn.ReadMessage()` 读取websocket 发送的消息
- `if err := json.Unmarshal(wsData, &msgObj); err != nil {` 序列化消息,消息结构必须前端xterm.js-websocket协商一直,建议使用
    ```go
    const (
    	wsMsgCmd    = "cmd"//处理ssh命令
    	wsMsgResize = "resize"//处理xterm.js dom尺寸变化事件,详解xterm.js文档
    )
    
    type wsMsg struct {
    	Type string `json:"type"`
    	Cmd  string `json:"cmd"`
    	Cols int    `json:"cols"`
    	Rows int    `json:"rows"`
    }
    ```
-

- `case wsMsgResize`处理xterm.js 终端尺寸变化事件
- `wsMsgCmd` 处理xterm.js 命令输入
- `if _, err := ssConn.StdinPipe.Write(decodeBytes); err != nil {` 把ws xterm.js,前端input命令写入到ssh-session-stdin-pipline
  ssh.seesion 如果检测到到 decodeBytes 包含执行符('\r'),sshSession会执行命令,包把执行结果输出到comboWriter
- `if _, err := logBuff.Write(decodeBytes); err != nil {` 把ws.xterm.js 前端input命令记录到 logBuff

#### 4.2.4 `go ssConn.SendComboOutput(wsConn, quitChan)`

把ssh.Session的comboWriter中的数据每隔120ms 通过调用`websocketConn.WriteMessage`方法返回给xterm.js+websocketClient 前端

```go
func (ssConn *SshConn) SendComboOutput(wsConn *websocket.Conn, exitCh chan bool) {
	//tells other go routine quit
	defer setQuit(exitCh)

	//every 120ms write combine output bytes into websocket response
	tick := time.NewTicker(time.Millisecond * time.Duration(120))
	//for range time.Tick(120 * time.Millisecond){}
	defer tick.Stop()
	for {
		select {
		case <-tick.C:
			//write combine output bytes into websocket response
			if err := flushComboOutput(ssConn.ComboOutput, wsConn); err != nil {
				logrus.WithError(err).Error("ssh sending combo output to webSocket failed")
				return
			}
		case <-exitCh:
			return
		}
	}
}
...
...
...
//flushComboOutput flush ssh.session combine output into websocket response
func flushComboOutput(w *wsBufferWriter, wsConn *websocket.Conn) error {
	if w.buffer.Len() != 0 {
		err := wsConn.WriteMessage(websocket.TextMessage, w.buffer.Bytes())
		if err != nil {
			return err
		}
		w.buffer.Reset()
	}
	return nil
}

```

#### 4.2.5 `go ssConn.SessionWait(quitChan)`

注意这里的go 关键字不能去掉,否在导致不能处理quitChan,导致协程泄露.

```go
func (ssConn *SshConn) SessionWait(quitChan chan bool) {
	if err := ssConn.Session.Wait(); err != nil {
		logrus.WithError(err).Error("ssh session wait failed")
		setQuit(quitChan)
	}
}
```

## 4.前端vuejs.demo代码

可以提供给前端开发人员参考,当然可以让他直接查xterm.js官方文档,但是websocket 数据库结构必须前后端协商一致

[vuejs+xterm.js+websocket示例代码](https://github.com/mojocn/felixfe/blob/master/src/components/CompTerm.vue)

```javascript
<template>
    <el-dialog :visible.sync="v"
               :title="obj.user + '@' + obj.host"
               @opened="doOpened"
               @open="doOpen"
               @close="doClose"
               center
               fullscreen
    >

    <div ref="terminal"></div>

    </el-dialog>
</template>

<script>
    import {Terminal} from "xterm";
    import * as fit from "xterm/lib/addons/fit/fit";
    import {Base64} from "js-base64";
    import * as webLinks from "xterm/lib/addons/webLinks/webLinks";
    import * as search from "xterm/lib/addons/search/search";

    import "xterm/lib/addons/fullscreen/fullscreen.css";
    import "xterm/dist/xterm.css"
    import config from "@/config/config"

    let defaultTheme = {
        foreground: "#ffffff",
        background: "#1b212f",
        cursor: "#ffffff",
        selection: "rgba(255, 255, 255, 0.3)",
        black: "#000000",
        brightBlack: "#808080",
        red: "#ce2f2b",
        brightRed: "#f44a47",
        green: "#00b976",
        brightGreen: "#05d289",
        yellow: "#e0d500",
        brightYellow: "#f4f628",
        magenta: "#bd37bc",
        brightMagenta: "#d86cd8",
        blue: "#1d6fca",
        brightBlue: "#358bed",
        cyan: "#00a8cf",
        brightCyan: "#19b8dd",
        white: "#e5e5e5",
        brightWhite: "#ffffff"
    };
    let bindTerminalResize = (term, websocket) => {
        let onTermResize = size => {
            websocket.send(
                JSON.stringify({
                    type: "resize",
                    rows: size.rows,
                    cols: size.cols
                })
            );
        };
        // register resize event.
        term.on("resize", onTermResize);
        // unregister resize event when WebSocket closed.
        websocket.addEventListener("close", function () {
            term.off("resize", onTermResize);
        });
    };
    let bindTerminal = (term, websocket, bidirectional, bufferedTime) => {
        term.socket = websocket;
        let messageBuffer = null;
        let handleWebSocketMessage = function (ev) {
            if (bufferedTime && bufferedTime > 0) {
                if (messageBuffer) {
                    messageBuffer += ev.data;
                } else {
                    messageBuffer = ev.data;
                    setTimeout(function () {
                        term.write(messageBuffer);
                    }, bufferedTime);
                }
            } else {
                term.write(ev.data);
            }
        };

        let handleTerminalData = function (data) {
            websocket.send(
                JSON.stringify({
                    type: "cmd",
                    cmd: Base64.encode(data) // encode data as base64 format
                })
            );
        };

        websocket.onmessage = handleWebSocketMessage;
        if (bidirectional) {
            term.on("data", handleTerminalData);
        }

        // send heartbeat package to avoid closing webSocket connection in some proxy environmental such as nginx.
        let heartBeatTimer = setInterval(function () {
            websocket.send(JSON.stringify({type: "heartbeat", data: ""}));
        }, 20 * 1000);

        websocket.addEventListener("close", function () {
            websocket.removeEventListener("message", handleWebSocketMessage);
            term.off("data", handleTerminalData);
            delete term.socket;
            clearInterval(heartBeatTimer);
        });
    };
    export default {
        props: {obj: {type: Object, require: true}, visible: Boolean},
        name: "CompTerm",
        data() {
            return {
                isFullScreen:false,
                searchKey:"",
                v: this.visible,
                ws: null,
                term: null,
                thisV: this.visible
            };
        },
        watch: {
            visible(val) {
                this.v = val;//新增result的watch,监听变更并同步到myResult上
            }
        },
        computed: {
            wsUrl() {
                let token = localStorage.getItem('token');
                return `${config.wsBase}/api/ws/${this.obj.ID || 0}?cols=${this.term.cols}&rows=${this.term.rows}&_t=${token}`
            }
        },

        methods: {

            onWindowResize() {
                //console.log("resize")
                this.term.fit(); // it will make terminal resized.
            },
            doLink(ev, url) {
                if (ev.type === 'click') {
                    window.open(url)
                }
            },
            doClose() {
                window.removeEventListener("resize", this.onWindowResize);
                // term.off("resize", this.onTerminalResize);
                if (this.ws) {
                    this.ws.close()
                }
                if (this.term) {
                    this.term.dispose()
                }
                this.$emit('pclose', false)//子组件对openStatus修改后向父组件发送事件通知
            },
            doOpen() {

            },
            doOpened() {
                Terminal.applyAddon(fit);
                Terminal.applyAddon(webLinks);
                Terminal.applyAddon(search);
                this.term = new Terminal({
                    rows: 35,
                    fontSize: 18,
                    cursorBlink: true,
                    cursorStyle: 'bar',
                    bellStyle: "sound",
                    theme: defaultTheme
                });
                this.term.open(this.$refs.terminal);
                this.term.webLinksInit(this.doLink);
                // term.on("resize", this.onTerminalResize);
                window.addEventListener("resize", this.onWindowResize);
                this.term.fit(); // first resizing
                this.ws = new WebSocket(this.wsUrl);
                this.ws.onerror = () => {
                    this.$message.error('ws has no token, please login first');
                    this.$router.push({name: 'login'});
                };

                this.ws.onclose = () => {
                    this.term.setOption("cursorBlink", false);
                    this.$message("console.web_socket_disconnect")
                };
                bindTerminal(this.term, this.ws, true, -1);
                bindTerminalResize(this.term, this.ws);
            },

        },


    }
</script>

<style scoped>

</style>

```

## 5. 最终效果

![](https://github.com/libragen/felix/raw/master/images/sshw5.jpg)

## 6. 完整项目代码

### 1. 快速效果预览

```bash
git clone https://github.com/libragen/felix
cd felix
go mod download

go install
echo "添加 GOBIN 到 PATH环境变量"

echo "或者"

go get github.com/libragen/felix

echo "go build && ./felix sshw"
```

执行代码`felix sshw`

### 2. Go后端代码:[ssh2ws代码地址](https://github.com/libragen/felix/tree/master/ssh2ws)

### 3. Xtermjs前端代码:[mojocn/felixfe](https://github.com/libragen/felixfe)

### 4. [【原文地址tech.mojotv.cn】](https://tech.mojotv.cn/2019/05/27/xtermjs-go)
