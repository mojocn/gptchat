---
layout: post
title: mysql一键生成APIs应用
category: Golang
tags: golang
description: mysql数据库一行命令生成GIN+GORM RESTful APIs golang应用
date: 2018-12-26T13:19:54+08:00
---

## [MySQL数据库生成RESTful APIs APP](https://github.com/libragen/ginbro)

##### ginbro,**GinBro**,Gimbo,GimBro,**Jimbo**,GinOrm or GinGorm

## Feature

- 自动生成完善的swagger(postman)文档
- 可以serve SPA应用(比如vuejs全家桶)
- 快速使用golang+gin+gorm改造依赖mysql项目

## ginbro工具安装

您可以通过如下的方式安装 ginbro 工具：

```shell
go get github.com/libragen/ginbro
```

安装完之后,`ginbro` 可执行文件默认存放在 `$GOPATH/bin` 里面,所以您需要把 `$GOPATH/bin` 添加到您的环境变量中,才可以进行下一步.
如何添加环境变量,请自行搜索
如果您本机设置了`GOBIN`,那么上面的命令就会安装到 `GOBIN`下,请添加`GOBIN`到您的环境变量中

### 如果没有配置GOBIN到环境变量,执行下面命令

```shell
cd $GOPATH/src/github.com/libragen/ginbro
go build
./ginbro -h
```

## 使用

`ginbro gen -u root -p PASSWORD -a "127.0.0.1:3306" -d dbname -o "github.com/mojocn/apiapp"`

- cd 到生成的项目
- go build 和run
- 访问[`http://127.0.0.1:5555/swagger`](http://127.0.0.1:5555/swagger)

### 生成新project目录树 [ginbro-son DEMO代码](https://github.com/libragen/ginbro-son)

```shell
C:\Users\mojotv.cn\go\src\github.com\mojocn\apiapp>tree /f /a
Folder PATH listing
Volume serial number is 8452-D575
C:.
|   2018-11-15-app.log
|   config.toml
|   main.go
|   readme.md
|
+---config
|       viper.go
|
+---handlers
|       gin.go
|       handler_wp_litespeed_img_optm.go
|       handler_wp_litespeed_optimizer.go
|       handler_wp_posts.go
|       handler_wp_users.go
|       handler_wp_yoast_seo_links.go
|
+---models
|       db.go
|       model_wp_litespeed_img_optm.go
|       model_wp_litespeed_optimizer.go
|       model_wp_posts.go
|       model_wp_users.go
|       model_wp_yoast_seo_links.go
|
+---static
|   |   .gitignore
|   |   index.html
|   |   readme.md
|   |
|   \---index_files
|           jquery.js.download
|           style.css
|           syntax.css
|
\---swagger
        .gitignore
        doc.yml
        favicon-16x16.png
        favicon-32x32.png
        index.html
        oauth2-redirect.html
        readme.md
        swagger-ui-bundle.js
        swagger-ui-standalone-preset.js
        swagger-ui.css
        swagger-ui.js
```

### 命令参数说明

```shell
ginbro gen -h
generate a RESTful APIs app with gin and gorm for gophers. For example:
        ginbro gen -u eric -p password -a "127.0.0.1:3306" -d "mydb"

Usage:
  create gen [flags]

Flags:
  -a, --address string    mysql host:port (default "dev.mojotv.com:3306")
  -l, --appAddr string    app listen Address eg:mojotv.cn, use domain will support gin-TLS (default "127.0.0.1:5555")
  -c, --charset string    database charset (default "utf8")
  -d, --database string   database name (default "dbname")
  -h, --help              help for gen
  -o, --out string        golang project package name of your output project. eg: github.com/awesome/my_project, the project will be created at $GOPATH/src/github.com/awesome/my_project (default "github.
com/dejavuzhou/gin-project")
  -p, --password string   database password (default "Password")
  -u, --user string       database user name (default "root")
```

## 环境

- 我的开发环境
    - Windows 10 专业版 64位
    - go version go1.11.1 windows/amd64
    - mysql 数据库 <= 5.7

## 依赖 go packages

```shell
go get github.com/gin-contrib/cors
go get github.com/gin-contrib/static
go get github.com/gin-gonic/autotls
go get github.com/gin-gonic/gin
go get github.com/sirupsen/logrus
go get github.com/spf13/viper
go get github.com/spf13/cobra
go get github.com/go-redis/redis
go get github.com/go-sql-driver/mysql
go get github.com/jinzhu/gorm
```

## 开发计划

- [ ] 支持PostgreSQL数据库
- [x] 支持一键生产jwt密码验证
- [ ] 支持MongoDB数据库
- [ ] 更具数据映射关联模型
- [x] 分页总数做redis缓存
- [ ] 支持生成gRPC服务
- [x] 更详细的gorm tag信息
- [x] json不现实password等隐私字段
- [x] swaggerDoc参数说明继续优化
- [x] 生成友好的.gitignore
- [x] 完善go doc
- [x] [CI/CD travis](https://travis-ci.org/dejavuzhou/ginbro)
- [ ] 支持其他语言框架(php-laravel/lumne ,python flask ...)

## 注意

- mysql表中没有id/ID/Id/iD字段将不会生成路由和模型
- json字段 在update/create的时候 必须使可以序列号的json字符串(`eg0:"{}" eg1:"[]"`),否则mysql会报错

## Youtube Video

<iframe width="560" height="315" src="https://www.youtube.com/embed/TvWQhNKfmCo" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## 致谢

- [gin-gonic/gin框架](https://github.com/gin-gonic/gin)
- [GORM数据库ORM](http://gorm.io/)
- [viper配置文件读取](https://github.com/spf13/viper)
- [cobra命令行工具](https://github.com/spf13/cobra#getting-started)
- [我的另外一个go图像验证码开源项目](https://github.com/mojocn/base64Captcha)

## 请各位大神不要吝惜提[`issue`](https://github.com/libragen/ginbro/issues)同时附上数据库表结构文件