---
layout: post
title: golang实战:felix-slim
category: Golang
tags: golang Go进阶
description: 根据不同的业务特性进行配置集中化管理,分发文件,采集系统数据及软件包的安装与管理等
keywords: golang,gRPC+TLS,felix-slim
date: 2019-01-06T13:19:54+08:00
score: 5.0
coverage: felix_grpc.jpg
---

## 介绍

受felix-plus启发,在felix的基础上做了优化

通过部署 felix-slim 环境,运维人员可以在成千上万台服务器上做到批量执行命令,根据不同的业务特性进行配置集中化管理,分发文件,采集系统数据及软件包的安装与管理等.

- 相对于felix-plus来说部署简单,依赖简单
- 100%go代码,编译支持多平台,现在在linux(centos) 和windows10平台上继续开发和测试,其他平台未知

## 旧系统架构图

master架构

![](/assets/image/master_structure.png)

minion架构

![](/assets/image/minon_structure.png)

## Feature

- **依赖简洁**:任何linux服务器都可以执行(理论上unix服务器也可以运行 我的开发环境windows10),完全`golang` 编写支持编译成多平台可执行文件
- **安装简单**:只需要部署master和minion两个二进制文件,二进制文件第一次运行的时候会帮助您生成默认配置文件
- **gRPC+TLS**:minion和master之间通讯使用gRPC和自生成证书,通讯安全可靠,gRPC服务器之间通讯对资源要求少
- **slack收集日志**: [](https://xx.slack.com/messages/CF6R1K8CR/)

## 原理架构

minion安装机制

![](/assets/image/add_minion.png)

消息流程图

![](/assets/image/felix_flow.png)

### master功能

- 对外提供HTTP-RESTful-APIs
    - minion 管理展示服务器状态
    - 提供minion服务器注册添加接口
    - 执行shell/exe/script命令的接口
- 和minion服务器进行gRPC通讯
- 向第三方推送命令执行的日志

命令:

```bash
master服务:提供HTTP服务,也是一个gRPC客户端,保存数据到master.db(sqlite.db)

Usage:
  master [command]

Available Commands:
  help        Help about any command
  restart     master服务重启
  start       master服务启动
  stop        master服务停止
  update      master服务更新
  version     版本信息
```

### minion

- 生成自签名的私有证书
- 根据配置文件master地址,注册自己,推送私有证书公钥到master,master根据这个公钥,发布执行命令
- 提供grpc安全认证根据推送给master的私有证书公钥
- 提供grpc接口让master发布执行命令
- 提供grpc接口让master知道minon服务器健康状态

命令:

```bash
minon服务器:grpc + TLS 服务器,执行shell命名

Usage:
  minion [command]

Available Commands:
  help        Help about any command
  restart     minion服务重启
  start       minion服务启动
  stop        minion服务停止
  update      minion服务更新
  version     版本信息
```

### 部署流程

1. 安装master服务器
2. 配置master服务器的端口
3. 安装minion服务器
3. 配置master服务器的地址和端口
4. 启动minion服务器
    - minion创建私有证书
    - 推送minion信息(ip,hostname,私有证书的公钥)到master
    - master注册(保存)minon的信息到数据库(sqlite.db)
    - 启动根据私有证书启动TLS+gRPC服务
5. 重复3,4步继续添加添加minion服务器

### 命令流程

1. 第三方接口向master POST 执行脚本参数,参数说明
    - id: 脚本执行完成之后的日志推送,原封不动的返回给第三方回调接口
    - callback_url: 第三方服务自己定义接受推送的日志接口
    - cmd_line: 执行命令(包含参数) eg: `nginx reload`  `./sh.sh '参数'` `someBinary "参数"`
    - cmd_type: line 命令行 script 脚本 file 文件(任意类型)
    - file: 脚本 文件 内容.
    - minion_ip: 执行服务器的ip
2. master接受到第三方发送的执行参数
    - 查找保存在sqlite.db中对应minion服务器的公钥
    - 创建grpc+TLS连接,验证master的身份
    - 发送minion执行命令的参数
    - minion收到执行命令的参数,开始执行命令
    - minion把执行结果和日志返回给master
    - master收到执行结构和执行日志
    - 根据callback_url 推送命令执行的结构到第三方服务器
    - 第三方服务器更具ID知道支持命令和日志之间的对应关系

## 编译

### 下载代码和依赖包

```bash
cd $GOPATH/src && git clone https://github.com/libragen/felix
go get github.com/spf13/cobra
go get github.com/spf13/viper
go get github.com/gin-gonic/gin
go get github.com/jinzhu/gorm
go get github.com/mattn/go-sqlite3
go get github.com/golang/protobuf/proto
go get golang.org/x/net/context
go get google.golang.org/grpc
go get github.com/johntdyer/slackrus
```

编译和运行

- 编译运行master :`cd $GOPATH/src/felix-slim/apps/master && go build && ./master help`
- 编译运行master :`cd $GOPATH/src/felix-slim/apps/minion && go build && ./minion help`

## 安装部署

## 模块介绍

### master

### minion

## 在slack快速查看运行日志

- [slack频道邀请链接](https://join.slack.com/t/xx/shared_invite/enQtNTA5NTM1MTQzODkxLTZiYjc0YjJjYzVkOWQ2MzUyNTdhOWVmNjZkMmQ1YjY3YmUxMjE4MzM4NjBiNTNlYmViZGUyN2JkMTI0MWEwOWE)
