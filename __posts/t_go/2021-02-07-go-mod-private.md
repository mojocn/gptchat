---
layout: post
title: Go教程:26 Go mod 使用私有仓库构建
category: Tutorial
tags: [Golang, 教程]
keywords: Go语言教程,Golang教程,go mod private repo,go mod 私有仓库
description: 用go mod的时候应该会遇到无法拉取私有仓库的问题
coverage: go_mod_private_repo.png
permalink: /:categories/:title
date: 2021-01-31T13:04:54+08:00
---

## 1. go mod

go modules 是 golang 1.11 新加的特性.现在1.12 已经发布了,是时候用起来了.Modules官方定义为：

模块是相关Go包的集合.modules是源代码交换和版本控制的单元. go命令直接支持使用modules,包括记录和解析对其他模块的依赖性.modules替换旧的基于GOPATH的方法来指定在给定构建中使用哪些源文件.

有了GOPROXY后,公共module的数据获取变得十分容易,但是如果依赖的是企业内部module或托管站点上的private库,通过GOPROXY（默认值）获取显然会得到一个失败的结果,除非你搭建了自己的公私均可的goproxy
server并将其设置到GOPROXY中.
Go 1.13提供了GOPRIVATE变量,用于指示哪些仓库下的module是private,不需要通过GOPROXY下载,也不需要通过GOSUMDB去验证其校验和.不过要注意的是GONOPROXY和GONOSUMDB可以override
GOPRIVATE中的设置,因此设置时要谨慎
公司通过 gitlab 搭建了私有库,二方依赖库下载不下来怎么办?

## 2. 私有go mod package 一键配置脚本

如果你是私有的代码,那就应该配置GOPRIVATE参数（比如说go env -w GOPRIVATE=*.corp.com,github.com/secret/repo）,
或者更详细一点,使用GONOPROXY或者GONOSUMDB,这种方式比较少见.

GOPRIVATE指示pkg.mojotv.com/private下的包不经过代理下载,不经过SUMDB验证.但GONOPROXY和GONOSUMDB均为none,意味着所有module,不管是公共的还是私有的,
都要经过proxy下载,经过sumdb验证.前面提到过了,GONOPROXY和GONOSUMDB会override GOPRIVATE的设置,因此在这样的配置下,所有依赖包都要经过proxy下载,也要经过sumdb验证.不过这个例子中的GOPRIVATE的值也不是一无是处,它可以给其他go
tool提供私有module的指示信息.

```shell
#!/bin/bash -xv
# -xv shell脚本调试之用 这个参数也可以去掉

go env -w GOPROXY='https://goproxy.io' #加快 go mod 下载速度
echo '输入你私有仓库的host name eg: git.mojotv.corp.net >'

read GOPRIVATE

go env -w GOPRIVATE=$GOPRIVATE

echo '输入你的私有仓库的UserName用户名 >'

read GIT_USER
echo "访问你 https://$GOPRIVATE/profile/personal_access_tokens 创建个人访问令牌,填写gitlab-access-token >"
read GIT_TOKEN
echo '开始配置git config --global 使用access-token 验证私有仓库身份认证'
git config --global url."https://$GIT_USER:$GIT_TOKEN@$GOPRIVATE".insteadOf "https://$GOPRIVATE"
echo '现在你可以使用 go mod download (go run main.go) 继续开发你的项目吧'
```

1. 设置你私有仓库的host name eg: git.mojotv.corp.net
2. 设置你的私有仓库的UserName用户名
3. 设置gitlab-access-token, 访问你 https://$GOPRIVATE/profile/personal_access_tokens 创建个人访问令牌,填写gitlab-access-token,进入Gitlab—>Settings—>Access Tokens,然后创建一个personal
   access token,这里权限最好选择只读(read_repository),git配置添加access token.
4. 配置git config --global 使用access-token 验证私有仓库身份认证,来避免密码输入
5. 现在你可以使用 go mod download (go run main.go) 继续开发你的项目吧

## 3. dockerfile 使用私有仓库的package构建

```dockerfile
FROM golang:1.15-alpine as builder
# 安装git
RUN sed -i "s/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g" /etc/apk/repositories &&\
    apk add --no-cache git

# go mod 下载私有仓库配置
ARG GOPROXY=https://goproxy.io
# 公司gitlab 仓库domain
# 帮助go get (go mod) 确定那些package是私有仓库的package
ARG GOPRIVATE=gitlab.mojotv.net
# 公司gitlab 仓库用户名
ARG GIT_USER=ericzhou
# 公司gitlab 创建access-token https://gitlab.mojotv.cn/profile/personal_access_tokens
# 填写access-token 到下面
ARG GIT_TOKEN=your_gitlab_access_token

# 设置gitlab-access-token 帮助go get (go mod) 下载私有仓库代码
RUN git config --global url."https://$GIT_USER:$GIT_TOKEN@$GOPRIVATE".insteadOf "https://$GOPRIVATE"

#COPY 复制go mod 文件 让docker创建image 缓存
COPY go.mod .
COPY go.sum .
RUN go mod download

RUN export GITHASH=$(git rev-list -1 HEAD) && \
    export BUILDAT=$(date) && \
    go build -ldflags "-w -s -X 'mojotv.cn/app/config.BuildAt=$BUILDAT' -X 'mojotv.cn/app/config.GitHash=$GITHASH'" -o awesomeApp

```

1. `GOPROXY=https://goproxy.io `go mod 下载私有仓库配置
2. `ARG GOPRIVATE=gitlab.mojotv.net` 帮助go get (go mod) 确定那些package是私有仓库的package,同时这个也是 gitlab的域名.
3. `ARGGIT_TOKEN=your_gitlab_access_token`  公司gitlab 创建access-token https://gitlab.mojotv.cn/profile/personal_access_tokens, 进入Gitlab—>Settings—>Access Tokens,然后创建一个personal
   access token,这里权限最好选择只读(read_repository),git配置添加access token.
4. `RUN git config --global url."https://$GIT_USER:$GIT_TOKEN@$GOPRIVATE".insteadOf "https://$GOPRIVATE"` 设置gitlab-access-token 帮助go get (go mod) 下载私有仓库代码
5. COPY 复制go mod 文件 让docker创建image 缓存
6. 当然你也可以使用 ssh 和 ssh-private-key 来替代 `GIT_TOKEN` ，`git config --global --add url."git@your-repo.com:".insteadOf "https://your-repo.com/"`
