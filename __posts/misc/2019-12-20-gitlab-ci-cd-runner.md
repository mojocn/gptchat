---
layout: post
title: "Gitlab-CI之gitlab-runner教程"
category: Misc
tags: Git
keywords: "windows10,子系统,linux gitlab-runner, gitlab-ci,教程"
description: "windows10-子系统-linux-gitlab-ci-runner搭建配置教程"
coverage: ci_cd_pipe.png
permalink: /misc/:title
date: 2019-12-20T11:23:45+08:00
---

若干年前自己曾经也搭建过gitlab服务和gitlab-runner,因为当时shell/bash环境运行机制初入门.
对很多概念不是很理解,依葫芦画瓢,没有自己的见解.但是网络环境也没有在这么复杂.

因为公司开发服务器集群和公司内部的私有Gitlab服务内部防火墙网络不通.公司内部网络安全规章制度,
导致申请公司服务器集群和gitlab服务器之间的互通非常麻烦和繁琐.
应为自己开发电脑可以访问gitlab服务器和开发服务器,而开发服务器和gitlab服务之间不同.
索性就使用自己的windows10子系统ubuntu作为gitlab-runner来完成项目的测试编译部署的工作,同时做部署的中转站.

## 1. Windows10 ubuntu子系统安装gitlab-runner

因为我们公司内网做了层层隔离,申请集群之间的互通非常麻烦,万不得已就使用自己的开发电脑运行gitlab-runner.
其中有一个缺点就是每次电脑关机必须要到 window10-ubuntu 中运行`sudo  gitlab-ci-multi-runner start` 来启动gitlab-ci-multi-runner.

### 1.1 找到适合自己版本的gitlab-runner

- 产看自己的gitlab服务的版本号git-hash值
- 根据版本好确定gitlab版本号的commit时间
- 根据gitlab-commit导致推测出gitlab-runner版本号,`https://gitlab-ci-multi-runner-downloads.s3.amazonaws.com/v1.10.0/index.html`  其中`v1.10.0` 可以替换成您想要的版本号

笔者的gitlab 公司服务版本号 `GitLab Community Edition 8.13.3 8d79ab3` 可以知道这边版本是2016.11.02发布的, 对应的是gitlab-runner v1.7.1.
由于我找不到gitlab-runner v1.7.1版本, 就是用4个月之后的版本 v1.10.0.
我就使用
`https://gitlab-ci-multi-runner-downloads.s3.amazonaws.com/v1.10.0/index.html` (v1.10.0 可以替换成您想要的版本)

### 1.2 安装gitlab-runner和sshpass到windows10-linux

在我的windows10-ubuntu中运行一下命令

```bash
# 切换到root权限
sudo su
wget https://gitlab-ci-multi-runner-downloads.s3.amazonaws.com/v1.10.0/deb/gitlab-ci-multi-runner_amd64.deb
#安装gitlab-runner
dpkg -i gitlab-ci-multi-runner_amd64.deb
# windows10-linux 安装docker总是失败

# 安装sshpass 来免输入ssh 账号密码
apt install sshpass
```

#### 安装servie和启动:

    sudo gitlab-ci-multi-runner start

#### 创建user:

`sudo useradd --comment 'GitLab Runner' --create-home gitlab-runner --shell /bin/bash`

#### 添加开机启动

`gitlab-ci-multi-runner install -n gitlab-runner -d /home/gitlab-runner -u gitlab-runner`

### 1.3 使用gitlab-ci-multi-runner注册Runner

安装好gitlab-ci-multi-runner这个软件之后,我们就可以用它向GitLab-CI注册Runner了.
向GitLab-CI注册一个Runner需要两样东西：GitLab-CI的url和注册token.
其中,token是为了确定您这个Runner是所有工程都能够使用的Shared Runner还是具体某一个工程才能使用的Specific Runner.
如果要注册Shared Runner,您需要到管理界面的Runners页面里面去找注册token.如下图所示：

![](/assets/image/gitlab_runner_register.webp.jpg)

如果要注册Specific Runner,您需要到项目的设置的Runner页面里面去找注册token.如下图所示：

![](/assets/image/gitlab_runner_register2.webp.jpg)

****记住token****

### 1.4 gitlab-runner配置token发现gitlab服务

回到windows10-子系统BASH终端中配置runner

1. 执行 `gitlab-ci-multi-runner register`
2. 指定git的URL
   Please enter the gitlab-ci coordinator URL (e.g. https://gitlab.com )
   https://gitlab.com
3. 指定gitlab-runner的token(上一部注册的runner的token)
   Please enter the gitlab-ci token for this runner
4. 关联git和runner的tag
   Please enter the gitlab-ci tags for this runner (comma separated):
   my-tag,another-tag
5. 给tag的描述
   Please enter the gitlab-ci description for this runner
   [hostame] my-runner
5. 选择runner的执行环境
   Please enter the executor: ssh, docker+machine, docker-ssh+machine, kubernetes, docker, parallels, virtualbox, docker-ssh, shell:
   shell (Linux可以在本机器上运行)
   若选择docker,则需要下一步,windows10子系统linux安装docker总是启动不了,原因不明,建议不要使用docker
6. 指定docker的image
   Please enter the Docker image (eg. golang:1.13.5):
   alpine:latest

#### 名称解释

- url：私有gitlab的路径
- token：项目的token,用于关联runner和项目
- name：runner的名字,用于区分runner
- tags：用于匹配任务（jobs）和执行任务的设备（runners）
- executor：执行环境

配置完成之后可以看到一下配置内容

![](/assets/image/gitlab_runner_register3.jpg)

### 1.5 关闭windows10防火墙

![](/assets/image/gitlab_runner_firewal.png)

### 1.6 ubuntu 安装node 指定版本

所以在终端执行：
`curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -`

稍等片刻,源已经添加完毕,再执行：
`sudo apt-get install -y nodejs` 等待安装完成.

顺带一提,如果您要安装12.x.x 的版本,只需要修改添加源地址中的数字即可,比如：
`curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -`

## 2. Golang部署示例.gitlab-ci.yml

```yaml
# runner 安装文件   https://gitlab-ci-multi-runner-downloads.s3.amazonaws.com/v1.10.0/index.html
# 我的windows10 子系统linux里面安装docker失败导致 gitlab-ci不能使用docker,所以直接编译go二进制可执行文件 scp到开发服务器上执行

before_script:
  - uname -a #查看系统信息
  - whoami
  - go version
  - export GOPROXY=https://goproxy.io
  - export VERSION=$(git describe --tags --always)
  - export DHOST='felix@mojotv.cn'  #设置环境变量 ssh 账号和host

stages:
  - build
  - deploy

buildBin:
  stage: build
  script:
    - pwd
    - ls -al
    - BRANCH=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD)
    - BTIME=$(date -u '+%Y-%m-%dT%I:%M:%S%p')
    - GHASH=$(git rev-parse HEAD)
    - go build -ldflags "-X main.Build=$BTIME -X main.Version=$GHASH" -o _build/csbrain.exe
    - _build/csbrain.exe -V
    - echo "开始推送到mojotv 服务器"
    - mv config.toml.test _build/config.toml
    - echo $DHOST
    - echo "-o StrictHostKeyChecking=no  不弹出known host 对话框"
    - sshpass -e ssh -o StrictHostKeyChecking=no $DHOST "cd /data/csbrain && sudo rm -rf *"  # sshpass -e 帮助您把设置windows10-linux中 $SSHPASS 环境变量 输入密码ssh密码
    - sshpass -e scp -o StrictHostKeyChecking=no -r _build/* $DHOST:/data/csbrain # sshpass -e 帮助您把设置windows10-linux中 $SSHPASS 环境变量 输入密码ssh密码
    - echo "可执行文件已经上传到测试服务器"

  only:
    - develop
    - master
    - release
    - /^release/.*$/
    - feature

deployMojoTechServer:
  stage: deploy
  script:
    - echo '重启 supervisor csbrain.exe 部署服务器通过supervisor来启动golang可执行程序'
    - echo "-o StrictHostKeyChecking=no  不弹出known host 对话框"
    - sshpass -e ssh -o StrictHostKeyChecking=no $DHOST "sudo supervisorctl restart all || true" #重启supervisor
    - echo "测试API和显示Git hash 编译时间"
    - sleep 2 &&  curl http://cigitlab.mojotv.cn:8080/info #检查api服务的编译版本号

  only:
    - develop
    - master
    - release
    - /^release/.*$/
    - feature
```

运行效果
![](/assets/image/gitlab_runner_register4.jpg)
